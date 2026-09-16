import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string; // pochoclos, bebidas, combos, etc.
}

@Component({
  selector: 'app-candy-bar-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './candy-bar-admin.component.html',
  styleUrls: ['./candy-bar-admin.component.css']
})
export class CandyBarAdminComponent {
  productos: Producto[] = [
    { id: 1, nombre: 'Pochoclos Grandes', precio: 1500, stock: 50, categoria: 'Pochoclos' },
    { id: 2, nombre: 'Gaseosa 500ml', precio: 1200, stock: 80, categoria: 'Bebidas' },
    { id: 3, nombre: 'Combo Nachos + Bebida', precio: 2500, stock: 30, categoria: 'Combos' }
  ];

  agregarProducto() {
    const nuevo: Producto = {
      id: this.productos.length + 1,
      nombre: 'Nuevo Producto',
      precio: 1000,
      stock: 20,
      categoria: 'Otros'
    };
    this.productos.push(nuevo);
  }

  eliminarProducto(id: number) {
    this.productos = this.productos.filter(p => p.id !== id);
  }

  actualizarStock(producto: Producto, cantidad: number) {
    producto.stock += cantidad;
  }

  actualizarPrecio(producto: Producto, nuevoPrecio: number) {
    producto.precio = nuevoPrecio;
  }
}
