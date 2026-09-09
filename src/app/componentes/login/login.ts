import { Component, signal, ChangeDetectorRef } from '@angular/core';
import { form, FormField, required, email } from '@angular/forms/signals';
import { RouterLink, Router } from '@angular/router';
import { LoginData } from '../../models/login-data';
import { Auth } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [FormField, RouterLink, CommonModule],
  selector: 'app-login',
  styleUrls: ['./login.css', '../../../styles.css'],
  templateUrl: './login.html',
})
export class Login {
  loginModel = signal<LoginData>({
    email: '',
    password: '',
  });

  loginForm = form(this.loginModel, (schemaPath) => {
    required(schemaPath.email, { message: 'El correo es obligatorio' });
    email(schemaPath.email, { message: 'Ingresa un correo válido' });
    required(schemaPath.password, { message: 'La contraseña es obligatoria' });
  });

  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  constructor(
    private auth: Auth, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // Rellena los inputs automáticamente para pruebas rápidas
  fillDemoCredentials(emailVal: string, passVal: string) {
    this.loginModel.set({
      email: emailVal,
      password: passVal
    });
    this.errorMessage.set(null);
    this.cdr.detectChanges();
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage.set(null);
    this.isLoading.set(true);

    const credentials = this.loginModel();

    try {
      const result = await this.auth.signIn(credentials.email, credentials.password);

      if (result.error) {
        // Errores de Supabase: 'Invalid login credentials', 'Email not confirmed', etc.
        if (result.error.message.includes('Invalid login credentials')) {
          this.errorMessage.set('Usuario o contraseña incorrectos.');
        } else if (result.error.message.includes('Email not confirmed')) {
          this.errorMessage.set('Debes confirmar tu correo electrónico antes de ingresar.');
        } else {
          this.errorMessage.set(result.error.message);
        }
        return;
      }

      // Login exitoso -> redirigir al Home
      this.router.navigate(['/home']);
    } catch (err: any) {
      this.errorMessage.set('Ocurrió un error inesperado al iniciar sesión.');
    } finally {
      this.isLoading.set(false);
      this.cdr.detectChanges();
    }
  }
}