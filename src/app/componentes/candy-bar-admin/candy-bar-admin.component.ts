import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandyService } from '../../services/candy.service';

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
export class CandyBarAdminComponent implements OnInit{
  // productos: Producto[] = [
  //   { id: 1, nombre: 'Pochoclos Grandes', precio: 1500, stock: 50, categoria: 'Pochoclos' },
  //   { id: 2, nombre: 'Gaseosa 500ml', precio: 1200, stock: 80, categoria: 'Bebidas' },
  //   { id: 3, nombre: 'Combo Nachos + Bebida', precio: 2500, stock: 30, categoria: 'Combos' }
  // ];

  // Inyección del servicio
  private candyService = inject(CandyService);

  // Señales para guardar lo que viene de la base
  productos = signal<Producto[]>([]);
  combos = signal<any[]>([]);
  cargando = signal<boolean>(true);

  
  async ngOnInit() {
    
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando.set(true);

    try {
      // Trae ambos en paralelo directo desde Supabase
      const [listaProductos, listaCombos] = await Promise.all([
        this.candyService.getProductos(),
        this.candyService.getCombos()
      ]);

      this.productos.set(listaProductos);
      this.combos.set(listaCombos);
    } catch (error) {
      console.error('Error al cargar datos desde Supabase:', error);
    } finally {
      this.cargando.set(false);
    }
  }

  async cargarProductos() {
    const datos = await this.candyService.getProductos();
    this.productos.set(datos);
  }
  // Alta en Supabase
  async agregarProducto() {
    const nuevo = {
      nombre: 'Nuevo Snack',
      precio: 1500,
      stock: 20,
      categoria: 'Snacks',
      imagen_url: ''
    };

    const creado = await this.candyService.agregarProducto(nuevo);
    if (creado) {
      // Agrega el registro con el ID real devuelto por la BD
      this.productos.update(lista => [...lista, creado]);
    }
  }

  // Baja en Supabase
  async eliminarProducto(id: number) {
    const exito = await this.candyService.eliminarProducto(id);
    if (exito) {
      this.productos.update(lista => lista.filter(p => p.id !== id));
    }
  }

  // Modificar stock en Supabase
  async actualizarStock(producto: Producto, delta: number) {
    const stockCalculado = Math.max(0, producto.stock + delta);
    const exito = await this.candyService.actualizarStock(producto.id, stockCalculado);
    
    if (exito) {
      this.productos.update(lista => 
        lista.map(p => p.id === producto.id ? { ...p, stock: stockCalculado } : p)
      );
    }
  }

  // Modificar precio en Supabase
  async actualizarPrecio(producto: Producto, nuevoPrecio: number) {
    if (nuevoPrecio <= 0) return;
    const exito = await this.candyService.actualizarPrecio(producto.id, nuevoPrecio);

    if (exito) {
      this.productos.update(lista =>
        lista.map(p => p.id === producto.id ? { ...p, precio: nuevoPrecio } : p)
      );
    }
  }
}
