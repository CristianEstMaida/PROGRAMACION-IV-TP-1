import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
export class LogActividadComponent {
  logs: LogEntry[] = [
    { fecha: '2026-09-15 10:30', usuario: 'Admin', accion: 'Creó función', detalle: 'Avatar 2 - Sala 1 - 20:00' },
    { fecha: '2026-09-15 11:00', usuario: 'Operador', accion: 'Validó QR', detalle: 'Entrada #12345' },
    { fecha: '2026-09-15 12:15', usuario: 'Admin', accion: 'Modificó precio', detalle: 'Pochoclos Grandes $1500' },
    { fecha: '2026-09-15 13:00', usuario: 'Operador', accion: 'Registró usuario', detalle: 'Juan Pérez - fidelización' }
  ];
}
