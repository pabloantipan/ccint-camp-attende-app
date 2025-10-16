import { Route } from '@angular/router';


export const loginRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./login.page').then(m => m.LoginPage),
    children: [
      {
        path: '',
        redirectTo: 'sign-in',
        pathMatch: 'full',
      },
      {
        path: 'reset',
        loadComponent: () => import('./reset/reset.component').then(m => m.ResetComponent),
      },
      {
        path: 'sign-in',
        loadComponent: () => import('./sign-in/sign-in.component').then(m => m.SignInComponent),
        // canActivate: [],
      },
      {
        path: 'sign-up',
        loadComponent: () => import('./sign-up/sign-up.component').then(m => m.SignUpComponent),
      },
      {
        path: '**',
        redirectTo: 'sign-in',
      },
    ],
  },
];
