import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandyService } from '../../services/candy.service';
import { Producto, Combo } from '../../models/producto';
import { Auth } from '../../services/auth';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-candy-bar-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './candy-bar-admin.component.html',
  styleUrls: ['./candy-bar-admin.component.css']
})
export class CandyBarAdminComponent implements OnInit {
  private candyService = inject(CandyService);

  productos = signal<Producto[]>([]);
  combos = signal<Combo[]>([]);
  cargando = signal<boolean>(true);
  private auth = inject(Auth);
private supabase = inject(SupabaseService).client;
  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando.set(true);
    try {
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
      this.productos.update(lista => [...lista, creado]);
    }
  }

  async eliminarProducto(id: number) {
    const exito = await this.candyService.eliminarProducto(id);
    if (exito) {
      this.productos.update(lista => lista.filter(p => p.id !== id));
    }
  }

  async actualizarStock(producto: Producto, delta: number) {
    const stockCalculado = Math.max(0, producto.stock + delta);
    const exito = await this.candyService.actualizarStock(producto.id, stockCalculado);
    if (exito) {
      this.productos.update(lista =>
        lista.map(p => p.id === producto.id ? { ...p, stock: stockCalculado } : p)
      );
    }
  }

  async actualizarPrecio(producto: Producto, nuevoPrecio: number) {
    if (nuevoPrecio <= 0) return;
    const exito = await this.candyService.actualizarPrecio(producto.id, nuevoPrecio);
    if (exito) {
      this.productos.update(lista =>
        lista.map(p => p.id === producto.id ? { ...p, precio: nuevoPrecio } : p)
      );
    }
    const user = await this.auth.getCurrentUser();
    await this.supabase.from('logs_actividad').insert({
      usuario: user?.email || 'admin@cinenova.com',
      accion: 'Modificó Precio Producto',
      entidad_afectada: 'productos',
      detalle: `${producto.nombre}: de $${producto.precio} a $${nuevoPrecio}`
    });

  }

  async modificarPrecioCombo(combo: Combo) {
    const nuevo = prompt(`Ingresá el nuevo precio para ${combo.nombre}:`, combo.precio.toString());
    if (!nuevo) return;
    const precio = parseFloat(nuevo);
    if (isNaN(precio) || precio <= 0) return;

    const ok = await this.candyService.actualizarPrecioCombo(combo.id, precio);
    if (ok) {
      this.combos.update(list => list.map(c => c.id === combo.id ? { ...c, precio } : c));
    }
  }
}