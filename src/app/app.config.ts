import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { routes } from './app.routes';
import { authInterceptor } from '@shared/http/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideFirebaseApp(() => initializeApp({
      projectId: "ccint-camp-registry-app-dev",
      appId: "1:838513387069:web:d54d36ed1701eb38a76c54",
      storageBucket: "ccint-camp-registry-app-dev.firebasestorage.app",
      apiKey: "AIzaSyC1MRS9s5aBzQbnHWjU5RHBf3pp86Q6AQc",
      authDomain: "ccint-camp-registry-app-dev.firebaseapp.com",
      messagingSenderId: "838513387069",
      measurementId: "G-9FJHSFRH4W",
    }))
    , provideAuth(() => getAuth())
  ]
};
