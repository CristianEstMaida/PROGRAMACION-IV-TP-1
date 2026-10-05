import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoviesService } from '../../services/movies.service';
import { SupabaseService } from '../../services/supabase.service';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-peliculas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './peliculas-admin.component.html',
  styleUrls: ['./peliculas-admin.component.css']
})
export class PeliculasAdminComponent implements OnInit {
  private moviesService = inject(MoviesService);
  private supabase = inject(SupabaseService).client;
  private auth = inject(Auth);

  peliculas = signal<any[]>([]);
  generos = signal<{ id: number; nombre: string }[]>([]);
  filtro = signal<string>('');
  cargando = signal<boolean>(true);
  mostrarModal = signal<boolean>(false);

// Control de modo: alta vs edición
  modoEdicion = signal<boolean>(false);
  peliculaIdEnEdicion = signal<number | null>(null);

  // Formulario de nueva película
  nuevoTitulo = signal<string>('');
  nuevaDuracion = signal<number>(120);
  nuevoIdioma = signal<string>('Castellano');
  nuevaRestriccion = signal<string>('ATP');
  nuevaSinopsis = signal<string>('');
  nuevaImagen = signal<string>('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500');
  generosSeleccionados = signal<number[]>([]);

  // En peliculas-admin.component.ts
  nuevaFechaEstreno = signal<string>('');
  nuevoDescuentoPreventa = signal<number>(20); // 20% por defecto

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
    this.modoEdicion.set(false);
    this.peliculaIdEnEdicion.set(null);
    this.nuevoTitulo.set('');
    this.nuevaDuracion.set(120);
    this.nuevaSinopsis.set('');
    this.generosSeleccionados.set([]);
    this.mostrarModal.set(true);
  }



  cerrarModal() {
    this.mostrarModal.set(false);
  }

  abrirModalEdicion(pelicula: any) {
    this.modoEdicion.set(true);
    this.peliculaIdEnEdicion.set(pelicula.id);
    this.nuevoTitulo.set(pelicula.titulo || '');
    this.nuevaDuracion.set(pelicula.duracion_minutos || 120);
    this.nuevoIdioma.set(pelicula.idioma || 'Castellano');
    this.nuevaRestriccion.set(pelicula.restriccion_edad || 'ATP');
    this.nuevaSinopsis.set(pelicula.sinopsis || '');
    this.nuevaImagen.set(pelicula.imagen_url || '');
    this.nuevaFechaEstreno.set(pelicula.fecha_estreno || '');
    this.nuevoDescuentoPreventa.set(pelicula.descuento_preventa ?? 20);

    // Extraer IDs de los géneros vinculados actualmente
    const idsVinculados = (pelicula.pelicula_genero || [])
      .map((pg: any) => pg.generos?.id)
      .filter((id: any) => typeof id === 'number');

    this.generosSeleccionados.set(idsVinculados);
    this.mostrarModal.set(true);
  }

  async guardarPelicula() {
    const titulo = this.nuevoTitulo().trim();
    if (!titulo) {
      alert('Ingresá el título de la película');
      return;
    }

    const duracion = Number(this.nuevaDuracion());
    if (isNaN(duracion) || duracion < 45 || duracion > 300) {
      alert('La duración debe estar dentro de un rango razonable (entre 45 y 300 minutos).');
      return;
    }

    const datos = {
      titulo: titulo,
      duracion_minutos: duracion,
      restriccion_edad: this.nuevaRestriccion(),
      idioma: this.nuevoIdioma(),
      sinopsis: this.nuevaSinopsis().trim() || 'Sin sinopsis registrada',
      imagen_url: this.nuevaImagen().trim(),
      fecha_estreno: this.nuevaFechaEstreno() || null,
      descuento_preventa: this.nuevoDescuentoPreventa() || 0
    };

    const user = await this.auth.getCurrentUser();
    const operadorEmail = user?.email || 'admin@cinenova.com';

    if (this.modoEdicion()) {
      const id = this.peliculaIdEnEdicion();
      if (!id) return;

      const exito = await this.moviesService.actualizarPeliculaConGeneros(
        id,
        datos,
        this.generosSeleccionados()
      );

      if (exito) {
        await this.supabase.from('logs_actividad').insert({
          usuario: operadorEmail,
          accion: 'Modificó Película',
          entidad_afectada: 'peliculas',
          detalle: `Película #${id}: ${titulo} (${duracion} min)`
        });

        await this.cargarPeliculas();
        this.cerrarModal();
      } else {
        alert('Error al actualizar la película en Supabase.');
      }
    }else {
      const nueva = {
        ...datos,
        formato: '2D',
        activa: true
      };

      const exito = await this.moviesService.agregarPeliculaConGeneros(
        nueva,
        this.generosSeleccionados()
      );

      if (exito) {
        await this.supabase.from('logs_actividad').insert({
          usuario: operadorEmail,
          accion: 'Alta de Película',
          entidad_afectada: 'peliculas',
          detalle: `Título: ${titulo} (${duracion} min)`
        });

        await this.cargarPeliculas();
        this.cerrarModal();
      } else {
        alert('Error al guardar la película en Supabase.');
      }
    }
  }

  async toggleEstadoPelicula(pelicula: any) {
    const accion = pelicula.activa ? 'desactivar' : 'habilitar';
    const confirmar = confirm(`¿Estás seguro de que querés ${accion} "${pelicula.titulo}"?`);
    if (!confirmar) return;

    const exito = await this.moviesService.toggleEstadoPelicula(pelicula.id, pelicula.activa);

    if (exito) {
      this.peliculas.update(lista =>
        lista.map(p => p.id === pelicula.id ? { ...p, activa: !p.activa } : p)
      );

      // Auditoría en logs_actividad
      const user = await this.auth.getCurrentUser();
      await this.supabase.from('logs_actividad').insert({
        usuario: user?.email || 'admin@cinenova.com',
        accion: pelicula.activa ? 'Desactivó Película' : 'Habilitó Película',
        entidad_afectada: 'peliculas',
        detalle: `Película: ${pelicula.titulo} (ID: ${pelicula.id})`
      });
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