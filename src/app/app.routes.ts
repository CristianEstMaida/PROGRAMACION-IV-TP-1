import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';
export const routes: Routes = [
    {
        path: '',
        redirectTo: 'home',
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
    { 
        path: 'movie/:id',
        loadComponent: () => import('./componentes/movie-detail/movie-detail').then(m => m.MovieDetail),
        canMatch: [authGuard]
    },
    // {
    //     path: 'movies/add',
    //     canMatch: [roleGuard],
    //     data: { role: 'user' } // solo usuarios comunes
    // },
    { 
        path: 'reserve/:id',
        loadComponent: () => import('./componentes/reserve/reserve').then(m => m.Reserve),
        canMatch: [authGuard]
    },
    {
        path: 'home',
        loadComponent: () => import('./componentes/home/home').then(m => m.Home),
        //canMatch: [authGuard]
    },
    {
        path: 'reset-password',
        loadComponent: () => import('./componentes/reset-password/reset-password').then(m => m.ResetPassword)
    },
    { path: '**', redirectTo: 'home' }
];
