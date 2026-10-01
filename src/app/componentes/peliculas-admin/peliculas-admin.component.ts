import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoviesService } from '../../services/movies.service';

@Component({
  selector: 'app-peliculas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './peliculas-admin.component.html',
  styleUrls: ['./peliculas-admin.component.css']
})
export class PeliculasAdminComponent implements OnInit {
  private moviesService = inject(MoviesService);

  peliculas = signal<any[]>([]);
  generos = signal<{ id: number; nombre: string }[]>([]);
  filtro = signal<string>('');
  cargando = signal<boolean>(true);
  mostrarModal = signal<boolean>(false);

  // Formulario de nueva película
  nuevoTitulo = signal<string>('');
  nuevaDuracion = signal<number>(120);
  nuevoIdioma = signal<string>('Castellano');
  nuevaRestriccion = signal<string>('ATP');
  nuevaSinopsis = signal<string>('');
  nuevaImagen = signal<string>('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500');
  generosSeleccionados = signal<number[]>([]);

  peliculasFiltradas = computed(() => {
    const query = this.filtro().toLowerCase().trim();
    if (!query) return this.peliculas();
    return this.peliculas().filter(p => p.titulo.toLowerCase().includes(query));
  });

  async ngOnInit() {
    await Promise.all([
      this.cargarPeliculas(),
      this.cargarGeneros()
    ]);
  }

  async cargarGeneros() {
    const data = await this.moviesService.getGeneros();
    this.generos.set(data);
  }

  async cargarPeliculas() {
    this.cargando.set(true);
    const data = await this.moviesService.getPeliculasAdmin();
    this.peliculas.set(data);
    this.cargando.set(false);
  }

  toggleGenero(generoId: number) {
    this.generosSeleccionados.update(ids => 
      ids.includes(generoId) ? ids.filter(id => id !== generoId) : [...ids, generoId]
    );
  }

  abrirModal() {
    this.nuevoTitulo.set('');
    this.nuevaDuracion.set(120);
    this.generosSeleccionados.set([]);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
  }

  async guardarPelicula() {
    if (!this.nuevoTitulo().trim()) {
      alert('Ingresá el título de la película');
      return;
    }

    const duracion = Number(this.nuevaDuracion());

    // Rango razonable: entre 45 minutos y 300 minutos (5 horas)
    if (isNaN(duracion) || duracion < 45 || duracion > 300) {
      alert('La duración debe estar dentro de un rango razonable (entre 45 y 300 minutos).');
      return;
    }

    const nueva = {
      titulo: this.nuevoTitulo().trim(),
      duracion_minutos: duracion,
      formato: '2D', // Formato inicial de compatibilidad
      restriccion_edad: this.nuevaRestriccion(),
      idioma: this.nuevoIdioma(),
      sinopsis: this.nuevaSinopsis().trim() || 'Sin sinopsis registrada',
      imagen_url: this.nuevaImagen().trim()
    };

    const exito = await this.moviesService.agregarPeliculaConGeneros(
      nueva, 
      this.generosSeleccionados()
    );

    if (exito) {
      await this.cargarPeliculas();
      this.cerrarModal();
    } else {
      alert('Error al guardar la película en Supabase.');
    }
  }

  async eliminarPelicula(id: number) {
    const confirmar = confirm('¿Eliminar esta película? Si tiene funciones o ventas asociadas, Supabase rechazará el borrado por seguridad.');
    if (!confirmar) return;

    const ok = await this.moviesService.eliminarPelicula(id);
    if (ok) {
      this.peliculas.update(lista => lista.filter(p => p.id !== id));
    } else {
      alert('No se pudo eliminar la película. Ya cuenta con funciones asignadas o historial de entradas.');
    }
  }

  // En componentes/peliculas-admin/peliculas-admin.component.ts

  async toggleEstadoPelicula(pelicula: any) {
    const accion = pelicula.activa ? 'desactivar' : 'habilitar';
    const confirmar = confirm(`¿Estás seguro de que querés ${accion} "${pelicula.titulo}"?`);
    if (!confirmar) return;

    // Llama al método que definiste en el service
    const exito = await this.moviesService.toggleEstadoPelicula(pelicula.id, pelicula.activa);

    if (exito) {
      // Actualiza la señal reactiva en la vista
      this.peliculas.update(lista =>
        lista.map(p => p.id === pelicula.id ? { ...p, activa: !p.activa } : p)
      );
    } else {
      alert('No se pudo actualizar el estado de la película.');
    }
  }

  extraerNombresGeneros(p: any): string {
    const lista = (p.pelicula_genero || [])
      .map((pg: any) => pg.generos?.nombre)
      .filter(Boolean);
    return lista.length > 0 ? lista.join(', ') : 'Sin género';
  }
}