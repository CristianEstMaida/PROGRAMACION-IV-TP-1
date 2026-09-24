import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoviesService, PeliculaDB } from '../../services/movies.service';

@Component({
  selector: 'app-peliculas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './peliculas-admin.component.html',
  styleUrls: ['./peliculas-admin.component.css']
})
export class PeliculasAdminComponent implements OnInit {
  private moviesService = inject(MoviesService);

  // Estados reactivos con Signals
  peliculas = signal<PeliculaDB[]>([]);
  filtro = signal<string>('');
  cargando = signal<boolean>(true);

  // Filtro reactivo computado
  peliculasFiltradas = computed(() => {
    const query = this.filtro().toLowerCase().trim();
    if (!query) return this.peliculas();
    return this.peliculas().filter(p => p.titulo.toLowerCase().includes(query));
  });

  async ngOnInit() {
    await this.cargarPeliculas();
  }

  async cargarPeliculas() {
    this.cargando.set(true);
    const data = await this.moviesService.getPeliculasAdmin();
    this.peliculas.set(data);
    this.cargando.set(false);
  }

  async agregarPelicula() {
    const nuevaPelicula = {
      titulo: 'Nueva Película Estreno',
      duracion_minutos: 120,
      formato: '2D',
      restriccion_edad: '+13',
      idioma: 'Castellano',
      sinopsis: 'Sinopsis de prueba',
      imagen_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500'
    };

    const creada = await this.moviesService.agregarPelicula(nuevaPelicula);
    if (creada) {
      // Se agrega al inicio de la lista reactiva
      this.peliculas.update(lista => [creada, ...lista]);
    } else {
      alert('Error al guardar la película en Supabase');
    }
  }

  async eliminarPelicula(id: number) {
    const confirmar = confirm('¿Estás seguro de eliminar esta película?');
    if (!confirmar) return;

    const ok = await this.moviesService.eliminarPelicula(id);
    if (ok) {
      this.peliculas.update(lista => lista.filter(p => p.id !== id));
    } else {
      alert('No se pudo eliminar la película (verificá si ya tiene funciones asociadas).');
    }
  }
}