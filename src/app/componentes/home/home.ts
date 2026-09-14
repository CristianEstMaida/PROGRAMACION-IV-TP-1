import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MoviesService } from '../../services/movies.service';
import { Movie, MovieDetailModel, UpcomingMovie } from '../../models/movie';
import { Auth } from '../../services/auth';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  imports: [CommonModule, RouterLink]
})
export class Home implements OnInit {
  movies = signal<MovieDetailModel[]>([]);

  topMovies: Movie[] = [
    { id: 1, title: 'Película A', rating: '★★★★☆', poster: '/assets/img/butacas-cine.jpg' },
    { id: 2, title: 'Película B', rating: '★★★☆☆', poster: '/assets/img/butacas-cine2.jpg' }
  ];

  upcomingMovies: UpcomingMovie[] = [
    { id: 4, title: 'Película C', date: '15/09/2026', poster: '/assets/img/butacas-cine.jpg' }
  ];

  isLoggedIn = true;

  recommendedMovies: Movie[] = [
    { id: 5, title: 'Película Recomendada A', rating: '★★★★☆', poster: '/assets/img/butacas-cine.jpg' },
    { id: 6, title: 'Película Recomendada B', rating: '★★★☆☆', poster: '/assets/img/butacas-cine2.jpg' }
  ];


  constructor(private moviesService: MoviesService,
    private auth: Auth, private router: Router
  ) {}

  ngOnInit() {
    this.moviesService.getAllMovies().subscribe({
      next: (data: MovieDetailModel[]) => {
        this.movies.set(data);
      },
      error: (err: any) => {
        console.error('Error cargando películas', err);
      }
    });
  }

  openTrailer(url: string) {
    window.open(url, '_blank');
  }

async logout() {
     try {
      await this.auth.signOut(); // cerrar sesión en Supabase
      this.router.navigate(['/login']); // redirigir al login
    } catch (err) {
      console.error('Error al cerrar sesión', err);
    }
  }
}