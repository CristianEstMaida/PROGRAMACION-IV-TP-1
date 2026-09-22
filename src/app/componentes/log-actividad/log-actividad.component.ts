import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

interface LogEntry {
  fecha: string;
  usuario: string;
  accion: string;
  detalle: string;
}

@Component({
  selector: 'app-log-actividad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './log-actividad.component.html',
  styleUrls: ['./log-actividad.component.css']
})
export class LogActividadComponent implements OnInit{
//   logs: LogEntry[] = [
//     { fecha: '2026-09-15 10:30', usuario: 'Admin', accion: 'Creó función', detalle: 'Avatar 2 - Sala 1 - 20:00' },
//     { fecha: '2026-09-15 11:00', usuario: 'Operador', accion: 'Validó QR', detalle: 'Entrada #12345' },
//     { fecha: '2026-09-15 12:15', usuario: 'Admin', accion: 'Modificó precio', detalle: 'Pochoclos Grandes $1500' },
//     { fecha: '2026-09-15 13:00', usuario: 'Operador', accion: 'Registró usuario', detalle: 'Juan Pérez - fidelización' }
//   ];

  private supabase = inject(SupabaseService).client;
  logs = signal<any[]>([]);

  async ngOnInit() {
    await this.cargarLogs();
  }

  async cargarLogs() {
    const { data } = await this.supabase
      .from('logs_actividad')
      .select('*')
      .order('fecha', { ascending: false });

    if (data) {
      this.logs.set(data);
    }
  }
}
