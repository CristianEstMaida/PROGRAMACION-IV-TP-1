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
    // {
    //     path: 'admin',
    //     component: AdminDashboardComponent,
    //     children: [
    //     { path: 'peliculas', component: PeliculasAdminComponent },
    //     { path: 'funciones', component: FuncionesAdminComponent },
    //     { path: 'salas', component: SalasAdminComponent },
    //     { path: 'usuarios', component: UsuariosAdminComponent },
    //     { path: 'candy-bar', component: CandyBarAdminComponent },
    //     { path: 'cupones', component: CuponesAdminComponent },
    //     { path: 'fidelizacion', component: FidelizacionAdminComponent },
    //     { path: 'reportes', component: ReportesAdminComponent },
    //     { path: 'log', component: LogActividadComponent },
    //     ],
    // },
    // 🔐 Admin protegido con guard
    {
        path: 'admin',
        loadComponent: () =>
        import('./componentes/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard),
        // canMatch: [authGuard],
        children: [
        {
            path: '',
            pathMatch: 'full',
            redirectTo: 'peliculas' // O dejá un componente de inicio/resumen
        },
        {
            path: 'peliculas',
            loadComponent: () =>
            import('./componentes/peliculas-admin/peliculas-admin.component').then(m => m.PeliculasAdminComponent),
        },
        {
            path: 'funciones',
            loadComponent: () =>
            import('./componentes/funciones-admin/funciones-admin.component').then(m => m.FuncionesAdminComponent),
        },
        {
            path: 'salas',
            loadComponent: () =>
            import('./componentes/salas-admin/salas-admin.component').then(m => m.SalasAdminComponent),
        },
        {
            path: 'usuarios',
            loadComponent: () =>
            import('./componentes/usuarios-admin/usuarios-admin.component').then(m => m.UsuariosAdminComponent),
        },
        {
            path: 'candy-bar',
            loadComponent: () =>
            import('./componentes/candy-bar-admin/candy-bar-admin.component').then(m => m.CandyBarAdminComponent),
        },
        {
            path: 'cupones',
            loadComponent: () =>
            import('./componentes/cupones-admin/cupones-admin.component').then(m => m.CuponesAdminComponent),
        },
        {
            path: 'fidelizacion',
            loadComponent: () =>
            import('./componentes/fidelizacion-admin/fidelizacion-admin.component').then(m => m.FidelizacionAdminComponent),
        },
        {
            path: 'reportes',
            loadComponent: () =>
            import('./componentes/reportes-admin/reportes-admin.component').then(m => m.ReportesAdminComponent),
        },
        {
            path: 'log',
            loadComponent: () =>
            import('./componentes/log-actividad/log-actividad.component').then(m => m.LogActividadComponent),
        },
        ],
    },
    { path: '**', redirectTo: 'home' }
];
