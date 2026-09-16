import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarAdminComponent } from '../../navbar-admin/navbar-admin.component';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ChartAdminComponent } from '../char-admin/char-admin.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  imports: [
    CommonModule,
    RouterModule,
    NavbarAdminComponent,
    SidebarAdminComponent,
    ChartAdminComponent,
    MatIconModule
  ],
  selector: 'app-admin-dashboard',
  styleUrl: './admin-dashboard.css',
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard {
 metrics = [
  { 
    title: 'Entradas vendidas hoy', 
    value: 320, 
    icon: 'confirmation_number', 
    color: 'linear-gradient(180deg, #ff9800 0%, #d86900 100%)' 
  },
  { 
    title: 'Facturación hoy', 
    value: '$250,000', 
    icon: 'attach_money', 
    color: 'linear-gradient(180deg, #1e88e5 0%, #155fa0 100%)' 
  },
  { 
    title: 'Producto más vendido', 
    value: 'Pochoclos Grandes', 
    icon: 'local_cafe', 
    color: 'linear-gradient(180deg, #43a047 0%, #2e7031 100%)' 
  },
  { 
    title: 'Película más vista', 
    value: 'Avatar 2', 
    icon: 'movie', 
    color: 'linear-gradient(180deg, #8e24aa 0%, #5e1871 100%)' 
  }
];

quickActions = [
  { 
    label: 'Gestionar Películas', 
    icon: 'movie', 
    route: '/admin/peliculas', 
    color: 'linear-gradient(180deg, #e53935 0%, #a81916 100%)' 
  },
  { 
    label: 'Gestionar Funciones', 
    icon: 'event', 
    route: '/admin/funciones', 
    color: 'linear-gradient(180deg, #1e88e5 0%, #155fa0 100%)' 
  },
  { 
    label: 'Producto Candy Bar', 
    icon: 'local_drink', 
    route: '/admin/candy-bar', 
    color: 'linear-gradient(180deg, #43a047 0%, #2e7031 100%)' 
  },
  { 
    label: 'Ver Reportes', 
    icon: 'bar_chart', 
    route: '/admin/reportes', 
    color: 'linear-gradient(180deg, #8e24aa 0%, #5e1871 100%)' 
  }
];

}
