import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

// Evita mostrar login si el usuario ya esta autenticado.
export const AlreadyLoggedGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (route?.routeConfig?.path === 'login' && !auth.isLoggedIn()) return true;
  router.navigateByUrl('/admin');
  return false;
};
