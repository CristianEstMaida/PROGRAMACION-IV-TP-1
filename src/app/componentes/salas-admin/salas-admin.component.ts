import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Sala } from '../../models/sala';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-salas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './salas-admin.component.html',
  styleUrls: ['./salas-admin.component.css']
})
export class SalasAdminComponent implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService).client;
  private realtimeSalas: RealtimeChannel | null = null;

  salas = signal<Sala[]>([]);
  cargando = signal<boolean>(true);

  async ngOnInit() {
    await this.cargarSalas();
    this.suscribirSalasRealtime();
  }

  // 1. GET: Carga inicial de salas
  async cargarSalas() {
    this.cargando.set(true);
    const { data, error } = await this.supabase
      .from('salas')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error al cargar salas desde Supabase:', error.message);
    } else if (data) {
      this.salas.set(data as Sala[]);
    }
    this.cargando.set(false);
  }

  async toggleEstadoSala(sala: Sala) {
    const nuevoEstado = !sala.activa;
    const accion = nuevoEstado ? 'habilitar' : 'deshabilitar';

    const confirmar = confirm(`¿Estás seguro de que querés ${accion} la ${sala.nombre}?`);
    if (!confirmar) return;

    const { error } = await this.supabase
      .from('salas')
      .update({ activa: nuevoEstado })
      .eq('id', sala.id);

    if (error) {
      alert(`Error al actualizar la sala: ${error.message}`);
      return;
    }

    // Actualización reactiva instantánea en la señal
    this.salas.update(lista =>
      lista.map(s => s.id === sala.id ? { ...s, activa: nuevoEstado } : s)
    );
  }

  // 2. REALTIME: Escuchar cambios externos de otras pestañas o usuarios
  suscribirSalasRealtime() {
    this.realtimeSalas = this.supabase
      .channel('cambios-salas')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'salas' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const nueva = payload.new as Sala;
            this.salas.update(lista => {
              if (lista.some(s => s.id === nueva.id)) return lista;
              return [...lista, nueva];
            });
          } else if (payload.eventType === 'DELETE') {
            const borradaId = (payload.old as { id: number })?.id;
            if (borradaId) {
              this.salas.update(lista => lista.filter(s => s.id !== borradaId));
            }
          } else if (payload.eventType === 'UPDATE') {
            const editada = payload.new as Sala;
            this.salas.update(lista =>
              lista.map(s => s.id === editada.id ? editada : s)
            );
          }
        }
      )
      .subscribe();
  }

  // 3. POST: Crear sala y sus 518 butacas asociadas
 async agregarSala() {
    const nombre = prompt('Ingresá el nombre de la sala (ej: Sala 6 - IMAX):');
    if (!nombre || !nombre.trim()) return;

    // Fijamos el tipo como Estándar / Multipropósito automáticamente
    const tipo = 'Estándar';

    // Capacidad útil vendible según consigna
    const capacidadOficial = 518;

    const { data: nuevaSala, error: errSala } = await this.supabase
      .from('salas')
      .insert({
        nombre: nombre.trim(),
        tipo: tipo,
        capacidad: capacidadOficial,
        activa: true
      })
      .select()
      .single();

    if (errSala || !nuevaSala) {
      alert('Error al crear la sala: ' + (errSala?.message || 'Error desconocido'));
      return;
    }

    // Actualización reactiva en la tabla del panel
    this.salas.update(lista => {
      if (lista.some(s => s.id === nuevaSala.id)) return lista;
      return [...lista, nuevaSala as Sala];
    });

    const letrasFilas = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 
      'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'
    ];
    const totalColumnas = 28;
    const butacasNuevas: any[] = [];

    // Los 14 números activos de la fila J para discapacidad (2 + 10 + 2)
    const asientosActivosFilaJ = [2, 3, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 26, 27];

    for (const letra of letrasFilas) {
      for (let c = 1; c <= totalColumnas; c++) {
        let tipoButaca = 'normal';
        let estaActiva = true;

        if (letra === 'K') {
          // Fila K es pasillo completo: todas en false
          tipoButaca = 'accesible';
          estaActiva = false;
        } else if (letra === 'J') {
          // Fila J: solo activas las 14 accesibles, el resto false
          if (asientosActivosFilaJ.includes(c)) {
            tipoButaca = 'accesible';
            estaActiva = true;
          } else {
            tipoButaca = 'normal';
            estaActiva = false;
          }
        } else if (['R', 'S', 'T'].includes(letra)) {
          // Filas VIP
          tipoButaca = 'vip';
          estaActiva = true;
        }

        butacasNuevas.push({
          sala_id: nuevaSala.id,
          fila: letra,
          numero: c,
          tipo: tipoButaca,
          activo: estaActiva
        });
      }
    }

    // Insertar las 560 butacas en Supabase
    const { error: errButacas } = await this.supabase
      .from('butacas')
      .insert(butacasNuevas);

    if (errButacas) {
      console.error('Error al insertar butacas:', errButacas.message);
      alert('Error al insertar las butacas: ' + errButacas.message);
    } else {
      alert(`Sala creada con éxito: 560 posiciones generadas (518 activas, 42 pasillos).`);
    }
  }

  ngOnDestroy() {
    if (this.realtimeSalas) {
      this.supabase.removeChannel(this.realtimeSalas);
    }
  }
}