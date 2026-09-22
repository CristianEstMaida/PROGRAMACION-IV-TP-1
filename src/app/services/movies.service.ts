import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Movie, MovieDetailModel, UpcomingMovie } from '../models/movie';
import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';  
import { SupabaseService } from './supabase.service';

export interface PeliculaBD {
  id: number;
  titulo: string;
  sinopsis?: string;
  duracion_minutos: number;
  imagen_url?: string;
  formato: string;
  idioma: string;
  restriccion_edad: string;
}

@Injectable({ providedIn: 'root' })
export class MoviesService {

  private supabase = inject(SupabaseService).client;
  peliculas = signal<PeliculaBD[]>([]);

  constructor(private http: HttpClient) {}

  async obtenerPeliculas(): Promise<PeliculaBD[]> {
    const { data, error } = await this.supabase
      .from('peliculas')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data) {
      this.peliculas.set(data);
      return data;
    }
    return [];
  }

    // Devuelve un Observable, no void
  // getMovieById(id: number): Observable<MovieDetailModel | undefined> {
  //   return this.http.get<MovieDetailModel[]>('assets/movies.json').pipe(
  //     map(movies => movies.find(m => m.id === id))
  //   );
  // }

  async getMovieById(id: number): Promise<PeliculaBD | null> {
    const { data, error } = await this.supabase
      .from('peliculas')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data;
  }
  
  getAllMovies(): Observable<MovieDetailModel[]> {
    return this.http.get<MovieDetailModel[]>('assets/movies.json');
  }



//   getTopMovies() {
//     return this.http.get<Movie[]>('/api/top-movies'); // tu endpoint
//   }

//   getUpcomingMovies() {
//     return this.http.get<UpcomingMovie[]>('/api/upcoming-movies');
//   }


//   getRecommendations(userId: string) {
//     return this.http.get<Movie[]>(`/api/recommendations/${userId}`);
//   }
}
