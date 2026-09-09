import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Movie, MovieDetailModel, UpcomingMovie } from '../models/movie';
import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';   // 👈 este import es el que falta
@Injectable({ providedIn: 'root' })
export class MoviesService {

  constructor(private http: HttpClient) {}

    // Devuelve un Observable, no void
  getMovieById(id: number): Observable<MovieDetailModel | undefined> {
    return this.http.get<MovieDetailModel[]>('assets/movies.json').pipe(
      map(movies => movies.find(m => m.id === id))
    );
  }

  getAllMovies(): Observable<MovieDetailModel[]> {
    return this.http.get<MovieDetailModel[]>('assets/movies.json');
  }



//   getTopMovies() {
//     return this.http.get<Movie[]>('/api/top-movies'); // tu endpoint
//   }

//   getUpcomingMovies() {
//     return this.http.get<UpcomingMovie[]>('/api/upcoming-movies');
//   }


//   getRecommendations(userId: string) {
//     return this.http.get<Movie[]>(`/api/recommendations/${userId}`);
//   }
}
