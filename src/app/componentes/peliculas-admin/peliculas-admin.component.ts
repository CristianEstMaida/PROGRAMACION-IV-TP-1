import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Pelicula {
  id: number;
  titulo: string;
  genero: string;
  idioma: string;
  formato: string;
  duracion: number;
  restriccionEdad: string;
}

@Component({
  selector: 'app-peliculas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './peliculas-admin.component.html',
  styleUrls: ['./peliculas-admin.component.css']
})
export class PeliculasAdminComponent {
  peliculas: Pelicula[] = [
    { id: 1, titulo: 'Avatar 2', genero: 'Acción', idioma: 'Castellano', formato: '3D', duracion: 180, restriccionEdad: '+13' },
    { id: 2, titulo: 'Titanic', genero: 'Romance', idioma: 'Castellano', formato: '2D', duracion: 195, restriccionEdad: 'ATP' },
    { id: 3, titulo: 'Matrix', genero: 'Sci-Fi', idioma: 'Subtitulado', formato: '2D', duracion: 136, restriccionEdad: '+16' }
  ];

  filtro: string = '';

  get peliculasFiltradas() {
    return this.peliculas.filter(p =>
      p.titulo.toLowerCase().includes(this.filtro.toLowerCase())
    );
  }

  eliminarPelicula(id: number) {
    this.peliculas = this.peliculas.filter(p => p.id !== id);
  }

  agregarPelicula() {
    const nueva: Pelicula = {
      id: this.peliculas.length + 1,
      titulo: 'Nueva Película',
      genero: 'Acción',
      idioma: 'Castellano',
      formato: '2D',
      duracion: 120,
      restriccionEdad: '+13'
    };
    this.peliculas.push(nueva);
  }
}
