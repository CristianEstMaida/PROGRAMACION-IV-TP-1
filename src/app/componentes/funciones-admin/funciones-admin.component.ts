import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-funciones-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './funciones-admin.component.html',
  styleUrls: ['./funciones-admin.component.css']
})
export class FuncionesAdminComponent {
  private supabase = inject(SupabaseService).client;

  funciones = signal<any[]>([]);
  peliculas = signal<any[]>([]);
  salas = signal<any[]>([]);
  mensajeError = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  async ngOnInit() {
    await Promise.all([this.cargarFunciones(), this.cargarAuxiliares()]);
  }

  async cargarAuxiliares() {
    const { data: p } = await this.supabase
      .from('peliculas')
      .select('id, titulo, duracion_minutos');
    const { data: s } = await this.supabase
      .from('salas')
      .select('id, nombre');

    if (p) this.peliculas.set(p);
    if (s) this.salas.set(s);
  }

  async cargarFunciones() {
    const { data } = await this.supabase
      .from('funciones')
      .select('id, fecha_hora, precio, tipo_funcion, peliculas(titulo, duracion_minutos), salas(nombre)')
      .order('fecha_hora', { ascending: true });

    if (data) {
      this.funciones.set(
        data.map(f => ({
          id: f.id,
          pelicula: (f.peliculas as any)?.titulo || 'Sin Título',
          sala: (f.salas as any)?.nombre || 'Sin Sala',
          fecha: new Date(f.fecha_hora).toLocaleDateString('es-AR'),
          horario: new Date(f.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          formato: f.tipo_funcion,
          precio: f.precio
        }))
      );
    }
  }

  async agregarFuncion(peliculaIdStr: string, fechaStr: string, horario: string, formato: string, precio: number) {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    if (!peliculaIdStr || !fechaStr || !horario || !precio) {
      this.mensajeError.set('Completá todos los campos.');
      return;
    }

    const peliculaId = Number(peliculaIdStr);
    const peliElegida = this.peliculas().find(p => p.id === peliculaId);
    const duracion = peliElegida?.duracion_minutos || 120;

    // Calcular inicio y fin considerando 30 minutos de limpieza/receso
    const [year, month, day] = fechaStr.split('-').map(Number);
    const [h, m] = horario.split(':').map(Number);

    const inicioNueva = new Date(year, month - 1, day, h, m, 0, 0);
    // Intervalo reservado total: Duración + 30 min
    const finConLimpiezaNueva = new Date(inicioNueva.getTime() + (duracion + 30) * 60000);

    // Obtener funciones activas para validar solapamiento
    const { data: funcionesExistentes } = await this.supabase
      .from('funciones')
      .select('id, sala_id, fecha_hora, peliculas(duracion_minutos)')
      .eq('estado', 'activa');

    const salasDisponibles = this.salas();
    let salaAsignadaId: number | null = null;
    let salaAsignadaNombre = '';

    // Algoritmo de asignación automática de sala libre
    for (const sala of salasDisponibles) {
      const funcionesDeEstaSala = (funcionesExistentes || []).filter(f => f.sala_id === sala.id);

      const hayConflicto = funcionesDeEstaSala.some(f => {
        const duracionExistente = (f.peliculas as any)?.duracion_minutos || 120;
        const inicioExistente = new Date(f.fecha_hora);
        const finExistenteConLimpieza = new Date(inicioExistente.getTime() + (duracionExistente + 30) * 60000);

        // Se solapan si el inicio de una es previo al fin de la otra y viceversa
        return inicioNueva < finExistenteConLimpieza && finConLimpiezaNueva > inicioExistente;
      });

      if (!hayConflicto) {
        salaAsignadaId = sala.id;
        salaAsignadaNombre = sala.nombre;
        break; // Primera sala libre encontrada
      }
    }

    if (!salaAsignadaId) {
      this.mensajeError.set(`No hay salas disponibles para ${horario} hs el ${fechaStr}. Todas las salas están ocupadas o en periodo de limpieza (30 min).`);
      return;
    }

    // Insertar la función con la sala asignada de forma automática
    const { error } = await this.supabase.from('funciones').insert({
      pelicula_id: peliculaId,
      sala_id: salaAsignadaId,
      fecha_hora: inicioNueva.toISOString(),
      fecha_fin: finConLimpiezaNueva.toISOString(),
      tipo_funcion: formato || '2D',
      precio: Number(precio),
      estado: 'activa'
    });

    if (!error) {
      this.mensajeExito.set(`¡Función creada con éxito! El sistema asignó automáticamente la: ${salaAsignadaNombre}.`);
      await this.supabase.from('logs_actividad').insert({
        usuario: 'Admin',
        accion: 'Asignación Automática Función',
        detalle: `${peliElegida?.titulo} asignada a ${salaAsignadaNombre} (${fechaStr} ${horario} hs)`
      });
      await this.cargarFunciones();
    } else {
      this.mensajeError.set('Error al guardar la función: ' + error.message);
    }
  }

  async eliminarFuncion(id: number) {
    await this.supabase.from('funciones').delete().eq('id', id);
    await this.cargarFunciones();
  }
}