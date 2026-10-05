import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDeleteDirective } from '../../directivas/confirm-delete.directive';
import { SupabaseService } from '../../services/supabase.service';
import { Auth } from '../../services/auth';
import { Perfil } from '../../models/perfil';

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, ConfirmDeleteDirective],
  templateUrl: './usuarios-admin.component.html',
  styleUrls: ['./usuarios-admin.component.css']
})
export class UsuariosAdminComponent implements OnInit {
  private supabase = inject(SupabaseService).client;
  private auth = inject(Auth);

  usuarios = signal<Perfil[]>([]);
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
      this.usuarios.set(data as Perfil[]);
    }
    this.cargando.set(false);
  }

  // 2. UPDATE: Cambiar rol en Supabase
  async cambiarRol(usuario: Perfil, nuevoRol: string) {
    if (usuario.rol === nuevoRol) return;
    const rolAnterior = usuario.rol;

    const { error } = await this.supabase
      .from('perfiles')
      .update({ rol: nuevoRol as any })
      .eq('id', usuario.id);

    if (error) {
      console.error('Error al actualizar rol:', error.message);
      alert('No se pudo actualizar el rol');
      return;
    }

    this.usuarios.update(lista =>
      lista.map(u => (u.id === usuario.id ? { ...u, rol: nuevoRol as any } : u))
    );

    // Auditoría de cambio de rol
    const user = await this.auth.getCurrentUser();
    await this.supabase.from('logs_actividad').insert({
      usuario: user?.email || 'admin@cinenova.com',
      accion: 'Modificó Rol de Usuario',
      entidad_afectada: 'perfiles',
      detalle: `${usuario.email || usuario.nombre}: ${rolAnterior} -> ${nuevoRol}`
    });
  }

  // Ahora recibe Perfil directamente
  cambiarRolDesdeEvento(usuario: Perfil, event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.cambiarRol(usuario, value);
  }

  // 3. UPDATE: Alternar estado activo / inactivo
  async toggleActivo(usuario: Perfil) {
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

    // Auditoría de activación / suspensión
    const user = await this.auth.getCurrentUser();
    await this.supabase.from('logs_actividad').insert({
      usuario: user?.email || 'admin@cinenova.com',
      accion: nuevoEstado ? 'Activó Usuario' : 'Suspendió Usuario',
      entidad_afectada: 'perfiles',
      detalle: `Usuario: ${usuario.email || usuario.nombre}`
    });
  }

  // 4. DELETE: Eliminar perfil
  async eliminarUsuario(id: string) {
    const usuarioAEliminar = this.usuarios().find(u => u.id === id);
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

    // Auditoría de baja
    const user = await this.auth.getCurrentUser();
    await this.supabase.from('logs_actividad').insert({
      usuario: user?.email || 'admin@cinenova.com',
      accion: 'Eliminó Usuario',
      entidad_afectada: 'perfiles',
      detalle: `Usuario eliminado: ${usuarioAEliminar?.email || id}`
    });
  }
}