import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sala } from '../../models/sala';

@Component({
  selector: 'app-salas-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './salas-admin.component.html',
  styleUrls: ['./salas-admin.component.css']
})
export class SalasAdminComponent {
  salas: Sala[] = [
    { 
      id: 1, 
      nombre: 'Sala 1 - Principal 5D', 
      filas: 20, 
      columnas: 28, 
      capacidad: 560, 
      tipo: '5D / Gran Formato' 
    },
    { 
      id: 2, 
      nombre: 'Sala 2 - Confort', 
      filas: 10, 
      columnas: 12, 
      capacidad: 120, 
      tipo: 'Estándar' 
    },
    { 
      id: 3, 
      nombre: 'Sala 3 - MacroXE', 
      filas: 8, 
      columnas: 10, 
      capacidad: 80, 
      tipo: 'VIP' 
    }
  ];

  agregarSala() {
    const nueva: Sala = {
      id: this.salas.length + 1,
      nombre: `Sala ${this.salas.length + 1}`,
      filas: 10,
      columnas: 12,
      capacidad: 120,
      tipo: 'Estándar'
    };
    this.salas.push(nueva);
  }

  eliminarSala(id: number) {
    this.salas = this.salas.filter(s => s.id !== id);
  }
}
