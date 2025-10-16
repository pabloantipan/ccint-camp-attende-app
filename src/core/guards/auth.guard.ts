import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    map(user => {
      if (user) {
        return true;
      }

      // Redirect to login if not authenticated
      return router.createUrlTree(['/login/sign-in']);
    })
  );
};
