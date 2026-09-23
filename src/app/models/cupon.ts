export interface Cupon {
  id: number;
  codigo: string;
  nombre?: string;
  descuento: number; // o descuento_porcentaje según tu columna SQL
  fechaInicio?: string;
  fechaFin?: string;
  activo: boolean;
  
  // Requerimientos específicos de los correos:
  solo_primera_compra?: boolean;
  edad_minima?: number; // ej: 50 para SENIOR50
}