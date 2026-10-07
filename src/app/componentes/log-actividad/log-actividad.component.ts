import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

// interface LogEntry {
//   fecha: string;
//   usuario: string;
//   accion: string;
//   detalle: string;
// }

@Component({
  selector: 'app-log-actividad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './log-actividad.component.html',
  styleUrls: ['./log-actividad.component.css']
})
export class LogActividadComponent implements OnInit{

  paginaActual = signal<number>(0);
  tamanioPagina = 10;
  totalLogs = signal<number>(0);
  cargandoLogs = signal<boolean>(false);
  private supabase = inject(SupabaseService).client;
  logs = signal<any[]>([]);

  totalPaginas = computed(() => {
    return Math.ceil(this.totalLogs() / this.tamanioPagina) || 1;
  });

  async ngOnInit() {
    await this.cargarLogs();
  }

  async cargarLogs() {
   this.cargandoLogs.set(true);
    const from = this.paginaActual() * this.tamanioPagina;
    const to = from + this.tamanioPagina - 1;

    try {
      const { data, count, error } = await this.supabase
        .from('logs_actividad')
        .select('*', { count: 'exact' })
        .order('fecha', { ascending: false })
        .range(from, to);

      if (error) throw error;

      this.logs.set(data || []);
      if (count !== null) {
        this.totalLogs.set(count);
      }
    } catch (err) {
      console.error('Error cargando logs:', err);
    } finally {
      this.cargandoLogs.set(false);
    }
  }

  paginaSiguiente() {
    const maxPaginas = Math.ceil(this.totalLogs() / this.tamanioPagina);
    if (this.paginaActual() + 1 < maxPaginas) {
      this.paginaActual.update(p => p + 1);
      this.cargarLogs();
    }
  }

  paginaAnterior() {
    if (this.paginaActual() > 0) {
      this.paginaActual.update(p => p - 1);
      this.cargarLogs();
    }
  }
}
