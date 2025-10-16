import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('../core/wrapper/wrapper.routes').then(m => m.wrapperRoutes),
    canActivate: [],
  },
  {
    path: 'login',
    loadChildren: () => import('../core/login/login.routes').then(r => r.loginRoutes),
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];


