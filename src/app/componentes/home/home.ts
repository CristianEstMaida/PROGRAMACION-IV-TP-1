import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MoviesService } from '../../services/movies.service';
import { Auth } from '../../services/auth';
import { ImageFallbackDirective } from '../../directivas/appImageFallback.directive';

export interface PeliculaCard {
  id: number;
  titulo: string;
  duracion_minutos: number;
  formato: string;
  restriccion_edad: string;
  poster: string;
  precio: number;
  promedio_estrellas?: number;
  total_ventas?: number;
  fecha_estreno?: string;
}

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule, ImageFallbackDirective]
})
export class Home implements OnInit {
  private moviesService = inject(MoviesService);
  private auth = inject(Auth);
  private router = inject(Router);

  isLoggedIn = false;

  // Estados de datos
  cartelera = signal<PeliculaCard[]>([]);
  topPeliculas = signal<PeliculaCard[]>([]);
  proximosEstrenos = signal<PeliculaCard[]>([]);

  // Filtros reactivos
  busqueda = signal<string>('');
  filtroFormato = signal<string>('Todas');

  // Grilla reactiva con buscador y filtro
  carteleraFiltrada = computed(() => {
    const query = this.busqueda().toLowerCase().trim();
    const formato = this.filtroFormato();

    return this.cartelera().filter(p => {
      const coincideTitulo = p.titulo.toLowerCase().includes(query);
      const coincideFormato = formato === 'Todas' || p.formato.includes(formato);
      return coincideTitulo && coincideFormato;
    });
  });

  async ngOnInit() {
    const user = await this.auth.getCurrentUser();
    this.isLoggedIn = !!user;

    await Promise.all([
      this.cargarCartelera(),
      this.cargarTop(),
      this.cargarProximamente()
    ]);
  }

  async cargarCartelera() {
    const data = await this.moviesService.getCartelera();
    this.cartelera.set((data || []).map(p => ({
      id: p.id,
      titulo: p.titulo,
      duracion_minutos: p.duracion_minutos,
      formato: p.formato || '2D',
      restriccion_edad: p.restriccion_edad || 'ATP',
      poster: p.imagen_url || '/assets/img/butacas-cine.jpg',
      precio: 4500,
      promedio_estrellas: 4.8
    })));
  }

  async cargarTop() {
    const data = await this.moviesService.getTopPeliculas();
    this.topPeliculas.set((data || []).slice(0, 3).map(p => ({
      id: p.id,
      titulo: p.titulo,
      duracion_minutos: p.duracion_minutos,
      formato: p.formato || '2D',
      restriccion_edad: p.restriccion_edad || 'ATP',
      poster: p.imagen_url || '/assets/img/butacas-cine.jpg',
      precio: 4500,
      total_ventas: p.total_ventas || 0,
      promedio_estrellas: 5.0
    })));
  }

  async cargarProximamente() {
    const data = await this.moviesService.getProximamente();
    this.proximosEstrenos.set((data || []).map(p => ({
      id: p.id,
      titulo: p.titulo,
      duracion_minutos: p.duracion_minutos,
      formato: p.formato || 'Estreno',
      restriccion_edad: p.restriccion_edad || 'ATP',
      poster: p.imagen_url || '/assets/img/butacas-cine.jpg',
      precio: 4000,
      fecha_estreno: p.fecha_estreno
    })));
  }

  setFiltro(formato: string) {
    this.filtroFormato.set(formato);
  }

  scrollToCartelera() {
    document.getElementById('cartelera')?.scrollIntoView({ behavior: 'smooth' });
  }

  async suscribirAlerta(peliculaId: number) {
    const user = await this.auth.getCurrentUser();
    
    if (!user) {
      alert('Debes iniciar sesión para activar recordatorios de preventa.');
      this.router.navigate(['/login']);
      return;
    }

    const res = await this.moviesService.activarAlerta(peliculaId, user.id);

    if (!res.error) {
      alert('🔔 ¡Recordatorio activado! Te avisaremos cuando se abran las entradas.');
    } else {
      alert('No se pudo guardar la alerta: ' + (res.error.message || 'Error de conexión'));
    }
  }
  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}