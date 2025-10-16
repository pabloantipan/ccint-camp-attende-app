import { Route } from '@angular/router';

export const checkInRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./check-in.page').then(c => c.CheckInPage),
    // children: [
    //   {
    //     path: '',
    //     redirectTo: 'payment-verification',
    //     pathMatch: 'full',
    //   },
    //   {
    //     path: 'payment-verification',
    //     loadComponent: () => import('./components/payment-verification-step/payment-verification-step.component').then(c => c.PaymentVerificationStepComponent),
    //   },
    //   {
    //     path: 'parent-authorization',
    //     loadComponent: () => import('./components/parent-authorization-step/parent-authorization-step.component').then(c => c.ParentAuthorizationStepComponent),
    //   },
    //   {
    //     path: 'arrival-confirmation',
    //     loadComponent: () => import('./components/arrival-confirmation-step/arrival-confirmation-step.component').then(c => c.ArrivalConfirmationStepComponent),
    //   },
    //   {
    //     path: 'materials-delivery',
    //     loadComponent: () => import('./components/materials-delivery-step/materials-delivery-step.component').then(c => c.MaterialsDeliveryStepComponent),
    //   },
    // ],
  },
];
