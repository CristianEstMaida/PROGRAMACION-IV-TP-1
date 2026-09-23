export interface Sala {
  id: number;
  nombre: string;
  filas?: number;
  columnas?: number;
  capacidad?: number;
  tipo?: string; // estándar, VIP, accesible
}


export interface Butaca {
  id: number;
  sala_id: number;
  fila: string;
  numero: number;
  tipo: 'normal' | 'adaptada' | 'vip';
  ocupada?: boolean;
}