export interface Sala {
  id: number;
  nombre: string;
  filas?: number;
  columnas?: number;
  capacidad?: number;
  tipo?: string; // estándar, VIP, accesible
  activa: boolean;
}


export interface Butaca {
  id: number;
  sala_id: number;
  fila: string;
  numero: number;
  tipo: 'normal' | 'accesible' | 'vip';
  ocupada?: boolean;
}