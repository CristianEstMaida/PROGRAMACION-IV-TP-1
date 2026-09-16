import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Cupon {
  id: number;
  codigo: string;
  descuento: number; // porcentaje
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
}

@Component({
  selector: 'app-cupones-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cupones-admin.component.html',
  styleUrls: ['./cupones-admin.component.css']
})
export class CuponesAdminComponent {
  cupones: Cupon[] = [
    { id: 1, codigo: 'FULLHARD20', descuento: 20, fechaInicio: '2026-09-01', fechaFin: '2026-09-30', activo: true },
    { id: 2, codigo: 'VIDEO10', descuento: 10, fechaInicio: '2026-09-10', fechaFin: '2026-09-20', activo: false }
  ];

  agregarCupon() {
    const nuevo: Cupon = {
      id: this.cupones.length + 1,
      codigo: 'NUEVO10',
      descuento: 10,
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: '2026-12-31',
      activo: true
    };
    this.cupones.push(nuevo);
  }

  eliminarCupon(id: number) {
    this.cupones = this.cupones.filter(c => c.id !== id);
  }

  toggleActivo(cupon: Cupon) {
    cupon.activo = !cupon.activo;
  }
}
