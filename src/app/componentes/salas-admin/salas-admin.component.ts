import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Sala {
  id: number;
  nombre: string;
  filas: number;
  columnas: number;
  tipo: string; // estándar, VIP, accesible
}

@Component({
  selector: 'app-salas-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './salas-admin.component.html',
  styleUrls: ['./salas-admin.component.css']
})
export class SalasAdminComponent {
  salas: Sala[] = [
    { id: 1, nombre: 'Sala 1', filas: 10, columnas: 12, tipo: 'Estándar' },
    { id: 2, nombre: 'Sala 2', filas: 8, columnas: 10, tipo: 'VIP' }
  ];

  agregarSala() {
    const nueva: Sala = {
      id: this.salas.length + 1,
      nombre: `Sala ${this.salas.length + 1}`,
      filas: 10,
      columnas: 12,
      tipo: 'Estándar'
    };
    this.salas.push(nueva);
  }

  eliminarSala(id: number) {
    this.salas = this.salas.filter(s => s.id !== id);
  }
}
