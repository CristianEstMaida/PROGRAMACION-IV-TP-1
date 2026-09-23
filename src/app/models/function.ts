import { Movie } from './movie';
import { Sala } from './sala';

export interface Funcion {
  id: number;
  pelicula_id: number;
  sala_id: number;
  fecha_hora: string;
  fecha_fin: string;
  precio: number;
  tipo_funcion: '2D' | '3D' | '4D' | '5D';
  estado: 'activa' | 'cancelada' | 'finalizada';
  pelicula?: Movie;
  sala?: Sala;
}