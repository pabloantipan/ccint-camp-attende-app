import { Route } from '@angular/router';
import { authGuard } from '../guards/auth.guard';

export const wrapperRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./wrapper').then(c => c.Wrapper),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        canActivate: [authGuard],
        loadComponent: () => import('../pages/home/home.page').then(r => r.HomePage),
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('../pages/user-profile/user-profile.page').then(r => r.UserProfilePage),
      },
      {
        path: 'registry',
        canActivate: [authGuard],
        loadChildren: () => import('../pages/registry/registry.routes').then(r => r.registryRoutes),
      },
      {
        path: 'checkin',
        canActivate: [authGuard],
        loadComponent: () => import('../pages/check-in/check-in.page').then(r => r.CheckInPage),
      },
    ],
  },
];
