import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandyService } from '../../services/candy.service';
import { Producto, Combo } from '../../models/producto';
import { Auth } from '../../services/auth';
import { SupabaseService } from '../../services/supabase.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-candy-bar-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candy-bar-admin.component.html',
  styleUrls: ['./candy-bar-admin.component.css']
})
export class CandyBarAdminComponent implements OnInit {
  private candyService = inject(CandyService);
  private auth = inject(Auth);
  private supabase = inject(SupabaseService).client;
  
  productos = signal<Producto[]>([]);
  combos = signal<Combo[]>([]);
  cargando = signal<boolean>(true);

  // Control del Modal (Alta y Edición)
  mostrarModal = signal<boolean>(false);
  guardandoProducto = signal<boolean>(false);
  modoEdicion = signal<boolean>(false);
  productoIdEnEdicion = signal<number | null>(null);

  // Control del Modal de Precio de Combo
  mostrarModalCombo = signal<boolean>(false);
  guardandoCombo = signal<boolean>(false);
  comboEnEdicion = signal<Combo | null>(null);
  nuevoPrecioCombo = signal<number>(0);

  // Campos del formulario
  formNombre = signal<string>('');
  formCategoria = signal<string>('Snacks');
  formPrecio = signal<number>(1500);
  formStock = signal<number>(20);
  formImagen = signal<string>('https://images.unsplash.com/photo-1572177191856-3cde618dee1f?w=300');
  
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

  abrirModalNuevo() {
    this.modoEdicion.set(false);
    this.productoIdEnEdicion.set(null);
    this.formNombre.set('');
    this.formCategoria.set('Snacks');
    this.formPrecio.set(1500);
    this.formStock.set(20);
    this.formImagen.set('https://images.unsplash.com/photo-1572177191856-3cde618dee1f?w=300');
    this.mostrarModal.set(true);
  }

  abrirModalEdicion(p: Producto) {
    this.modoEdicion.set(true);
    this.productoIdEnEdicion.set(p.id);
    this.formNombre.set(p.nombre);
    this.formCategoria.set(p.categoria || 'Snacks');
    this.formPrecio.set(p.precio);
    this.formStock.set(p.stock);
    this.formImagen.set(p.imagen_url || '');
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    if (this.guardandoProducto()) return;
    this.mostrarModal.set(false);
  }

  async cargarProductos() {
    const datos = await this.candyService.getProductos();
    this.productos.set(datos);
  }

  async guardarProducto() {
    const nombre = this.formNombre().trim();
    const precio = Number(this.formPrecio());
    const stock = Number(this.formStock());

    if (!nombre) {
      alert('Ingresá el nombre del producto.');
      return;
    }

    if (isNaN(precio) || precio <= 0) {
      alert('El precio debe ser mayor a 0.');
      return;
    }

    if (isNaN(stock) || stock < 0) {
      alert('El stock no puede ser negativo.');
      return;
    }

    this.guardandoProducto.set(true);
    const user = await this.auth.getCurrentUser();
    const operadorEmail = user?.email || 'admin@cinenova.com';

    try {
      if (this.modoEdicion()) {
        const id = this.productoIdEnEdicion();
        if (!id) return;

        const actualizacion = {
          nombre: nombre,
          categoria: this.formCategoria(),
          precio: precio,
          stock: stock,
          imagen_url: this.formImagen().trim()
        };

        const ok = await this.candyService.actualizarProductoCompleto(id, actualizacion);
        if (ok) {
          this.productos.update(lista =>
            lista.map(p => p.id === id ? { ...p, ...actualizacion } : p)
          );

          await this.supabase.from('logs_actividad').insert({
            usuario: operadorEmail,
            accion: 'Modificó Producto Candy',
            entidad_afectada: 'productos',
            detalle: `Producto #${id}: ${nombre} ($${precio} - ${stock} u.)`
          });

          this.cerrarModal();
        } else {
          alert('Error al actualizar el producto en Supabase.');
        }
      } else {
        const nuevo: Omit<Producto, 'id'> = {
          nombre: nombre,
          categoria: this.formCategoria(),
          precio: precio,
          stock: stock,
          imagen_url: this.formImagen().trim(),
          activo: true
        };

        const creado = await this.candyService.agregarProducto(nuevo);
        if (creado) {
          this.productos.update(lista => [...lista, creado]);

          await this.supabase.from('logs_actividad').insert({
            usuario: operadorEmail,
            accion: 'Alta Producto Candy',
            entidad_afectada: 'productos',
            detalle: `${nombre} ($${precio} - ${stock} u.)`
          });

          this.cerrarModal();
        } else {
          alert('Error al guardar el producto en Supabase.');
        }
      }
    } catch (err: any) {
      console.error(err);
      alert('Ocurrió un error inesperado.');
    } finally {
      this.guardandoProducto.set(false);
    }
  }

 async eliminarProducto(id: number) {
    const p = this.productos().find(item => item.id === id);
    const seguro = confirm(`¿Dar de baja el producto "${p?.nombre || 'seleccionado'}"?`);
    if (!seguro) return;

    const exito = await this.candyService.eliminarProducto(id);
    if (exito) {
      this.productos.update(lista => lista.filter(item => item.id !== id));

      const user = await this.auth.getCurrentUser();
      await this.supabase.from('logs_actividad').insert({
        usuario: user?.email || 'admin@cinenova.com',
        accion: 'Desactivó Producto Candy',
        entidad_afectada: 'productos',
        detalle: `Producto #${id}: ${p?.nombre}`
      });
    } else {
      alert('No se pudo desactivar el producto.');
    }
  }

  async actualizarStock(producto: Producto, delta: number) {
    const stockCalculado = Math.max(0, producto.stock + delta);
    const exito = await this.candyService.actualizarStock(producto.id, stockCalculado);
    if (exito) {
      this.productos.update(lista =>
        lista.map(p => p.id === producto.id ? { ...p, stock: stockCalculado } : p)
      );

      const user = await this.auth.getCurrentUser();
      await this.supabase.from('logs_actividad').insert({
        usuario: user?.email || 'admin@cinenova.com',
        accion: 'Ajustó Stock Candy',
        entidad_afectada: 'productos',
        detalle: `${producto.nombre}: ${producto.stock} -> ${stockCalculado} u.`
      });
    }
  }

  async actualizarPrecio(producto: Producto, nuevoPrecio: number) {
    if (nuevoPrecio <= 0) return;
    const exito = await this.candyService.actualizarPrecio(producto.id, nuevoPrecio);
    if (exito) {
      this.productos.update(lista =>
        lista.map(p => p.id === producto.id ? { ...p, precio: nuevoPrecio } : p)
      );

      const user = await this.auth.getCurrentUser();
      await this.supabase.from('logs_actividad').insert({
        usuario: user?.email || 'admin@cinenova.com',
        accion: 'Modificó Precio Producto',
        entidad_afectada: 'productos',
        detalle: `${producto.nombre}: de $${producto.precio} a $${nuevoPrecio}`
      });
    }
    

  }

  abrirModalPrecioCombo(combo: Combo) {
    this.comboEnEdicion.set(combo);
    this.nuevoPrecioCombo.set(combo.precio);
    this.mostrarModalCombo.set(true);
  }

  cerrarModalCombo() {
    if (this.guardandoCombo()) return;
    this.mostrarModalCombo.set(false);
    this.comboEnEdicion.set(null);
  }

  async confirmarPrecioCombo() {
    const combo = this.comboEnEdicion();
    const precio = Number(this.nuevoPrecioCombo());

    if (!combo) return;
    if (isNaN(precio) || precio <= 0) {
      alert('Ingresá un precio numérico mayor a 0.');
      return;
    }

    this.guardandoCombo.set(true);
    const precioAnterior = combo.precio;

    try {
      const ok = await this.candyService.actualizarPrecioCombo(combo.id, precio);
      if (ok) {
        this.combos.update(list =>
          list.map(c => c.id === combo.id ? { ...c, precio } : c)
        );

        const user = await this.auth.getCurrentUser();
        await this.supabase.from('logs_actividad').insert({
          usuario: user?.email || 'admin@cinenova.com',
          accion: 'Modificó Precio Combo',
          entidad_afectada: 'combos',
          detalle: `${combo.nombre}: de $${precioAnterior} a $${precio}`
        });

        this.cerrarModalCombo();
      } else {
        alert('No se pudo actualizar el precio del combo.');
      }
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error inesperado al actualizar el combo.');
    } finally {
      this.guardandoCombo.set(false);
    }
  }
}