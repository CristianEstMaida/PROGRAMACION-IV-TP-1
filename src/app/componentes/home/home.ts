import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MoviesService } from '../../services/movies.service';
import { Auth } from '../../services/auth';
import { ImageFallbackDirective } from '../../directivas/appImageFallback.directive';
import { HasRoleDirective } from '../../directivas/appHasRole.directive';

export interface PeliculaCard {
  id: number;
  titulo: string;
  duracion_minutos: number;
  formato: string;
  formatos?: string[];
  generos?: string[];
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
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule, ImageFallbackDirective, HasRoleDirective]
})
export class Home implements OnInit {
  private moviesService = inject(MoviesService);
  private auth = inject(Auth);
  private router = inject(Router);

  // Estados de sesión
  currentUser = signal<any | null>(null);
  userRole = signal<string | null>(null);

  isLoggedIn = false;

  // Estados de datos
  cartelera = signal<PeliculaCard[]>([]);
  topPeliculas = signal<PeliculaCard[]>([]);
  proximosEstrenos = signal<PeliculaCard[]>([]);

  // Filtros reactivos
  busqueda = signal<string>('');
  filtroFormato = signal<string>('Todas');

  // 2. En la clase Home:
  filtroGenero = signal<string>('Todos');

  // Lista reactiva de géneros únicos disponibles en la cartelera actual
  generosDisponibles = computed(() => {
    const lista = this.cartelera().flatMap(p => p.generos || []);
    const unicos = Array.from(new Set(lista)).filter(Boolean);
    return ['Todos', ...unicos];
  });

  // 3. Modificar carteleraFiltrada para evaluar texto, formato y género
  carteleraFiltrada = computed(() => {
    const query = this.busqueda().toLowerCase().trim();
    const formato = this.filtroFormato();
    const genero = this.filtroGenero();

    return this.cartelera().filter(p => {
      const coincideTitulo = p.titulo.toLowerCase().includes(query);
      const coincideFormato = formato === 'Todas' || (p.formatos || []).includes(formato);
      const coincideGenero = genero === 'Todos' || (p.generos || []).includes(genero);

      return coincideTitulo && coincideFormato && coincideGenero;
    });
  });

  async ngOnInit() {
    await this.comprobarSesion();

    await Promise.all([
      this.cargarCartelera(),
      this.cargarTop(),
      this.cargarProximamente()
    ]);
  }

  async comprobarSesion() {
    const user = await this.auth.getCurrentUser();
    
    this.currentUser.set(user);

    if (user) {
      const role = await this.auth.getUserRole(user.id);
      this.userRole.set(role);
    } else {
      this.userRole.set(null);
    }
  }
   

  async cargarCartelera() {
    const data = await this.moviesService.getCartelera();
    this.cartelera.set((data || []).map((p: any) => {
      // 1. Extraer los formatos y forzar tipado string
      const listaFormatos: string[] = Array.isArray(p.funciones) 
        ? p.funciones.map((f: any) => String(f.tipo_funcion || '')).filter(Boolean)
        : (p.funciones?.tipo_funcion ? [String(p.funciones.tipo_funcion)] : []);
      
      const tipos: string[] = Array.from(new Set(listaFormatos));

      // 2. String para fallback y combinación
      const formatoFinal = tipos.length > 0 ? tipos.join(' / ') : '2D';

      // Extraer nombres de géneros asociados
      const listaGeneros: string[] = (p.pelicula_genero || [])
        .map((pg: any) => pg.generos?.nombre)
        .filter(Boolean);

      return {
        id: p.id,
        titulo: p.titulo,
        duracion_minutos: p.duracion_minutos,
        formato: formatoFinal,
        formatos: tipos, // Ahora TypeScript sabe que es estrictamente string[]
        generos: listaGeneros,
        restriccion_edad: p.restriccion_edad || 'ATP',
        poster: p.imagen_url || '/assets/img/butacas-cine.jpg',
        precio: 4500,
        promedio_estrellas: 4.8
      };
    }));   
  }
  setFiltroGenero(genero: string) {
    this.filtroGenero.set(genero);
  }

 async cargarTop() {
    const data = await this.moviesService.getTopPeliculas();
    const ahora = new Date().toISOString();

    this.topPeliculas.set((data || []).map((p: any) => {
      // 1. Filtrar funciones vigentes y forzar tipado string
      const funcionesValidas = (p.funciones || []).filter(
        (f: any) => f.estado === 'activa' && f.fecha_hora >= ahora
      );

      const tipos: string[] = Array.from(
        new Set(funcionesValidas.map((f: any) => String(f.tipo_funcion || '')).filter(Boolean))
      );

      const formatoFinal = tipos.length > 0 ? tipos.join(' / ') : '2D';

      return {
        id: p.id,
        titulo: p.titulo,
        duracion_minutos: p.duracion_minutos,
        formato: formatoFinal,
        formatos: tipos, // Estrictamente string[]
        restriccion_edad: p.restriccion_edad || 'ATP',
        poster: p.imagen_url || '/assets/img/butacas-cine.jpg',
        precio: 4500,
        total_ventas: p.total_ventas || 0,
        promedio_estrellas: 5.0
      };
    }));
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
    this.currentUser.set(null);
    this.userRole.set(null);
    this.router.navigate(['/login']);
  }
}