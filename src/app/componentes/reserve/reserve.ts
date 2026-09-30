import { Component, OnInit, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { MoviesService } from '../../services/movies.service';
import { MovieDetailModel } from '../../models/movie';
import { Auth } from '../../services/auth';
import { SupabaseService } from '../../services/supabase.service';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { FormsModule } from '@angular/forms';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Seat {
  tipo: string;
  activo: boolean;
  id: string;      // ej: "A-1"
  dbId: number;    // ID primario de la tabla butacas
  row: string;
  number: number;
  selected: boolean;
  occupied: boolean;
}

export interface ShowTime {
  id: number;
  salaId: number;
  roomName: string;
  format: '2D' | '3D' | '4D' | '5D' | string;
  dateStr?: string;
  audio?: 'Subtitulada' | 'Doblada' | string;
  startTime: string;
  endTime?: string;
  price: number;
}

export interface ProductoCandy {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  cantidad: number;
}

@Component({
  standalone: true,
  selector: 'app-reserve',
  templateUrl: './reserve.html',
  styleUrls: ['./reserve.css'],
  imports: [CommonModule, RouterLink, FormsModule]
})
export class Reserve implements OnInit, OnDestroy {
  private moviesService = inject(MoviesService);
  private auth = inject(Auth);
  private supabase = inject(SupabaseService).client;
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private realtimeChannel: RealtimeChannel | null = null;
  
  movie = signal<MovieDetailModel | null>(null);

  // Funciones disponibles
  showtimes = signal<ShowTime[]>([]);
  selectedShowtime = signal<ShowTime | null>(null);

  // Butacas de la sala
  seats = signal<Seat[]>([]);

  purchaseSuccess = signal<boolean>(false);
  montoConfirmado = signal<number>(0);

  // Candy Bar y Combos integrados
  candyItems = signal<ProductoCandy[]>([]);

  // Cupones y Crédito
  codigoCuponInput = signal<string>('');
  cuponAplicado = signal<{ codigo: string; porcentaje: number } | null>(null);
  mensajeCupon = signal<string | null>(null);
  creditoDisponible = signal<number>(0);
  usarCredito = signal<boolean>(false);

  // Precios y totales blindados contra NaN
  selectedSeats = computed(() => this.seats().filter(s => s.selected));

  totalButacas = computed(() => {
    const rawPrice = Number(this.selectedShowtime()?.price);
    const basePrice = rawPrice > 0 ? rawPrice : 4500;
    return this.selectedSeats().reduce((acc, seat) => {
      const isVip = seat.tipo === 'vip';
      const seatPrice = isVip ? basePrice * 1.3 : basePrice;
      return acc + seatPrice;
    }, 0);
  });

  totalCandy = computed(() => {
    return this.candyItems().reduce((acc, p) => acc + (Number(p.precio || 0) * Number(p.cantidad || 0)), 0);
  });

  subtotalGeneral = computed(() => {
    const butacas = Number(this.totalButacas()) || 0;
    const candy = Number(this.totalCandy()) || 0;
    return butacas + candy;
  });

  descuentoCuponMonto = computed(() => {
    const c = this.cuponAplicado();
    if (!c) return 0;
    const porcentaje = Number(c.porcentaje) || 0;
    return (this.subtotalGeneral() * porcentaje) / 100;
  });

  montoCreditoAplicado = computed(() => {
    if (!this.usarCredito() || this.creditoDisponible() <= 0) return 0;
    const remanente = this.subtotalGeneral() - this.descuentoCuponMonto();
    return Math.min(Number(this.creditoDisponible()) || 0, Math.max(0, remanente));
  });

  totalFinal = computed(() => {
    let total = this.subtotalGeneral() - this.descuentoCuponMonto();
    if (this.usarCredito()) {
      total = Math.max(0, total - (Number(this.creditoDisponible()) || 0));
    }
    return isNaN(total) ? 0 : Math.round(total);
  });

  cuponSugerido = signal<{ codigo: string; porcentaje: number; motivo: string } | null>(null);
  
  

  aplicarCuponDirecto(codigo: string) {
    this.codigoCuponInput.set(codigo);
    this.validarCupon();
  }

  async ngOnInit() {
    const movieId = Number(this.route.snapshot.paramMap.get('id'));
    if (!movieId) return;

    // 1. Cargar película
    const movieData = await this.moviesService.getMovieById(movieId);
    if (!movieData) return;

    this.movie.set({
      id: movieData.id,
      title: movieData.titulo,
      duration: movieData.duracion_minutos,
      genre: movieData.formato || 'General',
      rating: movieData.restriccion_edad || 'ATP',
      poster: movieData.imagen_url || '/assets/img/butacas-cine.jpg',
      synopsis: movieData.sinopsis || '',
      trailerUrl: ''
    });

    await Promise.all([
      this.cargarFunciones(movieId),
      this.cargarProductosCandy(),
      this.cargarCreditoUsuario(),
      this.verificarCuponesDisponibles()
    ]);
  }
  // En reserve.ts:
  async verificarCuponesDisponibles() {
    const user = await this.auth.getCurrentUser();
    if (!user) return;

    // 1. Datos del usuario
    const { data: perfil } = await this.supabase
      .from('perfiles')
      .select('fecha_nacimiento')
      .eq('id', user.id)
      .single();

    const edad = perfil?.fecha_nacimiento ? this.calcularEdad(perfil.fecha_nacimiento) : 0;

    // 2. Historial de compras para saber si aplica primera compra
    const { count } = await this.supabase
      .from('entradas')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', user.id)
      .neq('estado', 'cancelada');

    const esPrimeraCompra = (!count || count === 0);

    // 3. Obtener todos los cupones activos del admin
    const { data: cupones } = await this.supabase
      .from('cupones')
      .select('*')
      .eq('activo', true);

    if (!cupones || cupones.length === 0) return;

    const candidatos: { codigo: string; porcentaje: number; motivo: string }[] = [];

    for (const c of cupones) {
      const desc = Number(c.descuento_porcentaje) || 0;

      // Caso A: Cupón de Primera Compra
      if (c.solo_primera_compra && esPrimeraCompra) {
        candidatos.push({
          codigo: c.codigo,
          porcentaje: desc,
          motivo: 'Bienvenida (1° Compra)'
        });
        continue;
      }

      // Caso B: Cupón Senior (+50)
      if (c.edad_minima > 0 && edad >= c.edad_minima) {
        candidatos.push({
          codigo: c.codigo,
          porcentaje: desc,
          motivo: `Beneficio Senior (+${c.edad_minima})`
        });
        continue;
      }

      // Caso C: Cupones Generales (sin restricción de edad ni primera compra)
      if (!c.solo_primera_compra && (!c.edad_minima || c.edad_minima === 0)) {
        candidatos.push({
          codigo: c.codigo,
          porcentaje: desc,
          motivo: 'Promoción Especial'
        });
      }
    }

    // Ordenar de mayor a menor porcentaje
    candidatos.sort((a, b) => b.porcentaje - a.porcentaje);

    // Si hay al menos un cupón que califica, tomamos el más alto
    if (candidatos.length > 0) {
      this.cuponSugerido.set(candidatos[0]);
    } else {
      this.cuponSugerido.set(null);
    }
  }

  async cargarCreditoUsuario() {
    const user = await this.auth.getCurrentUser();
    if (user) {
      const { data: perfil } = await this.supabase
        .from('perfiles')
        .select('credito')
        .eq('id', user.id)
        .single();
      if (perfil?.credito) {
        this.creditoDisponible.set(Number(perfil.credito) || 0);
      }
    }
  }

  // Trae únicamente productos activos y suma los combos promocionales
  async cargarProductosCandy() {
    const [resProductos, resCombos] = await Promise.all([
      this.supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .gt('stock', 0)
        .order('id', { ascending: true }),
      this.supabase
        .from('combos')
        .select('*')
        .order('precio', { ascending: true })
    ]);

    const listaCandy: ProductoCandy[] = [];

    if (resProductos.data) {
      resProductos.data.forEach(p => {
        listaCandy.push({
          id: p.id,
          nombre: p.nombre,
          categoria: p.categoria || 'Snacks',
          precio: Number(p.precio) || 0,
          cantidad: 0
        });
      });
    }

    if (resCombos.data) {
      resCombos.data.forEach(c => {
        listaCandy.push({
          id: 10000 + c.id, // ID offset para evitar conflicto de keys con productos
          nombre: c.nombre,
          categoria: 'Combos',
          precio: Number(c.precio) || 0,
          cantidad: 0
        });
      });
    }

    this.candyItems.set(listaCandy);
  }

  async cargarFunciones(movieId: number) {
    
    const ahora = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('funciones')
      .select('id, sala_id, fecha_hora, precio, tipo_funcion, salas(nombre)')
      .eq('pelicula_id', movieId)
      .gte('fecha_hora', ahora)
      .eq('estado', 'activa');

    if (error) {
      console.error('Error al cargar funciones:', error);
      return;
    }

    // 2. Si no hay funciones vigentes para esta película
    if (!data || data.length === 0) {
      alert('No hay funciones disponibles ni vigentes para esta película.');
      this.router.navigate(['/home']);
      return;
    }


    const duracionMin = Number(this.movie()?.duration) || 120;
      const list: ShowTime[] = data.map(f => {
        const inicio = new Date(f.fecha_hora);
        const fin = new Date(inicio.getTime() + duracionMin * 60000);

        const formatPad = (date: Date) =>
          date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Armar la fecha amigable: "Hoy (30/09)", "Jue 01/10", etc.
        const diaSemana = inicio.toLocaleDateString('es-AR', { weekday: 'short' });
        const diaMes = inicio.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
        const esHoy = inicio.toDateString() === new Date().toDateString();
        const displayFecha = esHoy 
          ? `Hoy (${diaMes})` 
          : `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${diaMes}`;

        const rawP = Number(f.precio);
        return {
          id: f.id,
          salaId: f.sala_id,
          roomName: (f.salas as any)?.nombre || 'Sala 1',
          format: f.tipo_funcion,
          dateStr: displayFecha, // <-- agregás esta propiedad
          startTime: formatPad(inicio),
          endTime: formatPad(fin),
          price: rawP > 0 ? rawP : 4500
        };
      });

      this.showtimes.set(list);
      await this.selectShowtime(list[0]);
  }

  async selectShowtime(show: ShowTime) {
    this.selectedShowtime.set(show);
    await this.cargarButacasYEntradas(show.id, show.salaId);
  }

  toggleSeat(seat: Seat) {
    if (seat.occupied) return;
    this.seats.update(list =>
      list.map(s => s.id === seat.id ? { ...s, selected: !s.selected } : s)
    );
  }

  incrementCandy(p: ProductoCandy) {
    this.candyItems.update(items =>
      items.map(item => item.id === p.id ? { ...item, cantidad: item.cantidad + 1 } : item)
    );
  }

  decrementCandy(p: ProductoCandy) {
    this.candyItems.update(items =>
      items.map(item => item.id === p.id ? { ...item, cantidad: Math.max(0, item.cantidad - 1) } : item)
    );
  }

  async validarCupon() {
    const codigo = this.codigoCuponInput().trim().toUpperCase();
    if (!codigo) return;

    this.mensajeCupon.set(null);
    const { data: cupon, error } = await this.supabase
      .from('cupones')
      .select('*')
      .eq('codigo', codigo)
      .eq('activo', true)
      .single();

    if (error || !cupon) {
      this.mensajeCupon.set('Cupón inválido o expirado.');
      return;
    }

    const user = await this.auth.getCurrentUser();

    if (cupon.solo_primera_compra) {
      if (!user) {
        this.mensajeCupon.set('Este cupón requiere que inicies sesión.');
        return;
      }
      const { count } = await this.supabase
        .from('entradas')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', user.id);
      if (count && count > 0) {
        this.mensajeCupon.set('Este cupón es válido únicamente para tu primera compra.');
        return;
      }
    }

    if (cupon.edad_minima > 0) {
      if (!user) {
        this.mensajeCupon.set('Iniciá sesión para validar el descuento por edad.');
        return;
      }
      const { data: perfil } = await this.supabase
        .from('perfiles')
        .select('fecha_nacimiento')
        .eq('id', user.id)
        .single();
      if (!perfil?.fecha_nacimiento) {
        this.mensajeCupon.set('Fecha de nacimiento no registrada para validar la edad.');
        return;
      }
      const edad = this.calcularEdad(perfil.fecha_nacimiento);
      if (edad < cupon.edad_minima) {
        this.mensajeCupon.set(`Este cupón es exclusivo para mayores de ${cupon.edad_minima} años.`);
        return;
      }
    }

    const descPorcentaje = Number(cupon.descuento_porcentaje) || 0;
    this.cuponAplicado.set({ codigo: cupon.codigo, porcentaje: descPorcentaje });
    this.mensajeCupon.set(`¡Cupón aplicado! Descuento del ${descPorcentaje}%.`);
  }

  calcularEdad(fechaStr: string): number {
    const nac = new Date(fechaStr);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }

  getRows(): string[] {
    return Array.from(new Set(this.seats().map(s => s.row)));
  }

  getLeftSeats(row: string): Seat[] {
    return this.seats()
      .filter(s => s.row === row && s.number <= 4)
      .sort((a, b) => a.number - b.number);
  }

  getCenterSeats(row: string): Seat[] {
    return this.seats()
      .filter(s => s.row === row && s.number > 4 && s.number <= 24)
      .sort((a, b) => a.number - b.number);
  }

  getRightSeats(row: string): Seat[] {
    return this.seats()
      .filter(s => s.row === row && s.number > 24)
      .sort((a, b) => a.number - b.number);
  }

  async confirmBooking() {
    const currentShow = this.selectedShowtime();
    const chosen = this.selectedSeats();
    if (!currentShow || chosen.length === 0) return;

    const user = await this.auth.getCurrentUser();
    const restriccion = this.movie()?.rating || 'ATP';

    if (!user && restriccion !== 'ATP') {
      const ok = confirm(`Esta película es para mayores de ${restriccion}. ¿Confirmás que el asistente cumple con la edad o ingresará con un adulto?`);
      if (!ok) return;
    } else if (user && restriccion !== 'ATP') {
      const { data: perfil } = await this.supabase
        .from('perfiles')
        .select('fecha_nacimiento')
        .eq('id', user.id)
        .single();
      
      const edad = perfil?.fecha_nacimiento ? this.calcularEdad(perfil.fecha_nacimiento) : 0;
      const min = parseInt(restriccion.replace('+', ''), 10);
      if (edad < min) {
        alert(`No cumplís con la edad mínima (${restriccion}) para adquirir esta función.`);
        return;
      }
    }

    const rawBasePrice = Number(currentShow.price);
    const showPrice = rawBasePrice > 0 ? rawBasePrice : 4500;
    const ticketCodigoBase = `TICKET-${currentShow.id}-${Date.now()}`;

    // 1. Inserción de entradas en Supabase
    const insertsEntradas = chosen.map(s => {
      const isVip = ['R', 'S', 'T'].includes(s.row);
      const precioUnitario = isVip ? showPrice * 1.3 : showPrice;
      return {
        funcion_id: currentShow.id,
        butaca_id: s.dbId,
        usuario_id: user ? user.id : null,
        estado: 'activa',
        precio_pagado: Math.round(precioUnitario),
        qr_code: chosen.length === 1 
          ? ticketCodigoBase 
          : `${ticketCodigoBase}-B${s.dbId}`
      };
    });

    const { error: errEntradas } = await this.supabase.from('entradas').insert(insertsEntradas);
    if (errEntradas) {
      console.error('Error al reservar butacas:', errEntradas);
      alert('Error al reservar butacas. Intente nuevamente.');
      return;
    }

    // 2. Inserción de Candy Bar y Combos
    const candyComprados = this.candyItems().filter(c => c.cantidad > 0);
    if (candyComprados.length > 0) {
      const totalCandyMonto = candyComprados.reduce((acc, c) => acc + (c.precio * c.cantidad), 0);

      const { data: compraData, error: errCandyCabecera } = await this.supabase
        .from('compras_candy')
        .insert({
          usuario_id: user ? user.id : null,
          fecha: new Date().toISOString(),
          total: totalCandyMonto
        })
        .select('id')
        .single();

      if (!errCandyCabecera && compraData) {
        const productosIndividuales = candyComprados.filter(c => c.id < 10000);
        if (productosIndividuales.length > 0) {
          // A. Insertar el detalle de la compra
          const insertsDetalle = productosIndividuales.map(c => ({
            compra_id: compraData.id,
            producto_id: c.id,
            cantidad: c.cantidad,
            precio_unitario: c.precio
          }));
          await this.supabase.from('compra_producto').insert(insertsDetalle);

          // B. Descontar stock únicamente si la compra se guardó bien
          for (const item of productosIndividuales) {
            const { data: prodActual } = await this.supabase
              .from('productos')
              .select('stock')
              .eq('id', item.id)
              .single();

            if (prodActual) {
              const nuevoStock = Math.max(0, (prodActual.stock || 0) - item.cantidad);
              await this.supabase
                .from('productos')
                .update({ stock: nuevoStock })
                .eq('id', item.id);
            }
          }
        }
      }
    }
    // 3. Registrar cupón si aplica (solo si es de uso único como primera compra)
    const cupon = this.cuponAplicado();
    if (cupon && user) {
      const { data: cuponDB } = await this.supabase
        .from('cupones')
        .select('id, solo_primera_compra')
        .eq('codigo', cupon.codigo)
        .single();

      // Solo guardamos en usuario_cupon si el cupón está restringido a primera compra
      // Los cupones recurrentes (Senior, generales) no necesitan bloquearse en esa tabla
      if (cuponDB && cuponDB.solo_primera_compra) {
        await this.supabase
          .from('usuario_cupon')
          .upsert(
            { usuario_id: user.id, cupon_id: cuponDB.id },
            { onConflict: 'usuario_id,cupon_id' }
          );
      }
    }

    // 4. Cálculo explícito y seguro del total a cobrar
    const totalEntradasCalculado = chosen.reduce((acc, s) => {
      const isVip = ['R', 'S', 'T'].includes(s.row);
      const p = isVip ? showPrice * 1.3 : showPrice;
      return acc + p;
    }, 0);

    const totalCandyCalculado = candyComprados.reduce((acc, c) => acc + (c.precio * c.cantidad), 0);
    const subtotalReal = totalEntradasCalculado + totalCandyCalculado;

    const descPorcentaje = Number(this.cuponAplicado()?.porcentaje) || 0;
    const descuentoMonto = (subtotalReal * descPorcentaje) / 100;
    let montoAbonado = subtotalReal - descuentoMonto;

    if (this.usarCredito() && this.creditoDisponible() > 0) {
      montoAbonado = Math.max(0, montoAbonado - Number(this.creditoDisponible()));
    }
    montoAbonado = Math.round(montoAbonado);

    // 5. Actualizar puntos y saldo del usuario
    if (user) {
      const { data: perfil } = await this.supabase
        .from('perfiles')
        .select('puntos, credito')
        .eq('id', user.id)
        .single();

      const nuevosPuntos = (Number(perfil?.puntos) || 0) + montoAbonado;
      let nuevoCredito = Number(perfil?.credito) || 0;

      if (this.usarCredito() && nuevoCredito > 0) {
        const cubiertoPorCredito = Math.min(nuevoCredito, subtotalReal - descuentoMonto);
        nuevoCredito -= cubiertoPorCredito;
      }

      await this.supabase
        .from('perfiles')
        .update({ puntos: nuevosPuntos, credito: nuevoCredito })
        .eq('id', user.id);
    }

    // 6. Auditoría en log
    await this.supabase.from('logs_actividad').insert({
      usuario: user?.email || 'anonimo@cinenova.com',
      accion: 'Compra de Entradas',
      entidad_afectada: 'entradas',
      detalle: `Reserva confirmada de ${chosen.length} butacas para función #${currentShow.id}. Total abonado: $${montoAbonado}`
    });

    // 7. Descargar PDF con el monto total consolidado
    this.montoConfirmado.set(montoAbonado);
    await this.descargarTicketPDF(ticketCodigoBase, currentShow, chosen, candyComprados, montoAbonado);
    this.purchaseSuccess.set(true);
  }

  async descargarTicketPDF(
    ticketBase: string, 
    funcion: ShowTime, 
    butacas: Seat[], 
    candy: ProductoCandy[],
    montoAbonado: number // <-- Agregamos el monto exacto por parámetro
  ) {
    const doc = new jsPDF();
    const qrDataUrl = await QRCode.toDataURL(ticketBase);

    doc.setFontSize(22);
    doc.setTextColor(229, 9, 20);
    doc.text('CineNova - Entrada Oficial y Retiro Candy', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`Película: ${this.movie()?.title}`, 14, 32);
    doc.text(`Sala: ${funcion.roomName} (${funcion.format})`, 14, 40);
    doc.text(`Horario: ${funcion.startTime} hs`, 14, 48);
    doc.text(`Butacas: ${butacas.map(b => b.id).join(', ')}`, 14, 56);

    let y = 68;
    if (candy.length > 0) {
      doc.setFontSize(13);
      doc.setTextColor(0, 100, 0);
      doc.text('Productos de Candy Bar a Retirar:', 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      candy.forEach(c => {
        doc.text(`- ${c.cantidad}x ${c.nombre} ($${c.precio * c.cantidad})`, 16, y);
        y += 6;
      });
      y += 4;
    }

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    // Usamos el parámetro numérico asegurado
    doc.text(`Total Abonado: $${montoAbonado.toLocaleString('es-AR')} ARS`, 14, y);
    doc.text(`Código Único: ${ticketBase}`, 14, y + 8);

    doc.addImage(qrDataUrl, 'PNG', 14, y + 16, 50, 50);
    doc.save(`ticket-${ticketBase}.pdf`);
  }

  async cargarButacasYEntradas(funcionId: number, salaId: number) {
    const { data: butacas } = await this.supabase
      .from('butacas')
      .select('*')
      .eq('sala_id', salaId)
      .order('fila')
      .order('numero');

    const { data: entradasOcupadas } = await this.supabase
      .from('entradas')
      .select('butaca_id')
      .eq('funcion_id', funcionId)
      .neq('estado', 'cancelada');

    const occupiedIds = new Set((entradasOcupadas || []).map(e => e.butaca_id));

    if (butacas) {
      this.seats.set(
        butacas.map(b => ({
          id: `${b.fila}-${b.numero}`,
          dbId: b.id,
          row: b.fila,
          number: b.numero,
          tipo: b.tipo,
          activo: b.activo !== false,
          selected: false,
          occupied: occupiedIds.has(b.id)
        }))
      );
    }

    if (this.realtimeChannel) {
      this.supabase.removeChannel(this.realtimeChannel);
    }

    this.realtimeChannel = this.supabase
      .channel(`entradas-funcion-${funcionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entradas',
          filter: `funcion_id=eq.${funcionId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const nuevaEntrada = payload.new as { butaca_id: number; estado: string };
            if (nuevaEntrada.estado !== 'cancelada') {
              this.seats.update(seatsList =>
                seatsList.map(s =>
                  s.dbId === nuevaEntrada.butaca_id ? { ...s, occupied: true, selected: false } : s
                )
              );
            }
          } else if (payload.eventType === 'UPDATE') {
            const entradaModificada = payload.new as { butaca_id: number; estado: string };
            if (entradaModificada.estado === 'cancelada') {
              this.seats.update(seatsList =>
                seatsList.map(s =>
                  s.dbId === entradaModificada.butaca_id ? { ...s, occupied: false } : s
                )
              );
            }
          }
        }
      )
      .subscribe();
  }

  ngOnDestroy() {
    if (this.realtimeChannel) {
      this.supabase.removeChannel(this.realtimeChannel);
    }
  }
}