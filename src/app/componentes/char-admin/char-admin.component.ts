import { Component, Input, AfterViewInit, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables, ChartConfiguration, ChartType } from 'chart.js';

//Chart.register(...registerables);
Chart.register(...registerables);
@Component({
  selector: 'app-chart-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-admin.component.html',
  styleUrls: ['./chart-admin.component.css']
})
export class ChartAdminComponent implements AfterViewInit, OnDestroy {
  @Input() title: string = '';
  @Input() chartType: ChartType = 'bar';
  @Input() labels: string[] = [];
  @Input() data: number[] = [];
//  @Input() type: ChartType = 'bar';



  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
//   private chart!: Chart;
  private chart?: Chart;
    // ngOnInit() {
    // new Chart('chart', {
    //   type: 'bar', // o 'line'
    //   data: {
    //     labels: this.labels,
    //     datasets: [{
    //       label: 'Datos',
    //       data: this.data,
    //       backgroundColor: ['#FF9800', '#4CAF50', '#2196F3']
    //     }]
    //   }
    // });

//     ngOnInit() {
//     this.chart = new Chart('chart', {
//       type: this.type,
//       data: {
//         labels: this.labels,
//         datasets: [{
//           label: 'Datos',
//           data: this.data,
//           backgroundColor: ['#FF9800', '#4CAF50', '#2196F3']
//         }]
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: false
//       }
//     });
//   }

// ngOnInit() {
//     this.chart = new Chart(this.chartCanvas.nativeElement, {
//       type: this.type,
//       data: {
//         labels: this.labels,
//         datasets: [{
//           label: 'Datos',
//           data: this.data,
//           backgroundColor: ['#FF9800', '#4CAF50', '#2196F3']
//         }]
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: false
//       }
//     });
//   }
ngAfterViewInit() {
    if (!this.chartCanvas?.nativeElement) return;

    // Destruir instancia previa si existiera en el mismo canvas
    if (this.chart) {
      this.chart.destroy();
    }
    // this.chart = new Chart(this.chartCanvas.nativeElement, {
    //   type: this.chartType,
    //     // type: this.type,
    //   data: {
    //     labels: this.labels,
    //     datasets: [{
    //       label: this.title,
    //       data: this.data,
    //       backgroundColor: ['#FF9800', '#4CAF50', '#2196F3']
    //     }]
    //   },
    //   options: {
    //     responsive: true,
    //     maintainAspectRatio: false
    //   }
    const isLine = this.chartType === 'line';

  this.chart = new Chart(this.chartCanvas.nativeElement, {
    type: this.chartType,
    data: {
      labels: this.labels,
      datasets: [{
        label: this.title,
        data: this.data,
        // Barras redondeadas y con colores del mockup
        backgroundColor: isLine ? 'rgba(255, 179, 0, 0.15)' : ['#1e88e5', '#ff9800', '#00e676', '#ab47bc'],
        borderColor: isLine ? '#ffb300' : 'transparent',
        borderWidth: isLine ? 2.5 : 0,
        fill: isLine,
        tension: 0.35, // Curvatura suave de la línea
        pointBackgroundColor: '#fff',
        pointBorderColor: '#ffb300',
        pointBorderWidth: 2,
        pointRadius: isLine ? 4 : 0,
        borderRadius: isLine ? 0 : 6, // Esquinas redondeadas en las barras
        barThickness: 24 // Barras delgadas y proporcionadas
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: '#cbd5e1',
            boxWidth: 12,
            boxHeight: 12,
            font: { size: 12, family: 'Segoe UI' }
          }
        },
        tooltip: {
          backgroundColor: '#0d1522',
          titleColor: '#fff',
          bodyColor: '#cbd5e1',
          borderColor: '#1e2d44',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#94a3b8',
            font: { size: 11, family: 'Segoe UI' }
          },
          grid: {
            display: false // Oculta líneas verticales
          }
        },
        y: {
          ticks: {
            color: '#94a3b8',
            font: { size: 11, family: 'Segoe UI' }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.06)' // Líneas guía horizontales tenues
          }
        }
      }
    }
    });
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy(); // 🔥 destruye el gráfico antes de desmontar el componente
      this.chart = undefined;
    }
  }

//   ngAfterViewInit(): void {
//     const config: ChartConfiguration = {
//       type: this.chartType,
//       data: {
//         labels: this.labels,
//         datasets: [{
//           label: this.title,
//           data: this.data,
//           backgroundColor: '#FF9800',
//           borderColor: '#F57C00',
//           borderWidth: 1
//         }]
//       },
//       options: {
//         responsive: true,
//         plugins: {
//           legend: { display: false },
//           title: { display: true, text: this.title }
//         }
//       }
//     };

//     new Chart(this.chartCanvas.nativeElement, config);
//   }
    //}
}
