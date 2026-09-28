export interface Movie {
  id: number;
  titulo: string;
  duracion_minutos: number;
  formato?: '2D' | '3D' | '4D' | '5D' | string;
  restriccion_edad: 'ATP' | '+13' | '+16' | '+18' | string;
  idioma?: string;
  sinopsis?: string;
  imagen_url?: string;
  fecha_estreno?: string;
  precio?: number;
  promedio_estrellas?: number;
  total_ventas?: number;

  // Propiedades opcionales heredadas de mocks o componentes de detalle
  poster?: string;
  genre?: string;
  trailerUrl?: string;
  title?: string;
}

export interface UpcomingMovie {
  id: number;
  title: string;
  date: string;
  poster: string;
}

export interface MovieDetailModel {
  id: number;
  title: string;
  rating: string;
  poster: string;
  genre: string;
  duration: number;
  synopsis: string;
  trailerUrl: string;
}
