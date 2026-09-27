import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ChartAdminComponent } from '../char-admin/char-admin.component';
import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { SupabaseService } from '../../services/supabase.service';

interface MetricCard {
  icon: string;
  title: string;
  value: string;
  color: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    RouterOutlet, 
    MatIconModule, 
    ChartAdminComponent,
    NavbarAdminComponent,
    SidebarAdminComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  private supabase = inject(SupabaseService).client;

  cargando = signal<boolean>(true);

  // Métricas superiores
  metrics = signal<MetricCard[]>([]);

  // Accesos directos
  quickActions = [
    { label: 'Cargar Película', route: '/admin/peliculas', icon: 'movie', color: '#1f2937' },
    { label: 'Gestionar Candy', route: '/admin/candy-bar', icon: 'fastfood', color: '#1f2937' },
    { label: 'Escanear QR', route: '/admin/validar-qr', icon: 'qr_code_scanner', color: '#dc2626' }
  ];

//   quickActions = [
//   { 
//     label: 'Gestionar Películas', 
//     icon: 'movie', 
//     route: '/admin/peliculas', 
//     color: 'linear-gradient(180deg, #e53935 0%, #a81916 100%)' 
//   },
//   { 
//     label: 'Gestionar Funciones', 
//     icon: 'event', 
//     route: '/admin/funciones', 
//     color: 'linear-gradient(180deg, #1e88e5 0%, #155fa0 100%)' 
//   },
//   { 
//     label: 'Producto Candy Bar', 
//     icon: 'local_drink', 
//     route: '/admin/candy-bar', 
//     color: 'linear-gradient(180deg, #43a047 0%, #2e7031 100%)' 
//   },
//   { 
//     label: 'Ver Reportes', 
//     icon: 'bar_chart', 
//     route: '/admin/reportes', 
//     color: 'linear-gradient(180deg, #8e24aa 0%, #5e1871 100%)' 
//   }
// ];

  // Gráficos
  peliculasLabels = signal<string[]>([]);
  peliculasData = signal<number[]>([]);

  candyLabels = signal<string[]>([]);
  candyData = signal<number[]>([]);

  facturacionLabels = signal<string[]>([]);
  facturacionData = signal<number[]>([]);

  async ngOnInit() {
    await this.cargarDashboard();
  }

  async cargarDashboard() {
    this.cargando.set(true);
    await Promise.all([
      this.cargarMetricas(),
      this.cargarGraficoPeliculas(),
      this.cargarGraficoCandy(),
      this.cargarGraficoFacturacion()
    ]);
    this.cargando.set(false);
  }

  private async cargarMetricas() {
    // 1. Total entradas no canceladas
    const { count: totalEntradas } = await this.supabase
      .from('entradas')
      .select('*', { count: 'exact', head: true })
      .neq('estado', 'cancelada');

    // 2. Facturación Candy
    const { data: candyCompras } = await this.supabase
      .from('compras_candy')
      .select('total');
    const totalCandy = (candyCompras || []).reduce((acc, c) => acc + Number(c.total || 0), 0);

    // 3. Usuarios registrados
    const { count: totalUsuarios } = await this.supabase
      .from('perfiles')
      .select('*', { count: 'exact', head: true });

    this.metrics.set([
      { icon: 'confirmation_number', title: 'Entradas Vendidas', value: `${totalEntradas || 0}`, color: '#1e3a8a' },
      { icon: 'storefront', title: 'Recaudación Candy', value: `$${totalCandy.toLocaleString('es-AR')}`, color: '#14532d' },
      { icon: 'group', title: 'Clientes Registrados', value: `${totalUsuarios || 0}`, color: '#581c87' }
    ]);
  }

  private async cargarGraficoPeliculas() {
    const { data } = await this.supabase
      .from('entradas')
      .select(`id, estado, funciones ( peliculas ( titulo ) )`)
      .neq('estado', 'cancelada');

    const counts: Record<string, number> = {};
    (data || []).forEach((e: any) => {
      const titulo = e.funciones?.peliculas?.titulo || 'Función';
      counts[titulo] = (counts[titulo] || 0) + 1;
    });

    this.peliculasLabels.set(Object.keys(counts));
    this.peliculasData.set(Object.values(counts));
  }

  private async cargarGraficoCandy() {
    const { data } = await this.supabase
      .from('compra_producto')
      .select(`cantidad, productos ( nombre )`);

    const counts: Record<string, number> = {};
    (data || []).forEach((cp: any) => {
      const nombre = cp.productos?.nombre || 'Producto';
      counts[nombre] = (counts[nombre] || 0) + (cp.cantidad || 0);
    });

    this.candyLabels.set(Object.keys(counts));
    this.candyData.set(Object.values(counts));
  }

  private async cargarGraficoFacturacion() {
    const { data } = await this.supabase
      .from('compras_candy')
      .select('fecha, total')
      .order('fecha', { ascending: true });

    const agrupado: Record<string, number> = {};
    (data || []).forEach((c: any) => {
      const dia = new Date(c.fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit'
      });
      agrupado[dia] = (agrupado[dia] || 0) + Number(c.total || 0);
    });

    this.facturacionLabels.set(Object.keys(agrupado));
    this.facturacionData.set(Object.values(agrupado));
  }
}