import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  funciones: Funcion[] = [
    { id: 1, pelicula: 'Avatar 2', sala: 'Sala 1', horario: '20:00', precio: 2500, formato: '3D' },
    { id: 2, pelicula: 'Titanic', sala: 'Sala 2', horario: '18:30', precio: 2000, formato: '2D' }
  ];

  salasDisponibles = ['Sala 1', 'Sala 2', 'Sala 3'];

  agregarFuncion(pelicula: string, horario: string, formato: string, precio: number) {
    const salaAsignada = this.asignarSala(horario);

    if (!salaAsignada) {
      alert('No hay salas disponibles para ese horario (mínimo 30 min entre funciones).');
      return;
    }

    const nueva: Funcion = {
      id: this.funciones.length + 1,
      pelicula,
      sala: salaAsignada,
      horario,
      precio,
      formato
    };

    this.funciones.push(nueva);
  }

  eliminarFuncion(id: number) {
    this.funciones = this.funciones.filter(f => f.id !== id);
  }

  private asignarSala(horario: string): string | null {
    const [h, m] = horario.split(':').map(Number);
    const nuevaHora = h * 60 + m;

    for (const sala of this.salasDisponibles) {
      const funcionesSala = this.funciones.filter(f => f.sala === sala);

      const conflicto = funcionesSala.some(f => {
        const [fh, fm] = f.horario.split(':').map(Number);
        const horaExistente = fh * 60 + fm;
        return Math.abs(horaExistente - nuevaHora) < 30; // diferencia mínima de 30 min
      });

      if (!conflicto) {
        return sala;
      }
    }

    return null; // no hay sala disponible
  }
}
