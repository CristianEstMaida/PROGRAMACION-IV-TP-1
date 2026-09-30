import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { Auth } from '../../services/auth';
import jsPDF from 'jspdf';
import * as QRCode from 'qrcode';

export interface EntradaHistorial {
  id: number;
  qr_code: string;
  estado: string;
  precio_pagado: number;
  butaca: string;
  pelicula: {
    id: number;
    titulo: string;
    imagen_url: string;
    duracion_minutos: number;
  };
  funcion: {
    id: number;
    fecha_hora: string;
    tipo_funcion: string;
    sala: string;
  };
  puedeCancelar: boolean;
}

@Component({
  selector: 'app-mis-peliculas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mis-peliculas.component.html',
  styleUrls: ['./mis-peliculas.component.css']
})
export class MisPeliculasComponent implements OnInit {
  private supabase = inject(SupabaseService).client;
  private auth = inject(Auth);
  private router = inject(Router);

  usuarioNombre = signal<string>('Usuario');
  puntosFidelizacion = signal<number>(0);
  creditoDisponible = signal<number>(0);
  entradas = signal<EntradaHistorial[]>([]);
  cargando = signal<boolean>(true);
  // Cambiá la definición de cuponInfo para incluir 'motivo'
  cuponInfo = signal<{ codigo: string; porcentaje: number; motivo: string } | null>(null);

  async ngOnInit() {
    const user = await this.auth.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    await Promise.all([
      this.cargarPerfil(user.id),
      this.cargarEntradas(user.id)
    ]);
    await this.cargarMejorBeneficio(user.id);
    this.cargando.set(false);
  }

  calcularEdad(fechaStr: string): number {
    const nac = new Date(fechaStr);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }

  async cargarMejorBeneficio(userId: string) {
    // 1. Obtener la fecha de nacimiento del usuario
    const { data: perfil } = await this.supabase
      .from('perfiles')
      .select('fecha_nacimiento')
      .eq('id', userId)
      .single();

    const edad = perfil?.fecha_nacimiento ? this.calcularEdad(perfil.fecha_nacimiento) : 0;

    // 2. Traer todos los cupones activos
    const { data: cupones } = await this.supabase
      .from('cupones')
      .select('codigo, descuento_porcentaje, solo_primera_compra, edad_minima')
      .eq('activo', true);

    if (!cupones || cupones.length === 0) return;

    const candidatos: { codigo: string; porcentaje: number; motivo: string }[] = [];

    // Si califica para Senior (edad >= edad_minima)
    if (edad >= 50) {
      const senior = cupones.find(c => c.edad_minima && c.edad_minima <= edad);
      if (senior) {
        candidatos.push({
          codigo: senior.codigo,
          porcentaje: Number(senior.descuento_porcentaje) || 0,
          motivo: 'Beneficio Senior (+50)'
        });
      }
    }

    // Si no tiene compras registradas, califica para Primera Compra
    if (this.entradas().length === 0) {
      const bienvenida = cupones.find(c => c.solo_primera_compra);
      if (bienvenida) {
        candidatos.push({
          codigo: bienvenida.codigo,
          porcentaje: Number(bienvenida.descuento_porcentaje) || 0,
          motivo: 'Bienvenida (1° Compra)'
        });
      }
    }

    // Ordenamos para que el de mayor descuento quede primero
    candidatos.sort((a, b) => b.porcentaje - a.porcentaje);

    if (candidatos.length > 0) {
      this.cuponInfo.set(candidatos[0]);
    }
  }

  async cargarPerfil(userId: string) {
    const { data } = await this.supabase
      .from('perfiles')
      .select('nombre, apellido, puntos, credito')
      .eq('id', userId)
      .single();

    if (data) {
      this.usuarioNombre.set(data.nombre ? `${data.nombre} ${data.apellido || ''}`.trim() : 'Cliente');
      this.puntosFidelizacion.set(data.puntos || 0);
      this.creditoDisponible.set(data.credito || 0);
    }
  }

  async cargarEntradas(userId: string) {
    const { data, error } = await this.supabase
      .from('entradas')
      .select(`
        id,
        qr_code,
        estado,
        precio_pagado,
        butacas (fila, numero),
        funciones (
          id,
          fecha_hora,
          tipo_funcion,
          salas (nombre),
          peliculas (id, titulo, imagen_url, duracion_minutos)
        )
      `)
      .eq('usuario_id', userId)
      .order('id', { ascending: false });

    if (data) {
      const ahora = new Date().getTime();
      const list: EntradaHistorial[] = data.map((e: any) => {
        const fechaFuncion = new Date(e.funciones?.fecha_hora).getTime();
        const diffHoras = (fechaFuncion - ahora) / (1000 * 60 * 60);

        // 1. Calcular el estado real para la interfaz
        let estadoCalculado = e.estado;
        if (e.estado === 'activa' && fechaFuncion < ahora) {
          estadoCalculado = 'expirada'; // La función ya pasó y no se usó
        }

        return {
          id: e.id,
          qr_code: e.qr_code,
          estado: estadoCalculado, // <-- Usamos el estado calculado
          precio_pagado: e.precio_pagado || 4500,
          butaca: `Fila ${e.butacas?.fila} - Asiento ${e.butacas?.numero}`,
          pelicula: {
            id: e.funciones?.peliculas?.id,
            titulo: e.funciones?.peliculas?.titulo || 'Película',
            imagen_url: e.funciones?.peliculas?.imagen_url || '/assets/img/butacas-cine.jpg',
            duracion_minutos: e.funciones?.peliculas?.duracion_minutos || 120
          },
          funcion: {
            id: e.funciones?.id,
            fecha_hora: e.funciones?.fecha_hora,
            tipo_funcion: e.funciones?.tipo_funcion || '2D',
            sala: e.funciones?.salas?.nombre || 'Sala Principal'
          },
          // 2. Solo se cancela si está ACTIVA y faltan 2 o más horas
          puedeCancelar: diffHoras >= 2 && e.estado === 'activa'
        };
      });

      this.entradas.set(list);
    }
  }


  // 1. Método para verificar si todavía está a tiempo de cancelar (> 2 horas)
    puedeCancelar(fechaHoraStr: string): boolean {
      if (!fechaHoraStr) return false;
      const fechaFuncion = new Date(fechaHoraStr);
      const ahora = new Date();
      const diferenciaHoras = (fechaFuncion.getTime() - ahora.getTime()) / (1000 * 60 * 60);
      return diferenciaHoras >= 2;
    }

  // 2. Método de cancelación con acreditación de saldo
  async cancelarEntrada(item: any) {
    const monto = Number(item.precio_pagado) || 0;
    const confirmar = confirm(
      `¿Querés cancelar tu entrada para "${item.pelicula.titulo}"?\n` +
      `Se te reintegrarán $${monto} como crédito en tu cuenta.`
    );
    if (!confirmar) return;

    const user = await this.auth.getCurrentUser();
    if (!user) return;

    // Actualizar estado en Supabase
    const { error: errUpdate } = await this.supabase
      .from('entradas')
      .update({ estado: 'cancelada' })
      .eq('id', item.id);

    if (errUpdate) {
      alert('Error al cancelar: ' + errUpdate.message);
      return;
    }

    // Sumar crédito en la base de datos
    const nuevoCredito = Number(this.creditoDisponible()) + monto;
    await this.supabase
      .from('perfiles')
      .update({ credito: nuevoCredito })
      .eq('id', user.id);

    // Actualizar la interfaz en vivo
    this.creditoDisponible.set(nuevoCredito);
    this.entradas.update(lista =>
      lista.map(e => e.id === item.id ? { ...e, estado: 'cancelada' } : e)
    );

    alert(`Reserva cancelada con éxito. Tu nuevo saldo de crédito es $${nuevoCredito}.`);
  }
  async descargarComprobante(item: any) {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 160] // Formato ticket de cine
      });

      // Fondo y Encabezado
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 100, 160, 'F');

      doc.setTextColor(248, 113, 113);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CINENOVA', 50, 15, { align: 'center' });

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.text('Entrada de Cine', 50, 22, { align: 'center' });

      // Línea divisoria
      doc.setDrawColor(51, 65, 85);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(10, 26, 90, 26);
      doc.setLineDashPattern([], 0);

      // Detalles de la película y función
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(item.pelicula?.titulo || 'Película', 50, 34, { align: 'center' });

      doc.setTextColor(203, 213, 225);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Sala: ${item.funcion?.sala || '-'} (${item.funcion?.tipo_funcion || '2D'})`, 15, 44);
      doc.text(`Ubicación: Butaca ${item.butaca}`, 15, 52);

      const fechaStr = item.funcion?.fecha_hora 
        ? new Date(item.funcion.fecha_hora).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
        : '-';
      doc.text(`Horario: ${fechaStr} hs`, 15, 60);
      doc.text(`Importe pagado: $${item.precio_pagado} ARS`, 15, 68);
      doc.text(`Estado: ${item.estado.toUpperCase()}`, 15, 76);

      // Generar e insertar Código QR
      const qrDataUrl = await QRCode.toDataURL(item.qr_code || item.id.toString(), {
        margin: 1,
        width: 140
      });
      doc.addImage(qrDataUrl, 'PNG', 30, 84, 40, 40);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Código: ${item.qr_code}`, 50, 130, { align: 'center' });
      doc.text('Presentá este código en el acceso a sala', 50, 136, { align: 'center' });

      // Descargar archivo
      doc.save(`Ticket-CineNova-${item.qr_code}.pdf`);
    } catch (err) {
      console.error('Error generando comprobante PDF:', err);
      alert('No se pudo generar el PDF del comprobante.');
    }
  }
}

