import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './sidebar-admin.component.html',
  styleUrls: ['./sidebar-admin.component.css']
})
export class SidebarAdminComponent {
  menuItems = [
    { label: 'Películas', icon: 'movie', route: '/admin/peliculas' },
    { label: 'Funciones', icon: 'event', route: '/admin/funciones' },
    { label: 'Salas', icon: 'theaters', route: '/admin/salas' },
    { label: 'Usuarios', icon: 'person', route: '/admin/usuarios' },
    { label: 'Candy Bar', icon: 'local_cafe', route: '/admin/candy-bar' },
    { label: 'Cupones', icon: 'confirmation_number', route: '/admin/cupones' },
    { label: 'Fidelización', icon: 'stars', route: '/admin/fidelizacion' },
    { label: 'Reportes', icon: 'bar_chart', route: '/admin/reportes' },
    { label: 'Log de Actividad', icon: 'history', route: '/admin/log' },
    { label: 'Validar Entradas', icon: 'qr_code_scanner', route: '/admin/validar-qr' },
  ];
}
