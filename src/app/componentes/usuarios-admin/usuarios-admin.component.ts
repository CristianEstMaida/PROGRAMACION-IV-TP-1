import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDeleteDirective } from '../../directivas/confirm-delete.directive';
import { SupabaseService } from '../../services/supabase.service';

export interface Usuario {
  id: string; // UUID de Supabase auth/perfiles
  nombre: string;
  apellido?: string;
  email?: string;
  rol: 'admin' | 'cliente' | 'operador' | string;
  activo?: boolean;
}

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, ConfirmDeleteDirective],
  templateUrl: './usuarios-admin.component.html',
  styleUrls: ['./usuarios-admin.component.css']
})
export class UsuariosAdminComponent implements OnInit {
  private supabase = inject(SupabaseService).client;

  usuarios = signal<Usuario[]>([]);
  cargando = signal<boolean>(true);

  async ngOnInit() {
    await this.cargarUsuarios();
  }

  // 1. GET: Traer perfiles desde Supabase
  async cargarUsuarios() {
    this.cargando.set(true);
    const { data, error } = await this.supabase
      .from('perfiles')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al cargar usuarios:', error.message);
    } else if (data) {
      this.usuarios.set(data);
    }
    this.cargando.set(false);
  }

  // 2. UPDATE: Cambiar rol en Supabase
  async cambiarRol(usuario: Usuario, nuevoRol: string) {
    if (usuario.rol === nuevoRol) return;

    const { error } = await this.supabase
      .from('perfiles')
      .update({ rol: nuevoRol })
      .eq('id', usuario.id);

    if (error) {
      console.error('Error al actualizar rol:', error.message);
      alert('No se pudo actualizar el rol');
      return;
    }

    this.usuarios.update(lista =>
      lista.map(u => (u.id === usuario.id ? { ...u, rol: nuevoRol } : u))
    );
  }

  cambiarRolDesdeEvento(usuario: Usuario, event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.cambiarRol(usuario, value);
  }

  // 3. UPDATE: Alternar estado activo / inactivo
  async toggleActivo(usuario: Usuario) {
    const nuevoEstado = !usuario.activo;

    const { error } = await this.supabase
      .from('perfiles')
      .update({ activo: nuevoEstado })
      .eq('id', usuario.id);

    if (error) {
      console.error('Error al cambiar estado activo:', error.message);
      alert('No se pudo cambiar el estado del usuario');
      return;
    }

    this.usuarios.update(lista =>
      lista.map(u => (u.id === usuario.id ? { ...u, activo: nuevoEstado } : u))
    );
  }

  // 4. DELETE: Eliminar perfil (o desactivarlo si tiene restricciones referenciales)
  async eliminarUsuario(id: string) {
    const { error } = await this.supabase
      .from('perfiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar usuario:', error.message);
      alert('No se pudo eliminar el usuario (puede tener compras o reservas asociadas)');
      return;
    }

    this.usuarios.update(lista => lista.filter(u => u.id !== id));
  }
}