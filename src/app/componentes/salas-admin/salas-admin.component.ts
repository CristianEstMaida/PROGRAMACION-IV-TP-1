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

  // 3. POST: Crear sala y sus butacas asociadas (Actualización instantánea)
  async agregarSala() {
    const nombre = prompt('Ingresá el nombre de la sala (ej: Sala 4 - IMAX):');
    if (!nombre || !nombre.trim()) return;

    const tipo = prompt('Tipo de sala (ej: Estándar, 3D, VIP, 5D):') || 'Estándar';
    const filas = 10;
    const columnas = 12;
    const capacidad = filas * columnas;

    const { data: nuevaSala, error: errSala } = await this.supabase
      .from('salas')
      .insert({
        nombre: nombre.trim(),
        tipo: tipo.trim(),
        capacidad: capacidad
      })
      .select()
      .single();

    if (errSala || !nuevaSala) {
      alert('Error al crear la sala: ' + (errSala?.message || 'Error desconocido'));
      return;
    }

    // Actualización instantánea en la UI sin esperar F5 ni WebSocket
    this.salas.update(lista => {
      if (lista.some(s => s.id === nuevaSala.id)) return lista;
      return [...lista, nuevaSala as Sala];
    });

    // Generar las butacas físicas (Filas A-J, Asientos 1-12)
    const letrasFilas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const butacasNuevas = [];

    for (let f = 0; f < filas; f++) {
      const letra = letrasFilas[f] || `F${f + 1}`;
      for (let c = 1; c <= columnas; c++) {
        butacasNuevas.push({
          sala_id: nuevaSala.id,
          fila: letra,
          numero: c,
          tipo: 'normal'
        });
      }
    }

    await this.supabase.from('butacas').insert(butacasNuevas);
  }

  // 4. DELETE: Borrar sala (Actualización instantánea)
  async eliminarSala(id: number) {
    const confirmar = confirm('¿Eliminar esta sala y todas sus butacas?');
    if (!confirmar) return;

    await this.supabase.from('butacas').delete().eq('sala_id', id);

    const { error } = await this.supabase
      .from('salas')
      .delete()
      .eq('id', id);

    if (error) {
      alert('No se pudo eliminar la sala: ' + error.message);
      return;
    }

    // Desaparece al instante de la tabla sin recargar
    this.salas.update(lista => lista.filter(s => s.id !== id));
  }

  ngOnDestroy() {
    if (this.realtimeSalas) {
      this.supabase.removeChannel(this.realtimeSalas);
    }
  }
}