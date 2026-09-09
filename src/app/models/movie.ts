export interface Movie {
  id: number;
  title: string;
  rating: string;
  poster: string;
}

export interface UpcomingMovie {
  id: number;
  title: string;
  date: string;
  poster: string;
}

export interface MovieDetailModel {
  id: number;
  title: string;
  rating: string;
  poster: string;
  genre: string;
  duration: number;
  synopsis: string;
  trailerUrl: string;
}
