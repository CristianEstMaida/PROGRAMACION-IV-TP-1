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
    nombre: string;
    apellido: string;
    fecha_nacimiento: string;
    rol: string;
    puntos: number;
    credito: number;
    aceptaTerminos: boolean;
  }) {
    const { error } = await this.supabase
      .from('perfiles')
      .insert(profile);

    if (error) throw error;
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