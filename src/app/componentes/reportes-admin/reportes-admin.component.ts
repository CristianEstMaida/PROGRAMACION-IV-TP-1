import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartAdminComponent } from '../char-admin/char-admin.component';
import { SupabaseService } from '../../services/supabase.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reportes-admin',
  standalone: true,
  imports: [CommonModule, ChartAdminComponent],
  templateUrl: './reportes-admin.component.html',
  styleUrls: ['./reportes-admin.component.css']
})
export class ReportesAdminComponent implements OnInit {
  private supabase = inject(SupabaseService).client;

  cargando = signal<boolean>(true);
  peliculasLabels = signal<string[]>([]);
  peliculasData = signal<number[]>([]);
  candyLabels = signal<string[]>([]);
  candyData = signal<number[]>([]);
  facturacionLabels = signal<string[]>([]);
  facturacionData = signal<number[]>([]);
  periodoPeliculas = signal<'historico' | 'mes' | 'semana'>('historico');

  topCandyProducto = computed(() => {
    const labels = this.candyLabels();
    const data = this.candyData();
    if (data.length === 0) return null;

    let maxIdx = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i] > data[maxIdx]) maxIdx = i;
    }
    return { nombre: labels[maxIdx], cantidad: data[maxIdx] };
  });
  async ngOnInit() {
    await this.cargarReportes();
  }

  async cargarReportes() {
    this.cargando.set(true);
    await Promise.all([
      this.cargarVentasPeliculas(),
      this.cargarVentasCandy(),
      this.cargarFacturacionDiaria()
    ]);
    this.cargando.set(false);
  }

  async cambiarPeriodo(periodo: 'historico' | 'mes' | 'semana') {
    this.periodoPeliculas.set(periodo);
    await this.cargarVentasPeliculas();
  }

  private async cargarVentasPeliculas() {
    const { data, error } = await this.supabase
      .from('entradas')
      .select(`
        id,
        estado,
        funciones (
          fecha_hora,
          peliculas ( titulo )
        )
      `)
      .neq('estado', 'cancelada');

    if (error) {
      console.error('Error al cargar ventas de películas:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      this.peliculasLabels.set([]);
      this.peliculasData.set([]);
      return;
    }

    const ahora = new Date().getTime();
    const periodo = this.periodoPeliculas();
    // Filtrar entradas en memoria según el período
    const entradasFiltradas = data.filter((item: any) => {
      if (periodo === 'historico') return true;

      const fechaItemStr = item.funciones?.fecha_hora;
      if (!fechaItemStr) return true;

      const fechaItem = new Date(fechaItemStr).getTime();
      const diffDias = Math.abs(ahora - fechaItem) / (1000 * 60 * 60 * 24);

      if (periodo === 'semana') return diffDias <= 7;
      if (periodo === 'mes') return diffDias <= 30;
      return true;
    });
    const contador: Record<string, number> = {};
    for (const item of entradasFiltradas) {
      const titulo = (item.funciones as any)?.peliculas?.titulo || 'Película sin título';
      contador[titulo] = (contador[titulo] || 0) + 1;
    }

    const labels = Object.keys(contador);
    const valores = Object.values(contador);

    if (labels.length === 0) {
      this.peliculasLabels.set(['Sin funciones vendidas']);
      this.peliculasData.set([0]);
    } else {
      this.peliculasLabels.set(labels);
      this.peliculasData.set(valores);
    }
  }

  // 1. Entradas vendidas agrupadas por Película
  
  // 2. Unidades de Candy Bar vendidas por producto
  private async cargarVentasCandy() {
    const { data, error } = await this.supabase
      .from('compra_producto')
      .select(`
        cantidad,
        productos (
          nombre
        )
      `);

    if (error || !data) return;

    const contador: Record<string, number> = {};
    for (const item of data) {
      const nombre = (item.productos as any)?.nombre || 'Producto';
      contador[nombre] = (contador[nombre] || 0) + (item.cantidad || 0);
    }

    this.candyLabels.set(Object.keys(contador));
    this.candyData.set(Object.values(contador));
  }

  // 3. Facturación diaria de Candy Bar
  private async cargarFacturacionDiaria() {
    const { data, error } = await this.supabase
      .from('compras_candy')
      .select('fecha, total')
      .order('fecha', { ascending: true });

    if (error || !data) return;

    const agrupado: Record<string, number> = {};
    for (const item of data) {
      const dia = new Date(item.fecha).toLocaleDateString('es-AR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit'
      });
      agrupado[dia] = (agrupado[dia] || 0) + Number(item.total || 0);
    }

    this.facturacionLabels.set(Object.keys(agrupado));
    this.facturacionData.set(Object.values(agrupado));
  }
  
  // Exportar a PDF con datos reales
  exportToPDF() {
    const doc = new jsPDF();
    doc.text('CineNova - Reporte General de Administración', 14, 20);

    const pelisLabels = this.peliculasLabels();
    const pelisData = this.peliculasData();
    autoTable(doc, {
      startY: 28,
      head: [['Película', 'Entradas vendidas']],
      body: pelisLabels.map((p, i) => [p, pelisData[i]])
    });

    const candyLabels = this.candyLabels();
    const candyData = this.candyData();
    autoTable(doc, {
      head: [['Producto Candy Bar', 'Unidades Vendidas']],
      body: candyLabels.map((c, i) => [c, candyData[i]])
    });

    const factLabels = this.facturacionLabels();
    const factData = this.facturacionData();
    autoTable(doc, {
      head: [['Día / Período', 'Facturación']],
      body: factLabels.map((d, i) => [d, `$${factData[i]} ARS`])
    });

    doc.save('reporte-cinenova.pdf');
  }

  // Exportar a Excel con datos reales
  exportToExcel() {
    const pelisLabels = this.peliculasLabels();
    const pelisData = this.peliculasData();
    const candyLabels = this.candyLabels();
    const candyData = this.candyData();
    const factLabels = this.facturacionLabels();
    const factData = this.facturacionData();

    const data = [
      ['Película', 'Entradas vendidas'],
      ...pelisLabels.map((p, i) => [p, pelisData[i]]),
      [],
      ['Producto Candy Bar', 'Unidades Vendidas'],
      ...candyLabels.map((c, i) => [c, candyData[i]]),
      [],
      ['Día / Período', 'Facturación Candy'],
      ...factLabels.map((d, i) => [d, factData[i]])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reportes');
    XLSX.writeFile(workbook, 'reporte-cinenova.xlsx');
  }
}