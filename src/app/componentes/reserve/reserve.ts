import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { MoviesService } from '../../services/movies.service';
import { MovieDetailModel } from '../../models/movie';

export interface Seat {
  id: string;      // ej: "A-1"
  row: string;     // ej: "A"
  number: number;  // 1 a 28
  selected: boolean;
  occupied: boolean;
}

export interface ShowTime {
  id: string;
  roomName: string;
  format: '2D' | '3D' | '4D' | '5D';
  audio: 'Subtitulada' | 'Doblada';
  startTime: string; // ej: "16:00"
  endTime: string;   // se calcula con duración + 30m
  price: number;
}

@Component({
  standalone: true,
  selector: 'app-reserve',
  templateUrl: './reserve.html',
  styleUrls: ['./reserve.css'],
  imports: [CommonModule, RouterLink]
})
export class Reserve implements OnInit {
  movie = signal<MovieDetailModel | null>(null);

  // Funciones disponibles
  showtimes = signal<ShowTime[]>([]);
  selectedShowtime = signal<ShowTime | null>(null);

  // Butacas de la sala
  seats = signal<Seat[]>([]);

  // Precios y totales
  selectedSeats = computed(() => this.seats().filter(s => s.selected));
  totalPrice = computed(() => {
    const currentPrice = this.selectedShowtime()?.price ?? 4500;
    return this.selectedSeats().length * currentPrice;
  });

  purchaseSuccess = signal<boolean>(false);

  constructor(
    private route: ActivatedRoute,
    private moviesService: MoviesService,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.moviesService.getMovieById(id).subscribe({
        next: (data) => {
          if (data) {
            this.movie.set(data);
            this.generateSchedule(data.duration || 120);
            this.generateSeats();
          }
        }
      });
    }
  }

  // Genera el cronograma respetando: duración + 30 min de limpieza/pausa
  generateSchedule(durationMin: number) {
    const totalSlot = durationMin + 30; // Minutos totales por bloque
    const startHours = [14, 0]; // Abre a las 14:00

    const formats: Array<{ format: '2D' | '3D' | '4D' | '5D'; audio: 'Subtitulada' | 'Doblada'; price: number }> = [
      { format: '2D', audio: 'Doblada', price: 4500 },
      { format: '3D', audio: 'Subtitulada', price: 6000 },
      { format: '4D', audio: 'Subtitulada', price: 8500 },
      { format: '5D', audio: 'Doblada', price: 10500 }
    ];

    let currentMinutes = startHours[0] * 60 + startHours[1];
    const generated: ShowTime[] = [];

    formats.forEach((cfg, idx) => {
      const startH = Math.floor(currentMinutes / 60);
      const startM = currentMinutes % 60;
      const endTotalMin = currentMinutes + durationMin;
      const endH = Math.floor(endTotalMin / 60);
      const endM = endTotalMin % 60;

      const formatPad = (h: number, m: number) =>
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      generated.push({
        id: `show-${idx + 1}`,
        roomName: 'Sala Principal',
        format: cfg.format,
        audio: cfg.audio,
        startTime: formatPad(startH, startM),
        endTime: formatPad(endH, endM),
        price: cfg.price
      });

      // La siguiente función comienza estrictamente tras la película + 30 minutos
      currentMinutes += totalSlot;
    });

    this.showtimes.set(generated);
    if (generated.length > 0) {
      this.selectedShowtime.set(generated[0]);
    }
  }
  // Genera 20 filas (A-T) con 28 asientos por fila (4 - 20 - 4)
  generateSeats() {
    const letters = 'ABCDEFGHIJKLMNOPQRST'.split(''); // 20 filas
    const allSeats: Seat[] = [];

    letters.forEach(rowLetter => {
      for (let n = 1; n <= 28; n++) {
        // Simulación de butacas ocupadas al azar
        const isOccupied = (rowLetter === 'F' || rowLetter === 'G') && (n === 10 || n === 11 || n === 12);

        allSeats.push({
          id: `${rowLetter}-${n}`,
          row: rowLetter,
          number: n,
          selected: false,
          occupied: isOccupied
        });
      }
    });

    this.seats.set(allSeats);
  }
  // Helpers para obtener columnas por fila en el template
  getLeftSeats(row: string): Seat[] {
    return this.seats().filter(s => s.row === row && s.number >= 1 && s.number <= 4);
  }

  getCenterSeats(row: string): Seat[] {
    return this.seats().filter(s => s.row === row && s.number >= 5 && s.number <= 24);
  }

  getRightSeats(row: string): Seat[] {
    return this.seats().filter(s => s.row === row && s.number >= 25 && s.number <= 28);
  }

  getRows(): string[] {
    return 'ABCDEFGHIJKLMNOPQRST'.split('');
  }

  selectShowtime(show: ShowTime) {
    this.selectedShowtime.set(show);
    // Reinicia las seleccionadas si cambia la función
    this.seats.update(list => list.map(s => ({ ...s, selected: false })));
  }

  toggleSeat(seat: Seat) {
    if (seat.occupied) return;
    this.seats.update(list =>
      list.map(s => s.id === seat.id ? { ...s, selected: !s.selected } : s)
    );
  }
  confirmBooking() {
    if (this.selectedSeats().length === 0) return;
    this.purchaseSuccess.set(true);
  }
}