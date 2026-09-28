export type RolUsuario = 'cliente' | 'empleado' | 'operador' | 'admin';

export interface Perfil {
  id: string; // UUID de auth.users
  email: string;
  nombre: string;
  apellido?: string;
  rol: RolUsuario;
  puntos: number;
  credito: number;
  fecha_nacimiento?: string;
  tipo_sangre?: string;
  color_ojos?: string;
  dias_vacaciones?: number;
  activo?: boolean;
  creado_en?: string;
}