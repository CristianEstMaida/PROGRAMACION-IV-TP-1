import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root'
})
export class CandyService {
  // Inyección moderna de Supabase
  private supabase = inject(SupabaseService).client;

  // 1. GET de productos individuales
  async getProductos(): Promise<Producto[]> {
  const { data, error } = await this.supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
    .order('id', { ascending: true });

  if (error) return [];
  return data || [];
}
  // 2. GET de combos promocionales
  async getCombos(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('combos')
      .select('*')
      .order('precio', { ascending: true });

    if (error) {
      console.error('Error al obtener combos:', error.message);
      return [];
    }
    return data || [];
  }

  // 2. Crear producto (sin pasarle ID, la BD lo autoincrementa)
  async agregarProducto(nuevo: Omit<Producto, 'id'>): Promise<Producto | null> {
    const { data, error } = await this.supabase
      .from('productos')
      .insert(nuevo)
      .select()
      .single();

    if (error) {
      console.error('Error al insertar producto:', error.message);
      return null;
    }
    return data;
  }

  // 3. Eliminar producto por ID
  async eliminarProducto(id: number): Promise<boolean> {
  const { error } = await this.supabase
    .from('productos')
    .update({ activo: false })
    .eq('id', id);

  if (error) {
    console.error('Error al desactivar producto:', error.message);
    return false;
  }
  return true;
}

  // 4. Actualizar stock
  async actualizarStock(id: number, nuevoStock: number): Promise<boolean> {
    const { error } = await this.supabase
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar stock:', error.message);
      return false;
    }
    return true;
  }

  // 5. Actualizar precio
  async actualizarPrecio(id: number, nuevoPrecio: number): Promise<boolean> {
    const { error } = await this.supabase
      .from('productos')
      .update({ precio: nuevoPrecio })
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar precio:', error.message);
      return false;
    }
    return true;
  }
}