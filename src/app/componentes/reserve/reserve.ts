import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { MoviesService } from '../../services/movies.service';
import { MovieDetailModel } from '../../models/movie';
import { Auth } from '../../services/auth';
import { SupabaseService } from '../../services/supabase.service';

// export interface Seat {
//   id: string;      // ej: "A-1"
//   row: string;     // ej: "A"
//   number: number;  // 1 a 28
//   selected: boolean;
//   occupied: boolean;
// }

// export interface ShowTime {
//   id: string;
//   roomName: string;
//   format: '2D' | '3D' | '4D' | '5D';
//   audio: 'Subtitulada' | 'Doblada';
//   startTime: string; // ej: "16:00"
//   endTime: string;   // se calcula con duración + 30m
//   price: number;
// }

export interface Seat {
  id: string;      // ej: "A-1"
  dbId: number;    // ID primario de la tabla butacas
  row: string;
  number: number;
  selected: boolean;
  occupied: boolean;
}

export interface ShowTime {
  id: number;
  salaId: number;
  roomName: string;
  format: '2D' | '3D' | '4D' | '5D' | string;
  audio?: 'Subtitulada' | 'Doblada' | string;
  startTime: string;
  endTime?: string;
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
  private moviesService = inject(MoviesService);
  private auth = inject(Auth);
  private supabase = inject(SupabaseService).client;
  private route = inject(ActivatedRoute);
  
  movie = signal<MovieDetailModel | null>(null);

  // Funciones disponibles
  showtimes = signal<ShowTime[]>([]);
  selectedShowtime = signal<ShowTime | null>(null);

  // Butacas de la sala
  seats = signal<Seat[]>([]);

  // Precios y totales
  selectedSeats = computed(() => this.seats().filter(s => s.selected));
  totalPrice = computed(() => {
    const currentPrice = this.selectedShowtime()?.price ?? 0;
    return this.selectedSeats().length * currentPrice;
  });

  purchaseSuccess = signal<boolean>(false);

  // constructor(
  //   private route: ActivatedRoute,
  //   private moviesService: MoviesService,
  //   private router: Router
  // ) {}

  async ngOnInit() {
    const movieId = Number(this.route.snapshot.paramMap.get('id'));
    if (!movieId) return;
    // const id = Number(this.route.snapshot.paramMap.get('id'));
    // if (id) {
    //   this.moviesService.getMovieById(id).subscribe({
    //     next: (data) => {
    //       if (data) {
    //         this.movie.set(data);
    //         this.generateSchedule(data.duration || 120);
    //         this.generateSeats();
    //       }
    //     }
    //   });
    // }
    // 1. Cargar película
    const movieData = await this.moviesService.getMovieById(movieId);
    if (!movieData) return;

     this.movie.set({
      id: movieData.id,
      title: movieData.titulo,
      duration: movieData.duracion_minutos,
      genre: movieData.formato || 'General',
      rating: movieData.restriccion_edad || 'ATP',
      poster: movieData.imagen_url || '/assets/img/butacas-cine.jpg',
      synopsis: movieData.sinopsis || '',
      trailerUrl: ''
    });

      // 2. Cargar funciones reales de esta película
    await this.cargarFunciones(movieId);
  }

  async cargarFunciones(movieId: number) {
    const { data } = await this.supabase
      .from('funciones')
      .select('id, sala_id, fecha_hora, precio, tipo_funcion, salas(nombre)')
      .eq('pelicula_id', movieId)
      .eq('estado', 'activa');

    if (data && data.length > 0) {
      const duracionMin = this.movie()?.duration || 120;
      const list: ShowTime[] = data.map(f => {
        const inicio = new Date(f.fecha_hora);
        const fin = new Date(inicio.getTime() + duracionMin * 60000);

        const formatPad = (date: Date) =>
          date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return {
          id: f.id,
          salaId: f.sala_id,
          roomName: (f.salas as any)?.nombre || 'Sala 1',
          format: f.tipo_funcion,
          startTime: formatPad(inicio),
          endTime: formatPad(fin),
          price: f.precio
          };
        });

      this.showtimes.set(list);
      await this.selectShowtime(list[0]);
    }
  }

  async selectShowtime(show: ShowTime) {
    this.selectedShowtime.set(show);
    await this.cargarButacasYEntradas(show.id, show.salaId);
  }

  async cargarButacasYEntradas(funcionId: number, salaId: number) {
    // 1. Obtener todas las butacas físicas de la sala
    const { data: butacas } = await this.supabase
      .from('butacas')
      .select('*')
      .eq('sala_id', salaId)
      .order('fila')
      .order('numero');

    // 2. Obtener las entradas ya compradas para esta función específica
    const { data: entradasOcupadas } = await this.supabase
      .from('entradas')
      .select('butaca_id')
      .eq('funcion_id', funcionId)
      .neq('estado', 'cancelada');

    const occupiedIds = new Set((entradasOcupadas || []).map(e => e.butaca_id));

    if (butacas) {
      this.seats.set(
        butacas.map(b => ({
          id: `${b.fila}-${b.numero}`,
          dbId: b.id,
          row: b.fila,
          number: b.numero,
          selected: false,
          occupied: occupiedIds.has(b.id)
        }))
      );
    }
  }

  toggleSeat(seat: Seat) {
    if (seat.occupied) return;
    this.seats.update(list =>
      list.map(s => s.id === seat.id ? { ...s, selected: !s.selected } : s)
    );
  }

  getRows(): string[] {
    return Array.from(new Set(this.seats().map(s => s.row)));
  }

  getLeftSeats(row: string): Seat[] {
    return this.seats().filter(s => s.row === row && s.number <= 2);
  }

  getCenterSeats(row: string): Seat[] {
    return this.seats().filter(s => s.row === row && s.number > 2 && s.number <= 8);
  }

  getRightSeats(row: string): Seat[] {
    return this.seats().filter(s => s.row === row && s.number > 8);
  }

  async confirmBooking() {
    const currentShow = this.selectedShowtime();
    const chosen = this.selectedSeats();
    if (!currentShow || chosen.length === 0) return;

    // Obtener usuario autenticado (o null si es venta pública)
    const user = await this.auth.getCurrentUser();

    // Armar inserts en la tabla entradas
    const inserts = chosen.map(seat => ({
      funcion_id: currentShow.id,
      butaca_id: seat.dbId,
      usuario_id: user ? user.id : null,
      estado: 'validada',
      qr_code: `TICKET-${currentShow.id}-${seat.dbId}-${Date.now()}`
    }));

    const { error } = await this.supabase.from('entradas').insert(inserts);

    if (!error) {
      this.purchaseSuccess.set(true);
    } else {
      console.error('Error al registrar entradas:', error.message);
      alert('Ocurrió un error al procesar la reserva. Intenta nuevamente.');
    }
  }
  // Genera el cronograma respetando: duración + 30 min de limpieza/pausa
  // generateSchedule(durationMin: number) {
  //   const totalSlot = durationMin + 30; 
  //   const startHours = [14, 0]; 

  //   const formats: Array<{ format: '2D' | '3D' | '4D' | '5D'; audio: 'Subtitulada' | 'Doblada'; price: number }> = [
  //     { format: '2D', audio: 'Doblada', price: 4500 },
  //     { format: '3D', audio: 'Subtitulada', price: 6000 },
  //     { format: '4D', audio: 'Subtitulada', price: 8500 },
  //     { format: '5D', audio: 'Doblada', price: 10500 }
  //   ];

  //   let currentMinutes = startHours[0] * 60 + startHours[1];
  //   const generated: ShowTime[] = [];

  //   formats.forEach((cfg, idx) => {
  //     const startH = Math.floor(currentMinutes / 60);
  //     const startM = currentMinutes % 60;
  //     const endTotalMin = currentMinutes + durationMin;
  //     const endH = Math.floor(endTotalMin / 60);
  //     const endM = endTotalMin % 60;

  //     const formatPad = (h: number, m: number) =>
  //       `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  //     generated.push({
  //       id: `show-${idx + 1}`,
  //       roomName: 'Sala Principal',
  //       format: cfg.format,
  //       audio: cfg.audio,
  //       startTime: formatPad(startH, startM),
  //       endTime: formatPad(endH, endM),
  //       price: cfg.price
  //     });

      
  //     currentMinutes += totalSlot;
  //   });

  //   this.showtimes.set(generated);
  //   if (generated.length > 0) {
  //     this.selectedShowtime.set(generated[0]);
  //   }
  // }

  // generateSeats() {
  //   const letters = 'ABCDEFGHIJKLMNOPQRST'.split(''); // 20 filas
  //   const allSeats: Seat[] = [];

  //   letters.forEach(rowLetter => {
  //     for (let n = 1; n <= 28; n++) {
  //       // Simulación de butacas ocupadas al azar
  //       const isOccupied = (rowLetter === 'F' || rowLetter === 'G') && (n === 10 || n === 11 || n === 12);

  //       allSeats.push({
  //         id: `${rowLetter}-${n}`,
  //         row: rowLetter,
  //         number: n,
  //         selected: false,
  //         occupied: isOccupied
  //       });
  //     }
  //   });

  //   this.seats.set(allSeats);
  // }
  // Helpers para obtener columnas por fila en el template
  // getLeftSeats(row: string): Seat[] {
  //   return this.seats().filter(s => s.row === row && s.number >= 1 && s.number <= 4);
  // }

  // getCenterSeats(row: string): Seat[] {
  //   return this.seats().filter(s => s.row === row && s.number >= 5 && s.number <= 24);
  // }

  // getRightSeats(row: string): Seat[] {
  //   return this.seats().filter(s => s.row === row && s.number >= 25 && s.number <= 28);
  // }

  // getRows(): string[] {
  //   return 'ABCDEFGHIJKLMNOPQRST'.split('');
  // }

  // selectShowtime(show: ShowTime) {
  //   this.selectedShowtime.set(show);
    
  //   this.seats.update(list => list.map(s => ({ ...s, selected: false })));
  // }

  // toggleSeat(seat: Seat) {
  //   if (seat.occupied) return;
  //   this.seats.update(list =>
  //     list.map(s => s.id === seat.id ? { ...s, selected: !s.selected } : s)
  //   );
  // }
  // confirmBooking() {
  //   if (this.selectedSeats().length === 0) return;
  //   this.purchaseSuccess.set(true);
  // }
}