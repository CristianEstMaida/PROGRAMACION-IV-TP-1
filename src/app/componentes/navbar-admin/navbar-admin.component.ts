import { Component, inject, Input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Auth } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar-admin',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './navbar-admin.component.html',
  styleUrls: ['./navbar-admin.component.css']
})
export class NavbarAdminComponent {
  @Input() adminName: string = 'Admin';

  private auth = inject(Auth);
  private router = inject(Router);

  usuarioLabel = signal<string>('Personal');

  async ngOnInit() {
    const user = await this.auth.getCurrentUser();
    if (user) {
      const rol = await this.auth.getUserRole(user.id);
      if (rol === 'admin') {
        this.usuarioLabel.set('Administrador');
      } else if (rol === 'operador') {
        this.usuarioLabel.set('Operador');
      } else {
        this.usuarioLabel.set(user.email?.split('@')[0] || 'Usuario');
      }
    }
  }

  async logout() {
    try {
      await this.auth.signOut();
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Error al cerrar sesión', err);
    }
  }
}
