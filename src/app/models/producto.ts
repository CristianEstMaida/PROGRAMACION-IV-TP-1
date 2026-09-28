export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  imagen_url?: string;
  activo?: boolean;
}

export interface ProductoCarrito extends Producto {
  cantidad: number;
}

export interface Combo {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  activo?: boolean;
}