import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Movie, MovieDetailModel, UpcomingMovie } from '../models/movie';
import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';  
import { SupabaseService } from './supabase.service';

export interface PeliculaDB {
  id: number;
  titulo: string;
  duracion_minutos: number;
  formato: string;
  restriccion_edad: string;
  idioma: string;
  sinopsis?: string;
  imagen_url?: string;
  activa?: boolean; 
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
  const ahora = new Date().toISOString();

  // Trae solo películas que tengan funciones activas de hoy en adelante
  const { data, error } = await this.supabase
      .from('peliculas')
      .select(`
        *,
        pelicula_genero (
          generos ( nombre )
        ),
        funciones!inner (
          id,
          fecha_hora,
          estado,
          tipo_funcion
        )
      `)
      .gte('funciones.fecha_hora', ahora)
      .eq('funciones.estado', 'activa')
      .eq('activa', true)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error al obtener cartelera:', error);
      return [];
    }

    // Eliminar duplicados si una película tiene más de una función programada
    const unicas = Array.from(
      new Map((data || []).map(p => [p.id, p])).values()
    );

    return unicas;
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
    const ahora = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('top_peliculas_mas_vistas')
      .select(`
        *,
        funciones (
          id,
          tipo_funcion,
          fecha_hora,
          estado
        )
      `)
      .limit(3);

    if (error) {
      console.error('Error al obtener top películas:', error.message);
      return [];
    }

    return data || [];
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


// Traer el catálogo de géneros para el formulario
async getGeneros(): Promise<{ id: number; nombre: string }[]> {
  const { data, error } = await this.supabase
    .from('generos')
    .select('id, nombre')
    .order('nombre', { ascending: true });
  if (error) return [];
  return data || [];
}

// Crear película e insertar sus géneros en pelicula_genero
async agregarPeliculaConGeneros(
  nueva: Omit<PeliculaDB, 'id'>, 
  generosIds: number[]
): Promise<boolean> {
  const { data: peliCreada, error: errPeli } = await this.supabase
    .from('peliculas')
    .insert(nueva)
    .select()
    .single();

  if (errPeli || !peliCreada) {
    console.error('Error al insertar película:', errPeli?.message);
    return false;
  }

  if (generosIds.length > 0) {
    const filasPivote = generosIds.map(gId => ({
      pelicula_id: peliCreada.id,
      genero_id: gId
    }));

    const { error: errGen } = await this.supabase
      .from('pelicula_genero')
      .insert(filasPivote);

    if (errGen) {
      console.error('Error al asociar géneros:', errGen.message);
    }
  }

  return true;
}

// Actualizar película y sincronizar sus géneros en pelicula_genero
async actualizarPeliculaConGeneros(
  id: number,
  datos: Partial<PeliculaDB>,
  generosIds: number[]
): Promise<boolean> {
  // 1. Actualizar datos base en la tabla peliculas
  const { error: errPeli } = await this.supabase
    .from('peliculas')
    .update(datos)
    .eq('id', id);

  if (errPeli) {
    console.error('Error al actualizar película:', errPeli.message);
    return false;
  }

  // 2. Limpiar géneros anteriores de esta película
  const { error: errDeleteGen } = await this.supabase
    .from('pelicula_genero')
    .delete()
    .eq('pelicula_id', id);

  if (errDeleteGen) {
    console.error('Error al limpiar géneros previos:', errDeleteGen.message);
  }

  // 3. Insertar las nuevas asociaciones de géneros
  if (generosIds.length > 0) {
    const filasPivote = generosIds.map(gId => ({
      pelicula_id: id,
      genero_id: gId
    }));

    const { error: errInsertGen } = await this.supabase
      .from('pelicula_genero')
      .insert(filasPivote);

    if (errInsertGen) {
      console.error('Error al actualizar géneros asociados:', errInsertGen.message);
    }
  }

  return true;
}

// 2. POST: Insertar película
  // async agregarPelicula(nueva: Omit<PeliculaDB, 'id'>): Promise<PeliculaDB | null> {
  //   const { data, error } = await this.supabase
  //     .from('peliculas')
  //     .insert(nueva)
  //     .select()
  //     .single();

  //   if (error) {
  //     console.error('Error al insertar película:', error.message);
  //     return null;
  //   }
  //   return data;
  // }

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
// Alternar estado activa / inactiva
  async toggleEstadoPelicula(id: number, estadoActual: boolean): Promise<boolean> {
    const { error } = await this.supabase
      .from('peliculas')
      .update({ activa: !estadoActual })
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar estado de película:', error.message);
      return false;
    }
    return true;
  }
}
