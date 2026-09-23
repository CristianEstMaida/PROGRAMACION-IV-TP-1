export interface Perfil {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  tipo_sangre: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  color_ojos: string;
  dias_vacaciones: number;
  rol: 'cliente' | 'operador' | 'admin';
  puntos: number;
  credito: number;
  creado_en?: string;
}