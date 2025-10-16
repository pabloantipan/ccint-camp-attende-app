import { Route } from '@angular/router';

export const registryRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./registry.page').then(c => c.RegistryPage),
    children: [
      {
        path: '',
        redirectTo: 'personal-data',
        pathMatch: 'full',
      },
      {
        path: 'personal-data',
        loadComponent: () => import('./components/personal-data-step/personal-data-step.component').then(c => c.PersonalDataStepComponent),
      },
      {
        path: 'medical-info',
        loadComponent: () => import('./components/medical-info-step/medical-info-step.component').then(c => c.MedicalInfoStepComponent),
      },
    ],
  },
];
