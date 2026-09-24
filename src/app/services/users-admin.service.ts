import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface PerfilUsuario {
  id: string; // UUID de auth.users
  email?: string;
  nombre: string;
  apellido: string;
  rol: 'admin' | 'cliente' | 'operador' | string;
  puntos: number;
  credito: number;
  fecha_nacimiento?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersAdminService {
  private supabase = inject(SupabaseService).client;

  // GET: Traer todos los perfiles de usuarios registrados
  async getUsuarios(): Promise<PerfilUsuario[]> {
    const { data, error } = await this.supabase
      .from('perfiles')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al obtener usuarios de Supabase:', error.message);
      return [];
    }
    return data || [];
  }

  // UPDATE: Cambiar el rol (ej: promover a operador o admin)
  async actualizarRol(usuarioId: string, nuevoRol: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('perfiles')
      .update({ rol: nuevoRol })
      .eq('id', usuarioId);

    if (error) {
      console.error('Error al actualizar rol:', error.message);
      return false;
    }
    return true;
  }
}