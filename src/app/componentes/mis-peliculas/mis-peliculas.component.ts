import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { Auth } from '../../services/auth';

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
    this.cargando.set(false);
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

        return {
          id: e.id,
          qr_code: e.qr_code,
          estado: e.estado,
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
          // Condición de consigna: Se puede cancelar hasta 2 horas antes de la función
          puedeCancelar: diffHoras >= 2 && e.estado === 'validada'
        };
      });

      this.entradas.set(list);
    }
  }

  async cancelarEntrada(entrada: EntradaHistorial) {
    if (!entrada.puedeCancelar) {
      alert('Solo se pueden cancelar funciones con un mínimo de 2 horas de anticipación.');
      return;
    }

    const confirma = confirm(`¿Estás seguro de cancelar esta entrada? Se acreditarán $${entrada.precio_pagado} ARS en tu perfil como crédito para futuras compras.`);
    if (!confirma) return;

    const user = await this.auth.getCurrentUser();
    if (!user) return;

    // 1. Cambiar estado de la entrada a 'cancelada'
    const { error: errEntrada } = await this.supabase
      .from('entradas')
      .update({ estado: 'cancelada' })
      .eq('id', entrada.id);

    if (errEntrada) {
      alert('Error al cancelar la entrada: ' + errEntrada.message);
      return;
    }

    // 2. Acreditar saldo a favor en el perfil
    const nuevoCredito = Number(this.creditoDisponible()) + Number(entrada.precio_pagado);
    const { error: errPerfil } = await this.supabase
      .from('perfiles')
      .update({ credito: nuevoCredito })
      .eq('id', user.id);

    if (!errPerfil) {
      this.creditoDisponible.set(nuevoCredito);
      // Actualizar estado en el listado local
      this.entradas.update(list =>
        list.map(e => e.id === entrada.id ? { ...e, estado: 'cancelada', puedeCancelar: false } : e)
      );

      // 3. Registrar en Log de Actividad
      await this.supabase.from('logs_actividad').insert({
        usuario: this.usuarioNombre(),
        accion: 'Canceló Entrada',
        detalle: `Entrada #${entrada.id} cancelada. Crédito devuelto: $${entrada.precio_pagado} ARS`
      });

      alert(`✅ Entrada cancelada con éxito. Se añadieron $${entrada.precio_pagado} ARS a tu crédito disponible.`);
    }
  }
}