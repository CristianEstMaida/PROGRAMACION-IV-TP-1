import { Component, OnDestroy, OnInit, signal } from '@angular/core';
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
export class Home implements OnInit, OnDestroy {
  movies = signal<MovieDetailModel[]>([]);

  topMovies: Movie[] = [
    { id: 1, title: 'Película A', rating: '★★★★☆', poster: '/assets/img/butacas-cine.jpg' },
    { id: 2, title: 'Película B', rating: '★★★☆☆', poster: '/assets/img/butacas-cine2.jpg' },
    { id: 3, title: 'The Dark Knight', rating: '★★★★★', poster: '/assets/img/butacas-cine2.jpg' },
    { id: 4, title: 'Avengers: Endgame', rating: '★★★★☆', poster: '/assets/img/butacas-cine2.jpg' },
    { id: 5, title: 'Spider-Man: No Way Home', rating: '★★★★☆', poster: '/assets/img/butacas-cine2.jpg' },
    { id: 6, title: 'The Matrix', rating: '★★★★★', poster: '/assets/img/butacas-cine2.jpg' }
  ];

  upcomingMovies: UpcomingMovie[] = [
    { id: 7, title: 'Avatar 3', date: '20/12/2026', poster: '/assets/img/butacas-cine2.jpg' },
    { id: 8, title: 'Frozen 3', date: '10/11/2026', poster: '/assets/img/butacas-cine2.jpg' },
    { id: 9, title: 'Jurassic World: Dominion 2', date: '05/10/2026', poster: '/assets/img/butacas-cine2.jpg' },
    { id: 10, title: 'Toy Story 5', date: '15/09/2026', poster: '/assets/img/butacas-cine2.jpg' }
  ];

  isLoggedIn = true;

  recommendedMovies: Movie[] = [
    { id: 11, title: 'Coco', rating: '★★★★★', poster: '/assets/img/butacas-cine2.jpg' },
    { id: 12, title: 'Inside Out', rating: '★★★★★', poster: '/assets/img/butacas-cine2.jpg' },
    { id: 13, title: 'Shrek', rating: '★★★★☆', poster: '/assets/img/butacas-cine2.jpg' },
    { id: 14, title: 'Black Panther', rating: '★★★★☆', poster: '/assets/img/butacas-cine2.jpg' },
    { id: 15, title: 'Guardians of the Galaxy', rating: '★★★★☆', poster: '/assets/img/butacas-cine2.jpg' }
  ];

  currentOffset = signal(0);
  cardWidth = 340; 
  // cardWidth = Math.floor(window.innerWidth / 4); 

  // ancho tarjeta + gap
  autoplayInterval: any;
  isPaused = false;

  prevSlide() {
    this.currentOffset.update(v => Math.max(v - this.cardWidth, 0));
  }

  nextSlide() {
    const maxOffset = (this.movies().length - 3) * this.cardWidth;
    this.currentOffset.update(v => {
      if (v >= maxOffset) return 0; // vuelve al inicio
      return v + this.cardWidth;
    });
  }

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

     // autoplay cada 5 segundos
    // this.autoplayInterval = setInterval(() => {
    //   this.nextSlide();
    // }, 5000)

    this.startAutoplay();
  }

   startAutoplay() {
    this.autoplayInterval = setInterval(() => {
      if (!this.isPaused) this.nextSlide();
    }, 5000);
  }

   ngOnDestroy() {
    this.stopAutoplay();
  }

  stopAutoplay() {
    clearInterval(this.autoplayInterval);
  }

  pauseAutoplay() {
    this.isPaused = true;
  }

  resumeAutoplay() {
    this.isPaused = false;
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