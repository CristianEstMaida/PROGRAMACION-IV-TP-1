import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-funciones-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './funciones-admin.component.html',
  styleUrls: ['./funciones-admin.component.css']
})
export class FuncionesAdminComponent {
  private supabase = inject(SupabaseService).client;
  private auth = inject(Auth);
  funciones = signal<any[]>([]);
  peliculas = signal<any[]>([]);
  salas = signal<any[]>([]);
  mensajeError = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  // Variables enlazadas a los 3 inputs
  funcionDia: string = '';
  funcionMes: string = '';
  funcionAnio: number = new Date().getFullYear();

  private getFechaLocal(d = new Date()): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Atributo [min] para el input de fecha (hora local, sin desfase UTC)
  fechaMinima: string = this.getFechaLocal();

  // Fecha de hoy en formato YYYY-MM-DD para el atributo [min] del HTML

  obtenerHoraMinima(dia: string | number, mes: string, anio: string | number): string {
    if (!dia || !mes || !anio) return '00:00';

    const diaStr = String(dia).padStart(2, '0');
    const fechaIngresada = `${anio}-${mes}-${diaStr}`;

    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const fechaHoy = `${yyyy}-${mm}-${dd}`;

    // Si la fecha elegida es hoy, la hora mínima es la hora actual redondeada
    if (fechaIngresada === fechaHoy) {
      const hh = String(hoy.getHours()).padStart(2, '0');
      const min = String(hoy.getMinutes()).padStart(2, '0');
      return `${hh}:${min}`;
    }

    // Si es un día futuro, puede empezar desde las 00:00
    return '00:00';
  }

  async ngOnInit() {
    await Promise.all([this.cargarFunciones(), this.cargarAuxiliares()]);
  }

  async cargarAuxiliares() {
    const { data: p } = await this.supabase
      .from('peliculas')
      .select('id, titulo, duracion_minutos');

    // Solo cargamos salas que estén activas para asignación automática
    const { data: s } = await this.supabase
      .from('salas')
      .select('id, nombre')
      .eq('activa', true);

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

  async agregarFuncion(peliculaIdStr: string, horario: string, formato: string, precio: number) {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

      // 0. Validar los 3 campos de fecha
    if (!this.funcionDia || !this.funcionMes || !this.funcionAnio) {
      this.mensajeError.set('Completá día, mes y año de la función.');
      return;
    }

    // 2. Validar el resto de los campos
    if (!peliculaIdStr || !horario || !precio) {
      this.mensajeError.set('Completá todos los campos obligatorios.');
      return;
    }

    // 3. Formatear la fecha a YYYY-MM-DD
    const diaPadded = String(this.funcionDia).padStart(2, '0');
    const fechaStr = `${this.funcionAnio}-${this.funcionMes}-${diaPadded}`;

    const peliculaId = Number(peliculaIdStr);
    const peliElegida = this.peliculas().find(p => p.id === peliculaId);
    const duracion = peliElegida?.duracion_minutos || 120;

    // 1. Armar fecha y hora de inicio exacta local
    const [year, month, day] = fechaStr.split('-').map(Number);
    const [h, m] = horario.split(':').map(Number);
    const inicioNueva = new Date(year, month - 1, day, h, m, 0, 0);

    // 2. Impedir funciones en el pasado
    const ahora = new Date();
    if (inicioNueva < ahora) {
      this.mensajeError.set('No se puede programar una función en una fecha u horario que ya pasó.');
      return;
    }

    // 3. Intervalo de la nueva función: Duración + 30 minutos obligatorios de limpieza
    const finConLimpiezaNueva = new Date(inicioNueva.getTime() + (duracion + 30) * 60000);

    // 4. Consultar solo las funciones del día para máxima performance
    const inicioDia = new Date(year, month - 1, day, 0, 0, 0).toISOString();
    const finDia = new Date(year, month - 1, day, 23, 59, 59).toISOString();

    const { data: funcionesExistentes, error: errFunciones } = await this.supabase
      .from('funciones')
      .select('id, sala_id, fecha_hora, peliculas(duracion_minutos)')
      .eq('estado', 'activa')
      .gte('fecha_hora', inicioDia)
      .lte('fecha_hora', finDia);

    if (errFunciones) {
      this.mensajeError.set('Error al chequear funciones existentes: ' + errFunciones.message);
      return;
    }

    const salasDisponibles = this.salas();
    if (salasDisponibles.length === 0) {
      this.mensajeError.set('No hay salas activas configuradas en el cine.');
      return;
    }

    let salaAsignadaId: number | null = null;
    let salaAsignadaNombre = '';

    // 5. Algoritmo de asignación automática de primera sala disponible
    for (const sala of salasDisponibles) {
      const funcionesDeEstaSala = (funcionesExistentes || []).filter(f => f.sala_id === sala.id);

      const hayConflicto = funcionesDeEstaSala.some(f => {
        const duracionExistente = (f.peliculas as any)?.duracion_minutos || 120;
        const inicioExistente = new Date(f.fecha_hora);
        // Margen obligatorio de la función existente
        const finExistenteConLimpieza = new Date(inicioExistente.getTime() + (duracionExistente + 30) * 60000);

        // Se solapan si ambos intervalos coinciden en el tiempo
        return inicioNueva < finExistenteConLimpieza && finConLimpiezaNueva > inicioExistente;
      });

      if (!hayConflicto) {
        salaAsignadaId = sala.id;
        salaAsignadaNombre = sala.nombre;
        break; // Primera sala libre encontrada
      }
    }

    if (!salaAsignadaId) {
      this.mensajeError.set(`No hay salas disponibles para las ${horario} hs el ${fechaStr}. Todas las salas están proyectando o en su periodo de 30 min de limpieza.`);
      return;
    }

    // 6. Insertar función con sala asignada automáticamente
    const { error } = await this.supabase.from('funciones').insert({
      pelicula_id: peliculaId,
      sala_id: salaAsignadaId,
      fecha_hora: inicioNueva.toISOString(),
      tipo_funcion: formato || '2D',
      precio: Number(precio),
      estado: 'activa'
    });

    if (!error) {
      this.mensajeExito.set(`¡Función creada con éxito! El sistema asignó automáticamente la: ${salaAsignadaNombre}.`);
      
      const currentUser = await this.auth.getCurrentUser();
      const operadorEmail = currentUser?.email || 'admin@cinenova.com';
      
      await this.supabase.from('logs_actividad').insert({
        usuario: operadorEmail,
        accion: 'Creó función',
        entidad_afectada: 'funciones',
        detalle: `${peliElegida?.titulo} (${formato || '2D'}) en ${salaAsignadaNombre} el ${fechaStr} a las ${horario} hs`
      });
      await this.cargarFunciones();
    } else {
      this.mensajeError.set('Error al guardar la función: ' + error.message);
    }
  }

  async eliminarFuncion(id: number) {
    const funcionAEliminar = this.funciones().find(f => f.id === id);
    const confirmar = confirm(`¿Estás seguro de cancelar/eliminar la función de "${funcionAEliminar?.pelicula || 'esta película'}"?`);
    if (!confirmar) return;

    const { error } = await this.supabase.from('funciones').delete().eq('id', id);
    if (!error) {
      // Auditoría de eliminación
      const currentUser = await this.auth.getCurrentUser();
      await this.supabase.from('logs_actividad').insert({
        usuario: currentUser?.email || 'admin@cinenova.com',
        accion: 'Eliminó Función',
        entidad_afectada: 'funciones',
        detalle: `Función #${id}: ${funcionAEliminar?.pelicula} (${funcionAEliminar?.sala} - ${funcionAEliminar?.fecha} ${funcionAEliminar?.horario} hs)`
      });

      await this.cargarFunciones();
    } else {
      alert('No se pudo eliminar la función: ' + error.message);
    }
  }
}