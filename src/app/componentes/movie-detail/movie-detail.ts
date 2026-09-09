import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MoviesService } from '../../services/movies.service';
import { MovieDetailModel } from '../../models/movie';

interface Review {
  autor: string;
  puntuacion: number;
  comentario: string;
  fecha: string;
}

@Component({
  standalone: true,
  selector: 'app-movie-detail',
  templateUrl: './movie-detail.html',
  styleUrls: ['./movie-detail.css'],
  imports: [CommonModule, RouterLink]
})
export class MovieDetail implements OnInit {
  movie = signal<MovieDetailModel | null>(null);

  showReviews = signal<boolean>(false);

  // Lista mock de reseñas por película
  reviews = signal<Review[]>([
    { autor: 'Carlos M.', puntuacion: 5, comentario: '¡Excelente producción y efectos visuales!', fecha: '02/09/2026' },
    { autor: 'Lucía G.', puntuacion: 4, comentario: 'Muy entretenida de principio a fin.', fecha: '05/09/2026' }
  ]);

  newReview = { autor: '', puntuacion: 5, comentario: '' };
  constructor(
    private route: ActivatedRoute,
    private moviesService: MoviesService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const rawId = params.get('id');
      const id = Number(rawId);

      if (!id || isNaN(id)) {
        console.error('El parámetro ID no es válido:', rawId);
        return;
      }

      this.moviesService.getMovieById(id).subscribe({
        next: (data) => {
          if (data) {
            this.movie.set(data);
          } else {
            console.error('Película no encontrada para el ID:', id);
          }
        },
        error: (err) => {
          console.error('Error cargando película:', err);
        }
      });
    });
  }

  toggleReviews() {
    this.showReviews.update(val => !val);
  }

  addReview() {
    if (!this.newReview.autor || !this.newReview.comentario) return;
    this.reviews.update(prev => [
      {
        ...this.newReview,
        fecha: new Date().toLocaleDateString('es-AR')
      },
      ...prev
    ]);
    this.newReview = { autor: '', puntuacion: 5, comentario: '' };
  }

  openTrailer(url: string | undefined) {
    if (url) window.open(url, '_blank');
  }
}