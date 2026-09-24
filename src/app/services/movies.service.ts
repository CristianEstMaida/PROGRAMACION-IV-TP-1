import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Movie, MovieDetailModel, UpcomingMovie } from '../models/movie';
import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';  
import { SupabaseService } from './supabase.service';

// export interface PeliculaBD {
//   id: number;
//   titulo: string;
//   sinopsis?: string;
//   duracion_minutos: number;
//   imagen_url?: string;
//   formato: string;
//   idioma: string;
//   restriccion_edad: string;
// }

export interface PeliculaDB {
  id: number;
  titulo: string;
  duracion_minutos: number;
  formato: string;
  restriccion_edad: string;
  idioma: string;
  sinopsis?: string;
  imagen_url?: string;
}

@Injectable({ providedIn: 'root' })
export class MoviesService {

  private supabase = inject(SupabaseService).client;
  peliculas = signal<PeliculaDB[]>([]);

  constructor(private http: HttpClient) {}

  async obtenerPeliculas(): Promise<PeliculaDB[]> {
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

  // 1. Películas en Cartelera (estrenadas hoy o antes)
  async getCartelera() {
    const hoy = new Date().toISOString().split('T')[0];
    const { data, error } = await this.supabase
      .from('peliculas')
      .select('*')
      .lte('fecha_estreno', hoy)
      .order('id', { ascending: true });
    return error ? [] : data;
  }

  // 2. Próximos Estrenos (fecha_estreno en el futuro)
  async getProximamente() {
    const hoy = new Date().toISOString().split('T')[0];
    const { data, error } = await this.supabase
      .from('peliculas')
      .select('*')
      .gt('fecha_estreno', hoy)
      .order('fecha_estreno', { ascending: true });
    return error ? [] : data;
  }

  // 3. Top 3 Más Vendidas
  async getTopPeliculas() {
    const { data, error } = await this.supabase
      .from('top_peliculas_mas_vistas')
      .select('*');
    return error ? [] : data;
  }

async activarAlerta(peliculaId: number, usuarioId: string) {
  const { data, error } = await this.supabase
    .from('alertas')
    .upsert(
      { pelicula_id: peliculaId, usuario_id: usuarioId },
      { onConflict: 'usuario_id,pelicula_id' }
    )
    .select();

  if (error) {
    console.error('Error al guardar alerta en Supabase:', error);
    return { error };
  }

  return { data, error: null };
}

  async getMovieById(id: number): Promise<PeliculaDB | null> {
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

  async getPeliculasAdmin() {
  const { data, error } = await this.supabase
    .from('peliculas')
    .select(`
      *,
      pelicula_genero (
        generos ( id, nombre )
      )
    `)
    .order('id', { ascending: false });

  if (error) {
    console.error('Error al traer películas para admin:', error.message);
    return [];
  }
  return data || [];
}

// 2. POST: Insertar película
  async agregarPelicula(nueva: Omit<PeliculaDB, 'id'>): Promise<PeliculaDB | null> {
    const { data, error } = await this.supabase
      .from('peliculas')
      .insert(nueva)
      .select()
      .single();

    if (error) {
      console.error('Error al insertar película:', error.message);
      return null;
    }
    return data;
  }

  // 3. DELETE: Eliminar película
  async eliminarPelicula(id: number): Promise<boolean> {
    const { error } = await this.supabase
      .from('peliculas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar película:', error.message);
      return false;
    }
    return true;
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
