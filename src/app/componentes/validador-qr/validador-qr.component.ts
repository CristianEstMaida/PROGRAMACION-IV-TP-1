import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-validador-qr',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './validador-qr.component.html',
  styleUrls: ['./validador-qr.component.css']
})
export class ValidadorQrComponent{
  private supabase = inject(SupabaseService).client;
  private auth = inject(Auth);

  codigoEntrada = signal<string>('');
  resultado = signal<any | null>(null);
  mensajeError = signal<string | null>(null);
  cargando = signal<boolean>(false);

 
  async validarCodigo() {
    const raw = this.codigoEntrada().trim();
    if (!raw) return;

    this.cargando.set(true);
    this.resultado.set(null);
    this.mensajeError.set(null);

    try {
      // 1. Buscar la entrada por QR code
      const { data: entrada, error } = await this.supabase
        .from('entradas')
        .select(`
          id, 
          estado, 
          qr_code, 
          funciones (
            fecha_hora, 
            tipo_funcion, 
            peliculas (titulo), 
            salas (nombre)
          ),
          butacas (fila, numero)
        `)
        .eq('qr_code', raw)
        .single();

      if (error || !entrada) {
        this.mensajeError.set('Código de entrada inexistente o no encontrado.');
        return;
      }

      // 2. Verificar estado
      if (entrada.estado === 'usada') {
        this.mensajeError.set('⚠️ Este código ya fue validado e ingresado anteriormente.');
        return;
      }

      if (entrada.estado === 'cancelada') {
        this.mensajeError.set('❌ Esta entrada fue cancelada y no tiene validez.');
        return;
      }

      // 3. Marcar como usada para que el QR deje de funcionar
      const { error: errUpdate } = await this.supabase
        .from('entradas')
        .update({ estado: 'usada' })
        .eq('id', entrada.id);

      if (errUpdate) {
        this.mensajeError.set('Error al actualizar el estado de la entrada.');
        return;
      }

      // 4. Registrar en el Log de Actividad
      const currentUser = await this.auth.getCurrentUser();
      const operadorNombre = currentUser?.email ? currentUser.email.split('@')[0] : 'Operador';

      await this.supabase.from('logs_actividad').insert({
        usuario: operadorNombre,
        accion: 'Validó QR Entrada',
        detalle: `Entrada #${entrada.id} (${(entrada.funciones as any)?.peliculas?.titulo || 'Cine'}) Butaca: ${(entrada.butacas as any)?.fila}-${(entrada.butacas as any)?.numero}`
      });

      this.resultado.set(entrada);
      this.codigoEntrada.set('');

    } catch (err: any) {
      this.mensajeError.set('Ocurrió un error inesperado al validar.');
    } finally {
      this.cargando.set(false);
    }
  }
}