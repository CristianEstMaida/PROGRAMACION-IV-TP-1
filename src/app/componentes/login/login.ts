import { Component, signal, ChangeDetectorRef, inject } from '@angular/core';
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
  private auth = inject(Auth);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

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
        if (result.error.message.includes('Invalid login credentials')) {
          this.errorMessage.set('Usuario o contraseña incorrectos.');
        } else if (result.error.message.includes('Email not confirmed')) {
          this.errorMessage.set('Debes confirmar tu correo electrónico antes de ingresar.');
        } else {
          this.errorMessage.set(result.error.message);
        }
        return;
      }

      // Redirección dinámica según el rol registrado en Supabase
      const user = await this.auth.getCurrentUser();
      if (user) {
        const rol = await this.auth.getUserRole(user.id);

        if (rol === 'admin') {
          this.router.navigate(['/admin']);
        } else if (rol === 'operador') {
          this.router.navigate(['/admin/validar-qr']);
        } else {
          this.router.navigate(['/home']);
        }
      } else {
        this.router.navigate(['/home']);
      }
    } catch (err: any) {
      console.error('Error durante el inicio de sesión:', err);
      this.errorMessage.set('Ocurrió un error inesperado al iniciar sesión.');
    } finally {
      this.isLoading.set(false);
      this.cdr.detectChanges();
    }
  }
}