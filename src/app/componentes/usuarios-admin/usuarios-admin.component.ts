import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDeleteDirective } from '../../directivas/confirm-delete.directive';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string; // admin, cliente, operador
  activo: boolean;
}

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, ConfirmDeleteDirective],
  templateUrl: './usuarios-admin.component.html',
  styleUrls: ['./usuarios-admin.component.css']
})
export class UsuariosAdminComponent {
  usuarios: Usuario[] = [
    { id: 1, nombre: 'Juan Pérez', email: 'juan@example.com', rol: 'cliente', activo: true },
    { id: 2, nombre: 'María Gómez', email: 'maria@example.com', rol: 'operador', activo: true },
    { id: 3, nombre: 'Admin', email: 'admin@example.com', rol: 'admin', activo: true }
  ];

  agregarUsuario() {
    const nuevo: Usuario = {
      id: this.usuarios.length + 1,
      nombre: 'Nuevo Usuario',
      email: 'nuevo@example.com',
      rol: 'cliente',
      activo: true
    };
    this.usuarios.push(nuevo);
  }

  eliminarUsuario(id: number) {
    this.usuarios = this.usuarios.filter(u => u.id !== id);
  }

  toggleActivo(usuario: Usuario) {
    usuario.activo = !usuario.activo;
  }

  cambiarRol(usuario: Usuario, nuevoRol: string) {
    usuario.rol = nuevoRol;
  }
  cambiarRolDesdeEvento(usuario: Usuario, event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.cambiarRol(usuario, value);
    }

}
