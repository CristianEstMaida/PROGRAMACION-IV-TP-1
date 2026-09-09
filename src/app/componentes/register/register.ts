import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { email, form, FormField, required, minLength } from '@angular/forms/signals';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { RegisterData } from '../../models/register-data';

@Component({
  standalone: true,
  selector: 'app-register',
  styleUrls: ['./register.css', '../../../styles.css'],
  templateUrl: './register.html',
  imports: [FormField, RouterLink, CommonModule, FormsModule]
})
export class Register {
  registerModel = signal<RegisterData>({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    aceptaTerminos: false
  });

  registerForm = form(this.registerModel, (schemaPath) => {
    required(schemaPath.email, { message: 'Email es obligatorio' });
    email(schemaPath.email, { message: 'Ingresa un correo electrónico válido' });
    required(schemaPath.password, { message: 'Contraseña es obligatoria' });
    minLength(schemaPath.password, 8, { message: 'Mínimo 8 caracteres' });
    required(schemaPath.confirmPassword, { message: 'Confirmar contraseña es obligatorio' });
    required(schemaPath.nombre, { message: 'Nombre es obligatorio' });
    required(schemaPath.apellido, { message: 'Apellido es obligatorio' });
    required(schemaPath.fechaNacimiento, { message: 'Fecha de nacimiento es obligatoria' });
    required(schemaPath.aceptaTerminos, { message: 'Debes aceptar los términos y condiciones' });
  });

  registerError: string | null = null;
  emailState = signal<'pristine' | 'pending' | 'valid' | 'invalid'>('pristine');

  constructor(
    private auth: Auth, 
    private router: Router, 
    private cdr: ChangeDetectorRef
  ) {}

  onEmailBlur() {
    const emailVal = this.registerModel().email.trim();

    if (!emailVal) {
      this.emailState.set('pristine');
      this.cdr.detectChanges();
      return;
    }

    // 1. Estado en espera (violeta con reloj de arena)
    this.emailState.set('pending');
    this.cdr.detectChanges();

    // 2. Validación de formato tras 600ms
    setTimeout(() => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(emailVal);

      if (isValid) {
        this.emailState.set('valid');
      } else {
        this.emailState.set('invalid');
      }

      this.cdr.detectChanges();
    }, 600);
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    const data = this.registerModel();

    if (data.password !== data.confirmPassword) {
      console.error('Las contraseñas no coinciden');
      return;
    }

    try {
      const result = await this.auth.signUp(data.email, data.password);

      if (result.user) {
        await this.auth.insertProfile({
          id: result.user.id,
          nombre: data.nombre,
          apellido: data.apellido,
          fecha_nacimiento: data.fechaNacimiento,
          rol: 'cliente',
          puntos: 0,
          credito: 0,
          aceptaTerminos: data.aceptaTerminos
        });

        this.registerError = null;
        this.router.navigate(['/home']);
      }
    } catch (error: any) {
      if (error?.message?.includes('User already registered')) {
        this.registerError = 'duplicate';
      } else {
        this.registerError = 'other';
        console.error(error?.message || error);
      }
      this.cdr.detectChanges();
    }
  }
}