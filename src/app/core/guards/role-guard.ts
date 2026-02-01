import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const RoleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  console.log('hi')
  const rol = (auth.getRol() || '').toUpperCase();
  if (!rol) {
    router.navigateByUrl('/login');
    return false;
  }
  
  // ADMIN puede entrar a todo
  if (rol === 'ADMIN') return true;

  // Roles permitidos definidos en la ruta
  const allowed: string[] = (route.data?.['roles'] ?? []).map((r: string) => String(r).toUpperCase());

  // Si no se definieron roles, bloqueamos por seguridad
  if (!allowed.length) {
    router.navigateByUrl('/login');
    return false;
  }

  // Si su rol está permitido, entra
  if (allowed.includes(rol)) return true;

  // Si no, lo mandamos a su home
  router.navigateByUrl(homeByRol(rol));
  return false;
};

function homeByRol(rol: string): string {
  switch (rol) {
    case 'SALA': return '/sala';
    case 'COCINA': return '/cocina';
    case 'BARRA': return '/barra';
    case 'ADMIN': return '/admin';
    default: return '/login';
  }
}