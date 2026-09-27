import { Component, OnInit, inject, signal } from '@angular/core';
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

  // 1. Entradas vendidas agrupadas por Película
  private async cargarVentasPeliculas() {
    const { data, error } = await this.supabase
      .from('entradas')
      .select(`
        id,
        estado,
        funciones (
          peliculas (
            titulo
          )
        )
      `)
      .neq('estado', 'cancelada');

    if (error || !data) return;

    const contador: Record<string, number> = {};
    for (const item of data) {
      const titulo = (item.funciones as any)?.peliculas?.titulo || 'Desconocida';
      contador[titulo] = (contador[titulo] || 0) + 1;
    }

    this.peliculasLabels.set(Object.keys(contador));
    this.peliculasData.set(Object.values(contador));
  }

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