import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Perfil } from '../../models/perfil';

@Component({
  selector: 'app-fidelizacion-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fidelizacion-admin.component.html',
  styleUrls: ['./fidelizacion-admin.component.css']
})
export class FidelizacionAdminComponent implements OnInit {
  private supabase = inject(SupabaseService).client;

  clientes = signal<Perfil[]>([]);
  filtro = signal<string>('');
  cargando = signal<boolean>(true);

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

  // 2. UPDATE: Ajustar puntos a un cliente
  async ajustarPuntos(cliente: Perfil) {
    const deltaStr = prompt(`Sumar o restar puntos para ${cliente.nombre} (ej: 100 o -50):`);
    if (!deltaStr) return;

    const delta = parseInt(deltaStr, 10);
    if (isNaN(delta) || delta === 0) return;

    const nuevosPuntos = Math.max(0, (cliente.puntos || 0) + delta);

    const { error } = await this.supabase
      .from('perfiles')
      .update({ puntos: nuevosPuntos })
      .eq('id', cliente.id);

    if (error) {
      alert('Error al actualizar los puntos.');
      return;
    }

    this.clientes.update(lista =>
      lista.map(c => c.id === cliente.id ? { ...c, puntos: nuevosPuntos } : c)
    );
  }

  // 3. UPDATE: Bonificar o ajustar crédito disponible
  async ajustarCredito(cliente: Perfil) {
    const montoStr = prompt(`Ingresá el monto de crédito a sumar o restar a ${cliente.nombre} en $ ARS:`);
    if (!montoStr) return;

    const monto = parseFloat(montoStr);
    if (isNaN(monto) || monto === 0) return;

    const nuevoCredito = Math.max(0, (cliente.credito || 0) + monto);

    const { error } = await this.supabase
      .from('perfiles')
      .update({ credito: nuevoCredito })
      .eq('id', cliente.id);

    if (error) {
      alert('Error al actualizar el crédito.');
      return;
    }

    this.clientes.update(lista =>
      lista.map(c => c.id === cliente.id ? { ...c, credito: nuevoCredito } : c)
    );
  }
}