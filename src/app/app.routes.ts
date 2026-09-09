import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () => import('./componentes/login/login').then(m => m.Login)
    },
    {
        path: 'register',
        loadComponent: () => import('./componentes/register/register').then(m => m.Register)
    },
    { path: 'movie/:id', loadComponent: () => import('./componentes/movie-detail/movie-detail').then(m => m.MovieDetail) },
    { path: 'reserve/:id', loadComponent: () => import('./componentes/reserve/reserve').then(m => m.Reserve) },
    {
        path: 'home',
        loadComponent: () => import('./componentes/home/home').then(m => m.Home)
    },
    {
        path: 'reset-password',
        loadComponent: () => import('./componentes/reset-password/reset-password').then(m => m.ResetPassword)
    },
    { path: '**', redirectTo: 'home' }
];
