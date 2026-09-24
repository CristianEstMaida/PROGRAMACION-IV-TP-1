import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { MoviesService } from '../../services/movies.service';
import { MovieDetailModel } from '../../models/movie';
import { Auth } from '../../services/auth';
import { SupabaseService } from '../../services/supabase.service';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { FormsModule } from '@angular/forms';

// export interface Seat {
//   id: string;      // ej: "A-1"
//   row: string;     // ej: "A"
//   number: number;  // 1 a 28
//   selected: boolean;
//   occupied: boolean;
// }

// export interface ShowTime {
//   id: string;
//   roomName: string;
//   format: '2D' | '3D' | '4D' | '5D';
//   audio: 'Subtitulada' | 'Doblada';
//   startTime: string; // ej: "16:00"
//   endTime: string;   // se calcula con duración + 30m
//   price: number;
// }

export interface Seat {
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
export class Reserve implements OnInit {
  private moviesService = inject(MoviesService);
  private auth = inject(Auth);
  private supabase = inject(SupabaseService).client;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  movie = signal<MovieDetailModel | null>(null);

  // Funciones disponibles
  showtimes = signal<ShowTime[]>([]);
  selectedShowtime = signal<ShowTime | null>(null);

  // Butacas de la sala
  seats = signal<Seat[]>([]);

  purchaseSuccess = signal<boolean>(false);

  // Candy Bar
  candyItems = signal<ProductoCandy[]>([]);

// Cupones y Crédito
  codigoCuponInput = signal<string>('');
  cuponAplicado = signal<{ codigo: string; porcentaje: number } | null>(null);
  mensajeCupon = signal<string | null>(null);
  creditoDisponible = signal<number>(0);
  usarCredito = signal<boolean>(false);

  // Precios y totales
  selectedSeats = computed(() => this.seats().filter(s => s.selected));

  totalButacas = computed(() => {
    const basePrice = this.selectedShowtime()?.price ?? 0;
    return this.selectedSeats().reduce((acc, seat) => {
      const isVip = ['R', 'S', 'T'].includes(seat.row);
      const seatPrice = isVip ? basePrice * 1.3 : basePrice;
      return acc + seatPrice;
    }, 0);
  });

  totalCandy = computed(() => {
    return this.candyItems().reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
  });

  subtotalGeneral = computed(() => this.totalButacas() + this.totalCandy());

  descuentoCuponMonto = computed(() => {
    const c = this.cuponAplicado();
    if (!c) return 0;
    return (this.subtotalGeneral() * c.porcentaje) / 100;
  });

  totalFinal = computed(() => {
    let total = this.subtotalGeneral() - this.descuentoCuponMonto();
    if (this.usarCredito()) {
      total = Math.max(0, total - this.creditoDisponible());
    }
    return Math.round(total);
  });
  // totalPrice = computed(() => {
  // const basePrice = this.selectedShowtime()?.price ?? 0;
  
  // Si la butaca es de las últimas 3 filas (R, S, T), tiene un recargo VIP del 30%
  // return this.selectedSeats().reduce((acc, seat) => {
  //   const isVip = ['R', 'S', 'T'].includes(seat.row);
  //   const seatPrice = isVip ? basePrice * 1.3 : basePrice;
  //   return acc + seatPrice;
  // }, 0);
  // });


  
  // purchaseSuccess = signal<boolean>(false);

  // constructor(
  //   private route: ActivatedRoute,
  //   private moviesService: MoviesService,
  //   private router: Router
  // ) {}

  async ngOnInit() {
    const movieId = Number(this.route.snapshot.paramMap.get('id'));
    if (!movieId) return;
    // const id = Number(this.route.snapshot.paramMap.get('id'));
    // if (id) {
    //   this.moviesService.getMovieById(id).subscribe({
    //     next: (data) => {
    //       if (data) {
    //         this.movie.set(data);
    //         this.generateSchedule(data.duration || 120);
    //         this.generateSeats();
    //       }
    //     }
    //   });
    // }
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
      this.cargarCreditoUsuario()
    ]);
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
        this.creditoDisponible.set(perfil.credito);
      }
    }
  }

  async cargarProductosCandy() {
    const { data } = await this.supabase
      .from('productos')
      .select('*')
      .gt('stock', 0);
    if (data) {
      this.candyItems.set(data.map(p => ({ ...p, cantidad: 0 })));
    }
  }

  async cargarFunciones(movieId: number) {
    const { data } = await this.supabase
      .from('funciones')
      .select('id, sala_id, fecha_hora, precio, tipo_funcion, salas(nombre)')
      .eq('pelicula_id', movieId)
      .eq('estado', 'activa');

    if (data && data.length > 0) {
      const duracionMin = this.movie()?.duration || 120;
      const list: ShowTime[] = data.map(f => {
        const inicio = new Date(f.fecha_hora);
        const fin = new Date(inicio.getTime() + duracionMin * 60000);

        const formatPad = (date: Date) =>
          date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return {
          id: f.id,
          salaId: f.sala_id,
          roomName: (f.salas as any)?.nombre || 'Sala 1',
          format: f.tipo_funcion,
          startTime: formatPad(inicio),
          endTime: formatPad(fin),
          price: f.precio
          };
        });

      this.showtimes.set(list);
      await this.selectShowtime(list[0]);
    }
  }

  async selectShowtime(show: ShowTime) {
    this.selectedShowtime.set(show);
    await this.cargarButacasYEntradas(show.id, show.salaId);
  }

  async cargarButacasYEntradas(funcionId: number, salaId: number) {
    // 1. Obtener todas las butacas físicas de la sala
    const { data: butacas } = await this.supabase
      .from('butacas')
      .select('*')
      .eq('sala_id', salaId)
      .order('fila')
      .order('numero');

    // 2. Obtener las entradas ya compradas para esta función específica
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
          selected: false,
          occupied: occupiedIds.has(b.id)
        }))
      );
    }
  }

  toggleSeat(seat: Seat) {
    if (seat.occupied) return;
    this.seats.update(list =>
      list.map(s => s.id === seat.id ? { ...s, selected: !s.selected } : s)
    );
  }

  // Modificadores de Candy Bar
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

  // Validación de Cupones según Requerimientos
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

    // 1. Regla: Solo primera compra
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

    // 2. Regla: Mayores de 50 años
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

    this.cuponAplicado.set({ codigo: cupon.codigo, porcentaje: cupon.descuento_porcentaje });
    this.mensajeCupon.set(`¡Cupón aplicado! Descuento del ${cupon.descuento_porcentaje}%.`);
  }

  calcularEdad(fechaStr: string): number {
    const nac = new Date(fechaStr);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }

  // Helpers de grilla de butacas

  getRows(): string[] {
    return Array.from(new Set(this.seats().map(s => s.row)));
  }

  getLeftSeats(row: string): Seat[] {
    return this.seats().filter(s => s.row === row && s.number <= 2);
  }

  getCenterSeats(row: string): Seat[] {
    return this.seats().filter(s => s.row === row && s.number > 2 && s.number <= 8);
  }

  getRightSeats(row: string): Seat[] {
    return this.seats().filter(s => s.row === row && s.number > 8);
  }

  async confirmBooking() {
  const currentShow = this.selectedShowtime();
  const chosen = this.selectedSeats();
  if (!currentShow || chosen.length === 0) return;

  // Obtener usuario autenticado (o null si es venta pública)
  const user = await this.auth.getCurrentUser();

  // 1. Validar restricción de edad exigida en consigna (+13, +16, +18)
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

  // 2. Insertar entradas en Supabase
  const ticketCodigoBase = `TICKET-${currentShow.id}-${Date.now()}`;

  const insertsEntradas = chosen.map(s => ({
    funcion_id: currentShow.id,
    butaca_id: s.dbId,
    usuario_id: user ? user.id : null,
    estado: 'validada',
    qr_code: `${ticketCodigoBase}-B${s.dbId}`
  }));

  const { error: errEntradas } = await this.supabase.from('entradas').insert(insertsEntradas);
  if (errEntradas) {
    console.error('Error al reservar butacas:', errEntradas);
    alert('Error al reservar butacas. Intente nuevamente.');
    return;
  }

  // 3. Insertar Compra de Candy Bar (Modelo Cabecera-Detalle corregido)
  const candyComprados = this.candyItems().filter(c => c.cantidad > 0);
  if (candyComprados.length > 0) {
    const totalCandyMonto = candyComprados.reduce((acc, c) => acc + (c.precio * c.cantidad), 0);

    // 3.1 Cabecera en compras_candy
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
      // 3.2 Detalle en compra_producto con compra_id
      const insertsDetalle = candyComprados.map(c => ({
        compra_id: compraData.id,
        producto_id: c.id,
        cantidad: c.cantidad,
        precio_unitario: c.precio
      }));

      await this.supabase.from('compra_producto').insert(insertsDetalle);
    }
  }

  // 4. Si aplicó cupón, marcarlo en usuario_cupon
  const cupon = this.cuponAplicado();
  if (cupon && user) {
    const { data: cuponDB } = await this.supabase
      .from('cupones')
      .select('id')
      .eq('codigo', cupon.codigo)
      .single();

    if (cuponDB) {
      await this.supabase
        .from('usuario_cupon')
        .insert({ usuario_id: user.id, cupon_id: cuponDB.id });
    }
  }

  // 5. Sumar puntos al perfil del usuario
  if (user) {
    const { data: perfil } = await this.supabase
      .from('perfiles')
      .select('puntos, credito')
      .eq('id', user.id)
      .single();

    const puntosGanados = this.totalFinal();
    const nuevosPuntos = (perfil?.puntos || 0) + puntosGanados;
    let nuevoCredito = perfil?.credito || 0;

    if (this.usarCredito() && nuevoCredito > 0) {
      const cubiertoPorCredito = Math.min(nuevoCredito, this.subtotalGeneral() - this.descuentoCuponMonto());
      nuevoCredito -= cubiertoPorCredito;
    }

    await this.supabase
      .from('perfiles')
      .update({ puntos: nuevosPuntos, credito: nuevoCredito })
      .eq('id', user.id);
  }

  // 6. Auditoría en logs_actividad
  await this.supabase.from('logs_actividad').insert({
    usuario: user?.email || 'anonimo@cinenova.com',
    accion: 'Compra de Entradas',
    entidad_afectada: 'entradas',
    detalle: `Reserva confirmada de ${chosen.length} butacas para función #${currentShow.id}. Total abonado: $${this.totalFinal()}`
  });

  // 7. Descargar PDF con el código QR generado
  await this.descargarTicketPDF(ticketCodigoBase, currentShow, chosen, candyComprados);
  this.purchaseSuccess.set(true);
}
//   async validarRestriccionEdad(user: any, restriccion: string): Promise<boolean> {
//   if (!restriccion || restriccion === 'ATP') return true;

//   // Obtener fecha de nacimiento del perfil en Supabase
//   const { data: perfil } = await this.supabase
//     .from('perfiles')
//     .select('fecha_nacimiento')
//     .eq('id', user.id)
//     .single();

//   if (!perfil?.fecha_nacimiento) return false;

//   const fechaNac = new Date(perfil.fecha_nacimiento);
//   const hoy = new Date();
//   let edad = hoy.getFullYear() - fechaNac.getFullYear();
//   const m = hoy.getMonth() - fechaNac.getMonth();
//   if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) edad--;

//   const minimaRequerida = parseInt(restriccion.replace('+', ''), 10);
//   return edad >= minimaRequerida;
// }


async descargarTicketPDF(ticketBase: string, funcion: ShowTime, butacas: Seat[], candy: ProductoCandy[]) {
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
    doc.text(`Total Abonado: $${this.totalFinal()} ARS`, 14, y);
    doc.text(`Código Único: ${ticketBase}`, 14, y + 8);

    doc.addImage(qrDataUrl, 'PNG', 14, y + 16, 50, 50);
    doc.save(`ticket-${ticketBase}.pdf`);
  }
}