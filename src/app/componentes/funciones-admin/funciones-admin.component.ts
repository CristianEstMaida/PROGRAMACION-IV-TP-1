import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

interface Funcion {
  id: number;
  pelicula: string;
  sala: string;
  horario: string; // formato HH:mm
  precio: number;
  formato: string;
}

@Component({
  selector: 'app-funciones-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './funciones-admin.component.html',
  styleUrls: ['./funciones-admin.component.css']
})
export class FuncionesAdminComponent {
  // funciones: Funcion[] = [
  //   { id: 1, pelicula: 'Avatar 2', sala: 'Sala 1', horario: '20:00', precio: 2500, formato: '3D' },
  //   { id: 2, pelicula: 'Titanic', sala: 'Sala 2', horario: '18:30', precio: 2000, formato: '2D' }
  // ];

  // const { data } = await this.supabase
  // .from('funciones')
  // .select('id, fecha_hora, precio, tipo_funcion, peliculas(titulo), salas(nombre)');
  // salasDisponibles = ['Sala 1', 'Sala 2', 'Sala 3'];


  private supabase = inject(SupabaseService).client;

  funciones = signal<any[]>([]);
  peliculas = signal<any[]>([]);
  salas = signal<any[]>([]);
  async ngOnInit() {
    await Promise.all([this.cargarFunciones(), this.cargarAuxiliares()]);
  }

  async cargarAuxiliares() {
    const { data: p } = await this.supabase.from('peliculas').select('id, titulo');
    const { data: s } = await this.supabase.from('salas').select('id, nombre');
    if (p) this.peliculas.set(p);
    if (s) this.salas.set(s);
  }

  async cargarFunciones() {
    const { data } = await this.supabase
      .from('funciones')
      .select('id, fecha_hora, precio, tipo_funcion, peliculas(titulo), salas(nombre)')
      .order('fecha_hora', { ascending: true });

    if (data) {
      this.funciones.set(
        data.map(f => ({
          id: f.id,
          pelicula: (f.peliculas as any)?.titulo || 'Sin Título',
          sala: (f.salas as any)?.nombre || 'Sin Sala',
          horario: new Date(f.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          formato: f.tipo_funcion,
          precio: f.precio
        }))
      );
    }
  }

  // agregarFuncion(pelicula: string, horario: string, formato: string, precio: number) {
  //   const salaAsignada = this.asignarSala(horario);

  //   if (!salaAsignada) {
  //     alert('No hay salas disponibles para ese horario (mínimo 30 min entre funciones).');
  //     return;
  //   }

  //   const nueva: Funcion = {
  //     id: this.funciones.length + 1,
  //     pelicula,
  //     sala: salaAsignada,
  //     horario,
  //     precio,
  //     formato
  //   };

  //   this.funciones.push(nueva);
  // }

  // eliminarFuncion(id: number) {
  //   this.funciones = this.funciones.filter(f => f.id !== id);
  // }

  async agregarFuncion(peliculaId: string, salaId: string, horario: string, formato: string, precio: number) {
    if (!peliculaId || !salaId || !horario) return;

    // Se asigna para la fecha actual combinada con el horario ingresado
    const fechaHora = new Date();
    const [h, m] = horario.split(':').map(Number);
    fechaHora.setHours(h, m, 0, 0);

    const { error } = await this.supabase.from('funciones').insert({
      pelicula_id: Number(peliculaId),
      sala_id: Number(salaId),
      fecha_hora: fechaHora.toISOString(),
      tipo_funcion: formato,
      precio: Number(precio),
      estado: 'activa'
    });

    if (!error) {
      await this.cargarFunciones();
    }
  }

  async eliminarFuncion(id: number) {
    await this.supabase.from('funciones').delete().eq('id', id);
    await this.cargarFunciones();
  }


  // private asignarSala(horario: string): string | null {
  //   const [h, m] = horario.split(':').map(Number);
  //   const nuevaHora = h * 60 + m;

  //   for (const sala of this.salasDisponibles) {
  //     const funcionesSala = this.funciones.filter(f => f.sala === sala);

  //     const conflicto = funcionesSala.some(f => {
  //       const [fh, fm] = f.horario.split(':').map(Number);
  //       const horaExistente = fh * 60 + fm;
  //       return Math.abs(horaExistente - nuevaHora) < 30; 
  //     });

  //     if (!conflicto) {
  //       return sala;
  //     }
  //   }

  //   return null; 
  // }
}
