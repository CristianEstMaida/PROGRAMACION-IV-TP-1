import { Component, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth';

@Component({
  standalone: true,
  selector: 'app-reset-password',
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css'],
  imports: [FormField, RouterLink, CommonModule]
})
export class ResetPassword {
  resetModel = signal({
    password: ''
  });

  resetForm = form(this.resetModel, (schemaPath) => {
    required(schemaPath.password, { message: 'Nueva contraseña es obligatoria' });
  });

  constructor(private auth: Auth, private router: Router) {}

  async onSubmit(event: Event) {
    event.preventDefault();
    const { password } = this.resetModel();

    // Supabase ya te da el access_token en la URL cuando el usuario entra desde el mail
    const result = await this.auth.updatePassword(password);

    if (result.error) {
      console.error('Error al actualizar contraseña:', result.error);
      return;
    }

    console.log('Contraseña actualizada correctamente');
    this.router.navigate(['/login']);
  }
}
