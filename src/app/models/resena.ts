export interface Resena {
  id: number;
  pelicula_id: number;
  usuario_id: string | null;
  autor_nombre: string;
  puntuacion: number; // 1 a 5
  comentario: string;
  creado_en?: string;
}