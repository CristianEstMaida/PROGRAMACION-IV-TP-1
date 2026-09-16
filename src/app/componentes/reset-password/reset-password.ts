import { Component, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Auth } from '../../services/auth';

@Component({
  standalone: true,
  selector: 'app-reset-password',
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css'],
  imports: [FormField, RouterLink, CommonModule, MatIconModule]
})
export class ResetPassword {
  resetModel = signal({
    password: ''
  });

  showPassword = signal<boolean>(false);

  resetForm = form(this.resetModel, (schemaPath) => {
    required(schemaPath.password, { message: 'Nueva contraseña es obligatoria' });
  });

  constructor(private auth: Auth, private router: Router) {}

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    const { password } = this.resetModel();
    const result = await this.auth.updatePassword(password);
    if (result.error) {
      console.error('Error al actualizar contraseña:', result.error);
      return;
    }
    this.router.navigate(['/login']);
  }
}