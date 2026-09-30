import { Component, inject, signal } from '@angular/core';
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
export class ValidadorQrComponent {
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
      // 1. Buscar la entrada usando ilike para matchear tanto el código base del PDF como el completo con butaca
      const { data: entradas, error } = await this.supabase
        .from('entradas')
        .select(`
          id, 
          estado, 
          qr_code, 
          usuario_id,
          funciones (
            fecha_hora, 
            tipo_funcion, 
            peliculas (titulo), 
            salas (nombre)
          ),
          butacas (fila, numero)
        `)
        .ilike('qr_code', `%${raw}%`)
        .limit(1);

      if (error || !entradas || entradas.length === 0) {
        this.mensajeError.set('Código de entrada inexistente o no encontrado.');
        return;
      }

      const entrada = entradas[0];

      // 2. Verificar estado
     
      if (entrada.estado === 'validada' || entrada.estado === 'usada') {
        this.mensajeError.set('⚠️ Este código ya fue utilizado e ingresado previamente.');
        return;
      }

      if (entrada.estado === 'cancelada') {
        this.mensajeError.set('❌ Esta entrada fue cancelada y no tiene validez.');
        return;
      }

      // 3. Quemar la entrada en Supabase
      const { error: errUpdate } = await this.supabase
        .from('entradas')
        .update({ estado: 'validada' })
        .eq('id', entrada.id);

      if (errUpdate) {
        this.mensajeError.set('Error al actualizar el estado de la entrada.');
        return;
      }

      // Adentro de validarCodigo() en validador-qr.component.ts:
      if (entrada.usuario_id) {
        await this.supabase
          .from('compras_candy')
          .update({ estado: 'entregado' })
          .eq('usuario_id', entrada.usuario_id)
          .eq('fecha', new Date().toISOString().split('T')[0]);
      }

      // 4. Registrar en logs_actividad incluyendo entidad_afectada
      const currentUser = await this.auth.getCurrentUser();
      const operadorNombre = currentUser?.email || 'operador@cinenova.com';
      const tituloPelicula = (entrada.funciones as any)?.peliculas?.titulo || 'Cine';
      const fila = (entrada.butacas as any)?.fila || '';
      const numero = (entrada.butacas as any)?.numero || '';

      await this.supabase.from('logs_actividad').insert({
        usuario: operadorNombre,
        accion: 'Validó QR Entrada',
        entidad_afectada: 'tickets',
        detalle: `Entrada #${entrada.id} (${tituloPelicula}) Butaca: ${fila}-${numero}`
      });

      this.resultado.set(entrada);
      this.codigoEntrada.set('');

    } catch (err: any) {
      console.error('Error durante la validación:', err);
      this.mensajeError.set('Ocurrió un error inesperado al validar.');
    } finally {
      this.cargando.set(false);
    }
  }
}