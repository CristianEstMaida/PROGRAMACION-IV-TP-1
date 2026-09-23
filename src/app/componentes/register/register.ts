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
  // Variables locales para los inputs normales
  diaNac: string = '';
  mesNac: string = '';
  anioNac: string = '';
  registerModel = signal<RegisterData>({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    tipo_sangre: 'O+',
    color_ojos: 'Marrones',
    dias_vacaciones: 14,
    aceptaTerminos: false
  });

  actualizarFechaNacimiento() {
    const diaNum = Number(this.diaNac);
    const anioNum = Number(this.anioNac);
    const m = this.mesNac;

    // Validar rango real de día y año
    const esDiaValido = diaNum >= 1 && diaNum <= 31;
    const esAnioValido = anioNum >= 1920 && anioNum <= new Date().getFullYear();

    if (esDiaValido && m && esAnioValido && this.anioNac.toString().length === 4) {
      const d = diaNum.toString().padStart(2, '0');
      const a = anioNum.toString();
      const fechaIso = `${a}-${m}-${d}`;
      this.registerModel.update(model => ({ ...model, fechaNacimiento: fechaIso }));
    } else {
      this.registerModel.update(model => ({ ...model, fechaNacimiento: '' }));
    }
  }

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
      this.emailState.set(emailRegex.test(emailVal) ? 'valid' : 'invalid');
      this.cdr.detectChanges();
    }, 400);
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    
    // Forzar la actualización de la fecha de nacimiento antes de enviar
    this.actualizarFechaNacimiento();

    const data = this.registerModel();

    if (data.password !== data.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      const result = await this.auth.signUp(data.email, data.password);

      if (result.user) {
        await this.auth.insertProfile({
          id: result.user.id,
          email: data.email.trim(),
          nombre: data.nombre.trim(),
          apellido: data.apellido.trim(),
          fecha_nacimiento: data.fechaNacimiento,
          tipo_sangre: data.tipo_sangre,
          color_ojos: data.color_ojos,
          dias_vacaciones: Number(data.dias_vacaciones) || 14,
          rol: 'cliente',
          puntos: 0,
          credito: 0
        });

        this.registerError = null;
        this.router.navigate(['/home']);
      }
    } catch (error: any) {
      console.error('Error en el registro:', error);
      if (error?.message?.includes('User already registered')) {
        this.registerError = 'duplicate';
      } else {
        this.registerError = 'other';
        alert('Ocurrió un error al registrar el perfil: ' + (error?.message || error));
      }
      this.cdr.detectChanges();
    }
  }
}