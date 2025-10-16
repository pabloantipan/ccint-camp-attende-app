import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';

/**
 * HTTP Interceptor to add Firebase ID token to requests
 * Automatically adds Authorization header with Bearer token to all API requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);

  // Only add token to API requests (not to external resources)
  if (!req.url.includes('/api/')) {
    return next(req);
  }

  // Get current user and their ID token
  return from(
    auth.currentUser?.getIdToken() ?? Promise.resolve(null)
  ).pipe(
    switchMap((token) => {
      // Clone request and add Authorization header if token exists
      if (token) {
        const clonedRequest = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
        return next(clonedRequest);
      }

      // No token available, proceed without Authorization header
      return next(req);
    })
  );
};
