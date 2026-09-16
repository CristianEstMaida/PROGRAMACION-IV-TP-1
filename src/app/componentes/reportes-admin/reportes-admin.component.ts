import { Component } from '@angular/core';
import { ChartAdminComponent } from '../char-admin/char-admin.component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reportes-admin',
  standalone: true,
  imports: [ChartAdminComponent],
  templateUrl: './reportes-admin.component.html',
  styleUrls: ['./reportes-admin.component.css']
})
export class ReportesAdminComponent {
  peliculasLabels = ['Avatar 2', 'Titanic', 'Matrix'];
  peliculasData = [120, 90, 75];

  candyLabels = ['Pochoclos', 'Bebidas', 'Combos'];
  candyData = [200, 150, 80];

  facturacionLabels = ['Lunes', 'Martes', 'Miércoles'];
  facturacionData = [200000, 350000, 250000];

  // Exportar a PDF
  exportToPDF() {
    const doc = new jsPDF();
    doc.text('Reporte de Administración', 14, 20);

    autoTable(doc, {
      head: [['Película', 'Entradas vendidas']],
      body: this.peliculasLabels.map((p, i) => [p, this.peliculasData[i]])
    });

    autoTable(doc, {
      head: [['Producto Candy Bar', 'Ventas']],
      body: this.candyLabels.map((c, i) => [c, this.candyData[i]])
    });

    autoTable(doc, {
      head: [['Día', 'Facturación']],
      body: this.facturacionLabels.map((d, i) => [d, `$${this.facturacionData[i]}`])
    });

    doc.save('reportes-cine.pdf');
  }

  // Exportar a Excel
  exportToExcel() {
    const data = [
      ['Película', 'Entradas vendidas'],
      ...this.peliculasLabels.map((p, i) => [p, this.peliculasData[i]]),
      [],
      ['Producto Candy Bar', 'Ventas'],
      ...this.candyLabels.map((c, i) => [c, this.candyData[i]]),
      [],
      ['Día', 'Facturación'],
      ...this.facturacionLabels.map((d, i) => [d, this.facturacionData[i]])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reportes');
    XLSX.writeFile(workbook, 'reportes-cine.xlsx');
  }
}
