import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MoviesService } from '../../services/movies.service';
import { MovieDetailModel } from '../../models/movie';
import { SupabaseService } from '../../services/supabase.service';
import { Auth } from '../../services/auth';

export interface ReviewBD {
  id: number;
  autor_nombre: string;
  puntuacion: number;
  comentario: string;
  creado_en: string;
}

@Component({
  standalone: true,
  selector: 'app-movie-detail',
  templateUrl: './movie-detail.html',
  styleUrls: ['./movie-detail.css'],
  imports: [CommonModule, RouterLink, FormsModule]
})
export class MovieDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private moviesService = inject(MoviesService);
  private supabase = inject(SupabaseService).client;
  private auth = inject(Auth);

  movie = signal<MovieDetailModel | null>(null);
  reviews = signal<ReviewBD[]>([]);
  showReviews = signal<boolean>(true);

  // Formulario nueva reseña
  nuevaPuntuacion = signal<number>(5);
  nuevoComentario = signal<string>('');
  enviandoResena = signal<boolean>(false);

  // Promedio reactivo de puntuación
  promedioEstrellas = computed(() => {
    const list = this.reviews();
    if (list.length === 0) return 0;
    const suma = list.reduce((acc, r) => acc + r.puntuacion, 0);
    return Number((suma / list.length).toFixed(1));
  });

  async ngOnInit() {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = Number(rawId);
    if (!id) return;

    const data = await this.moviesService.getMovieById(id);
    if (data) {
      this.movie.set({
        id: data.id,
        title: data.titulo,
        rating: data.restriccion_edad,
        poster: data.imagen_url || '/assets/img/butacas-cine.jpg',
        genre: data.formato || 'General',
        duration: data.duracion_minutos,
        synopsis: data.sinopsis || '',
        trailerUrl: ''
      });

      await this.cargarResenas(id);
    }
  }

  async cargarResenas(peliculaId: number) {
    const { data } = await this.supabase
      .from('resenas')
      .select('*')
      .eq('pelicula_id', peliculaId)
      .order('creado_en', { ascending: false });

    if (data) {
      this.reviews.set(data);
    }
  }

  toggleReviews() {
    this.showReviews.update(val => !val);
  }

  async publicarResena() {
    const comentario = this.nuevoComentario().trim();
    const pelicula = this.movie();
    if (!comentario || !pelicula) return;

    const user = await this.auth.getCurrentUser();
    if (!user) {
      alert('Debes iniciar sesión para calificar y dejar una reseña.');
      this.router.navigate(['/login']);
      return;
    }

    this.enviandoResena.set(true);

    // Obtener nombre del perfil
    const { data: perfil } = await this.supabase
      .from('perfiles')
      .select('nombre, apellido')
      .eq('id', user.id)
      .single();

    const nombreAutor = perfil?.nombre ? `${perfil.nombre} ${perfil.apellido || ''}`.trim() : (user.email?.split('@')[0] || 'Usuario');

    const { error } = await this.supabase.from('resenas').insert({
      pelicula_id: pelicula.id,
      usuario_id: user.id,
      autor_nombre: nombreAutor,
      puntuacion: this.nuevaPuntuacion(),
      comentario: comentario
    });

    if (!error) {
      this.nuevoComentario.set('');
      this.nuevaPuntuacion.set(5);
      await this.cargarResenas(pelicula.id);
    } else {
      alert('Error al publicar la reseña: ' + error.message);
    }

    this.enviandoResena.set(false);
  }

  openTrailer(url: string | undefined) {
    if (url) window.open(url, '_blank');
  }
  anyVal(event: Event): any {
    return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
  }
}

