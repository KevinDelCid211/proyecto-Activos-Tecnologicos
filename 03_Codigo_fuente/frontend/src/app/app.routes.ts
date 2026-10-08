import { Routes } from '@angular/router';
import { authGuard }  from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'activos',
        loadComponent: () => import('./features/activos/list/activos-list.component').then(m => m.ActivosListComponent)
      },
      {
        path: 'activos/nuevo',
        loadComponent: () => import('./features/activos/form/activo-form.component').then(m => m.ActivoFormComponent)
      },
      {
        path: 'activos/:id',
        loadComponent: () => import('./features/activos/detail/activo-detail.component').then(m => m.ActivoDetailComponent)
      },
      {
        path: 'activos/:id/editar',
        loadComponent: () => import('./features/activos/form/activo-form.component').then(m => m.ActivoFormComponent)
      },
      {
        path: 'responsables',
        loadComponent: () => import('./features/responsables/list/responsables-list.component').then(m => m.ResponsablesListComponent)
      },
      {
        path: 'historial',
        loadComponent: () => import('./features/historial/historial.component').then(m => m.HistorialComponent)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./features/reportes/reportes.component').then(m => m.ReportesComponent)
      },
    ]
  },
  { path: '**', redirectTo: '' }
];
