import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Auth } from '../../services/auth';

export interface Cupon {
  id: number;
  codigo: string;
  descuento_porcentaje: number;
  solo_primera_compra: boolean;
  edad_minima: number;
  activo: boolean;
}

@Component({
  selector: 'app-cupones-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cupones-admin.component.html',
  styleUrls: ['./cupones-admin.component.css']
})
export class CuponesAdminComponent implements OnInit {
  private supabase = inject(SupabaseService).client;
  private auth = inject(Auth);

  cupones = signal<Cupon[]>([]);
  filtro = signal<string>('');
  cargando = signal<boolean>(true);

  // Modelo para creación de nuevo cupón
  nuevoCupon = signal({
    codigo: '',
    descuento_porcentaje: 10,
    solo_primera_compra: false,
    edad_minima: 0,
    activo: true
  });

  // Control del Modal de Edición
  mostrarModalEdicion = signal<boolean>(false);
  guardandoEdicion = signal<boolean>(false);
  cuponEnEdicion = signal<Cupon | null>(null);
  nuevoPorcentaje = signal<number>(10);

  cuponesFiltrados = computed(() => {
    const q = this.filtro().toUpperCase().trim();
    if (!q) return this.cupones();
    return this.cupones().filter(c => c.codigo.includes(q));
  });

  async ngOnInit() {
    await this.cargarCupones();
  }

  // 1. GET: Traer todos los cupones desde Supabase
  async cargarCupones() {
    this.cargando.set(true);
    const { data, error } = await this.supabase
      .from('cupones')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error al cargar cupones:', error.message);
    } else if (data) {
      this.cupones.set(data);
    }
    this.cargando.set(false);
  }

  // 2. POST: Insertar un cupón nuevo en Supabase
  async crearCupon() {
    const model = this.nuevoCupon();
    const codigoLimpio = model.codigo.trim().toUpperCase();

    if (!codigoLimpio) {
      alert('Ingresá un código para el cupón.');
      return;
    }

    if (model.descuento_porcentaje <= 0 || model.descuento_porcentaje > 100) {
      alert('El porcentaje debe estar entre 1 y 100.');
      return;
    }

    const { data, error } = await this.supabase
      .from('cupones')
      .insert({
        codigo: codigoLimpio,
        descuento_porcentaje: model.descuento_porcentaje,
        solo_primera_compra: model.solo_primera_compra,
        edad_minima: model.edad_minima,
        activo: model.activo
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear cupón:', error.message);
      alert('No se pudo guardar el cupón (posible código duplicado).');
      return;
    }

    if (data) {
      this.cupones.update(lista => [data, ...lista]);
      
      const user = await this.auth.getCurrentUser();
      await this.supabase.from('logs_actividad').insert({
        usuario: user?.email || 'admin@cinenova.com',
        accion: 'Creó Cupón',
        entidad_afectada: 'cupones',
        detalle: `Cupón ${codigoLimpio} (${model.descuento_porcentaje}% OFF)`
      });
      // Reset del formulario
      this.nuevoCupon.set({
        codigo: '',
        descuento_porcentaje: 10,
        solo_primera_compra: false,
        edad_minima: 0,
        activo: true
      });
    }
  }

  // 3. UPDATE: Pausar o reanudar el cupón
  async toggleActivo(cupon: Cupon) {
    const nuevoEstado = !cupon.activo;

    const { error } = await this.supabase
      .from('cupones')
      .update({ activo: nuevoEstado })
      .eq('id', cupon.id);

    if (error) {
      console.error('Error al alternar estado de cupón:', error.message);
      alert('Error al actualizar el cupón');
      return;
    }

    this.cupones.update(lista =>
      lista.map(c => c.id === cupon.id ? { ...c, activo: nuevoEstado } : c)
    );

    const user = await this.auth.getCurrentUser();
    await this.supabase.from('logs_actividad').insert({
      usuario: user?.email || 'admin@cinenova.com',
      accion: nuevoEstado ? 'Activó Cupón' : 'Pausó Cupón',
      entidad_afectada: 'cupones',
      detalle: `Cupón: ${cupon.codigo}`
    });
  }

  // 4. DELETE: Eliminar cupón
  async eliminarCupon(id: number) {
    const seguro = confirm('¿Eliminar definitivamente este cupón?');
    if (!seguro) return;

    const { error } = await this.supabase
      .from('cupones')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar cupón:', error.message);
      alert('No se pudo eliminar (puede estar referenciado en compras pasadas).');
      return;
    }

    this.cupones.update(lista => lista.filter(c => c.id !== id));
  }

  abrirModalEdicion(cupon: Cupon) {
    this.cuponEnEdicion.set(cupon);
    this.nuevoPorcentaje.set(cupon.descuento_porcentaje);
    this.mostrarModalEdicion.set(true);
  }

  cerrarModalEdicion() {
    if (this.guardandoEdicion()) return;
    this.mostrarModalEdicion.set(false);
    this.cuponEnEdicion.set(null);
  }

  async confirmarEdicion() {
    const cupon = this.cuponEnEdicion();
    const porcentaje = Number(this.nuevoPorcentaje());
    
    if (!cupon) return;
    if (isNaN(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
      alert('El porcentaje debe estar comprendido entre 1 y 100.');
      return;
    }

    this.guardandoEdicion.set(true);
    const porcentajeAnterior = cupon.descuento_porcentaje;
    try {
      const { error } = await this.supabase
        .from('cupones')
        .update({ descuento_porcentaje: porcentaje })
        .eq('id', cupon.id);

      if (error) {
        alert('Error al actualizar el cupón: ' + error.message);
        return;
      }

      this.cupones.update(lista =>
        lista.map(c => c.id === cupon.id ? { ...c, descuento_porcentaje: porcentaje } : c)
      );

      const user = await this.auth.getCurrentUser();
      await this.supabase.from('logs_actividad').insert({
        usuario: user?.email || 'admin@cinenova.com',
        accion: 'Modificó Descuento Cupón',
        entidad_afectada: 'cupones',
        detalle: `${cupon.codigo}: de ${porcentajeAnterior}% a ${porcentaje}% OFF`
      });
        
      this.cerrarModalEdicion();
    } catch (err: any) {
      console.error('Error al actualizar el cupón:', err);
      alert('Error al actualizar el cupón: ' + (err.message || err));
    }
    finally {
      this.guardandoEdicion.set(false);
    }
  }
}