import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth';

export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './sidebar-admin.component.html',
  styleUrls: ['./sidebar-admin.component.css']
})
export class SidebarAdminComponent implements OnInit{
  private auth = inject(Auth);

  todosLosItems: MenuItem[] = [
    { label: 'Validar Entradas', icon: 'qr_code_scanner', route: '/admin/validar-qr', roles: ['admin', 'operador'] },
    { label: 'Funciones', icon: 'calendar_today', route: '/admin/funciones', roles: ['admin', 'operador'] },
    { label: 'Candy Bar', icon: 'local_cafe', route: '/admin/candy-bar', roles: ['admin', 'operador'] },
    { label: 'Películas', icon: 'movie', route: '/admin/peliculas', roles: ['admin'] },
    { label: 'Salas', icon: 'theaters', route: '/admin/salas', roles: ['admin'] },
    { label: 'Usuarios', icon: 'person', route: '/admin/usuarios', roles: ['admin'] },
    { label: 'Cupones', icon: 'confirmation_number', route: '/admin/cupones', roles: ['admin'] },
    { label: 'Fidelización', icon: 'stars', route: '/admin/fidelizacion', roles: ['admin'] },
    { label: 'Reportes', icon: 'bar_chart', route: '/admin/reportes', roles: ['admin'] },
    { label: 'Log de Actividad', icon: 'history', route: '/admin/log', roles: ['admin'] },
  ];

  menuItems = signal<MenuItem[]>([]);

  async ngOnInit() {
    const user = await this.auth.getCurrentUser();
    if (user) {
      const rol = await this.auth.getUserRole(user.id);
      // Filtra dejando solo los elementos permitidos para el rol
      this.menuItems.set(
        this.todosLosItems.filter(item => item.roles.includes(rol || 'operador'))
      );
    }
  }
}
