import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ClienteFidelizado {
  id: number;
  nombre: string;
  email: string;
  puntos: number;
  nivel: string; // Bronze, Silver, Gold, Platinum
}

@Component({
  selector: 'app-fidelizacion-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fidelizacion-admin.component.html',
  styleUrls: ['./fidelizacion-admin.component.css']
})
export class FidelizacionAdminComponent {
  clientes: ClienteFidelizado[] = [
    { id: 1, nombre: 'Juan Pérez', email: 'juan@example.com', puntos: 120, nivel: 'Silver' },
    { id: 2, nombre: 'María Gómez', email: 'maria@example.com', puntos: 300, nivel: 'Gold' },
    { id: 3, nombre: 'Pedro López', email: 'pedro@example.com', puntos: 50, nivel: 'Bronze' }
  ];

  agregarCliente() {
    const nuevo: ClienteFidelizado = {
      id: this.clientes.length + 1,
      nombre: 'Nuevo Cliente',
      email: 'nuevo@example.com',
      puntos: 0,
      nivel: 'Bronze'
    };
    this.clientes.push(nuevo);
  }

  eliminarCliente(id: number) {
    this.clientes = this.clientes.filter(c => c.id !== id);
  }

  sumarPuntos(cliente: ClienteFidelizado, puntos: number) {
    cliente.puntos += puntos;
    this.actualizarNivel(cliente);
  }

  actualizarNivel(cliente: ClienteFidelizado) {
    if (cliente.puntos >= 500) cliente.nivel = 'Platinum';
    else if (cliente.puntos >= 300) cliente.nivel = 'Gold';
    else if (cliente.puntos >= 100) cliente.nivel = 'Silver';
    else cliente.nivel = 'Bronze';
  }
}
