import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Perfil } from '../../models/perfil';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-fidelizacion-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fidelizacion-admin.component.html',
  styleUrls: ['./fidelizacion-admin.component.css']
})
export class FidelizacionAdminComponent implements OnInit {
  private supabase = inject(SupabaseService).client;
  private auth = inject(Auth);

  clientes = signal<Perfil[]>([]);
  filtro = signal<string>('');
  cargando = signal<boolean>(true);

  // Control del Modal de Ajuste
  mostrarModal = signal<boolean>(false);
  guardandoAjuste = signal<boolean>(false);
  clienteSeleccionado = signal<Perfil | null>(null);
  tipoAjuste = signal<'puntos' | 'credito'>('puntos');
  operacion = signal<'sumar' | 'restar'>('sumar');
  montoAjuste = signal<number>(100);

  // Totales acumulados calculados con computed
  totalPuntosEmitidos = computed(() => 
    this.clientes().reduce((acc, c) => acc + (c.puntos || 0), 0)
  );

  totalCreditoDisponible = computed(() => 
    this.clientes().reduce((acc, c) => acc + (c.credito || 0), 0)
  );

  // Filtro reactivo por nombre, apellido o email
  clientesFiltrados = computed(() => {
    const q = this.filtro().toLowerCase().trim();
    if (!q) return this.clientes();
    return this.clientes().filter(c =>
      (c.nombre?.toLowerCase().includes(q)) ||
      (c.apellido?.toLowerCase().includes(q)) ||
      (c.email?.toLowerCase().includes(q))
    );
  });

  async ngOnInit() {
    await this.cargarClientesFidelidad();
  }

  // 1. GET: Traer ranking de clientes con puntos y crédito
  async cargarClientesFidelidad() {
    this.cargando.set(true);
    const { data, error } = await this.supabase
      .from('perfiles')
      .select('id, nombre, apellido, email, rol, puntos, credito')
      .order('puntos', { ascending: false });

    if (error) {
      console.error('Error al cargar datos de fidelización:', error.message);
    } else if (data) {
      this.clientes.set(data as Perfil[]);
    }
    this.cargando.set(false);
  }

  abrirModalAjuste(cliente: Perfil, tipo: 'puntos' | 'credito') {
    this.clienteSeleccionado.set(cliente);
    this.tipoAjuste.set(tipo);
    this.operacion.set('sumar');
    this.montoAjuste.set(tipo === 'puntos' ? 100 : 1000);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    if (this.guardandoAjuste()) return;
    this.mostrarModal.set(false);
    this.clienteSeleccionado.set(null);
  }

  async confirmarAjuste() {
    const cliente = this.clienteSeleccionado();
    const valor = Number(this.montoAjuste());

    if (!cliente || isNaN(valor) || valor <= 0) {
      alert('Ingresá un monto o valor válido mayor a 0.');
      return;
    }

    this.guardandoAjuste.set(true);
    const delta = this.operacion() === 'sumar' ? valor : -valor;

    try {
      const user = await this.auth.getCurrentUser();
      const operadorEmail = user?.email || 'admin@cinenova.com';

      if (this.tipoAjuste() === 'puntos') {
        const nuevosPuntos = Math.max(0, (cliente.puntos || 0) + delta);
        const { error } = await this.supabase
          .from('perfiles')
          .update({ puntos: nuevosPuntos })
          .eq('id', cliente.id);

        if (error) throw error;

        this.clientes.update(lista =>
          lista.map(c => c.id === cliente.id ? { ...c, puntos: nuevosPuntos } : c)
        );

        await this.supabase.from('logs_actividad').insert({
          usuario: operadorEmail,
          accion: 'Ajustó Puntos Fidelización',
          entidad_afectada: 'perfiles',
          detalle: `${this.operacion() === 'sumar' ? '+' : '-'}${valor} pts a ${cliente.nombre} (Total: ${nuevosPuntos})`
        });
      } else {
        const nuevoCredito = Math.max(0, (cliente.credito || 0) + delta);
        const { error } = await this.supabase
          .from('perfiles')
          .update({ credito: nuevoCredito })
          .eq('id', cliente.id);

        if (error) throw error;

        this.clientes.update(lista =>
          lista.map(c => c.id === cliente.id ? { ...c, credito: nuevoCredito } : c)
        );

        await this.supabase.from('logs_actividad').insert({
          usuario: operadorEmail,
          accion: 'Ajustó Crédito a Favor',
          entidad_afectada: 'perfiles',
          detalle: `${this.operacion() === 'sumar' ? '+' : '-'}$${valor} ARS a ${cliente.nombre} (Saldo: $${nuevoCredito})`
        });
      }

      this.cerrarModal();
    } catch (err: any) {
      console.error(err);
      alert('Error al actualizar en Supabase: ' + (err.message || 'Error desconocido'));
    } finally {
      this.guardandoAjuste.set(false);
    }
  }
}