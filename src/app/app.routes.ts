import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/role-guard';

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
    path: 'home',
    loadComponent: () => import('./componentes/home/home').then(m => m.Home)
  },
  {
    path: 'movie/:id',
    loadComponent: () => import('./componentes/movie-detail/movie-detail').then(m => m.MovieDetail)
  },
  {
    path: 'reserve/:id',
    loadComponent: () => import('./componentes/reserve/reserve').then(m => m.Reserve)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./componentes/reset-password/reset-password').then(m => m.ResetPassword)
  },
  {
    path: 'mis-peliculas',
    loadComponent: () => import('./componentes/mis-peliculas/mis-peliculas.component').then(m => m.MisPeliculasComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./componentes/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'funciones' // Operador y Admin tienen acceso a funciones
      },
      // Rutas compartidas (Admin y Operador)
      {
        path: 'validar-qr',
        loadComponent: () => import('./componentes/validador-qr/validador-qr.component').then(m => m.ValidadorQrComponent)
      },
      {
        path: 'funciones',
        loadComponent: () => import('./componentes/funciones-admin/funciones-admin.component').then(m => m.FuncionesAdminComponent)
      },
      {
        path: 'candy-bar',
        loadComponent: () => import('./componentes/candy-bar-admin/candy-bar-admin.component').then(m => m.CandyBarAdminComponent)
      },

      // Rutas exclusivas de Administrador
      {
        path: 'peliculas',
        loadComponent: () => import('./componentes/peliculas-admin/peliculas-admin.component').then(m => m.PeliculasAdminComponent),
        canActivate: [adminGuard] // Verifica rol 'admin'
      },
      {
        path: 'salas',
        loadComponent: () => import('./componentes/salas-admin/salas-admin.component').then(m => m.SalasAdminComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./componentes/usuarios-admin/usuarios-admin.component').then(m => m.UsuariosAdminComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'cupones',
        loadComponent: () => import('./componentes/cupones-admin/cupones-admin.component').then(m => m.CuponesAdminComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'fidelizacion',
        loadComponent: () => import('./componentes/fidelizacion-admin/fidelizacion-admin.component').then(m => m.FidelizacionAdminComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'reportes',
        loadComponent: () => import('./componentes/reportes-admin/reportes-admin.component').then(m => m.ReportesAdminComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'log',
        loadComponent: () => import('./componentes/log-actividad/log-actividad.component').then(m => m.LogActividadComponent),
        canActivate: [adminGuard]
      }
    ]
  },
  { path: '**', redirectTo: 'home' }
];