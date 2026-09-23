import {Service} from '@angular/core';
import {createClient, SupabaseClient} from '@supabase/supabase-js'; 
import {environment} from '../../environments/environments';

@Service()
export class Auth {
  
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({email, password});
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

async insertProfile(profile: {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  tipo_sangre?: string;
  color_ojos?: string;
  dias_vacaciones?: number;
  rol: string;
  puntos: number;
  credito: number;
}) {
  // .upsert actualiza si el trigger ya creó el registro con el ID de Auth
  const { data, error } = await this.supabase
    .from('perfiles')
    .upsert(profile, { onConflict: 'id' });

  if (error) {
    console.error('Error detallado al guardar perfil en Supabase:', error);
    throw error;
  }
  return data;
}

  resetPasswordForEmail(email: string) {
    return this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:4200/reset-password',
    });
  }
  
  updatePassword(password: string) {
    return this.supabase.auth.updateUser({ password });
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  getUser() {
    return this.supabase.auth.getUser();
  }

  async getCurrentUser() {
    const { data } = await this.supabase.auth.getUser();
    return data.user; // devuelve el usuario actual si está logueado
  }

   // Nuevo método: obtiene el rol desde la tabla usuarios
  async getUserRole(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('perfiles')
      .select('rol')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data.rol;
  }

  getUsers() {
    return this.supabase.auth.admin.listUsers();
  }
}