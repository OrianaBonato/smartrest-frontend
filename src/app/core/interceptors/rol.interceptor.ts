import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

// Agrega el header X-ROL a todas las peticiones si existe rol.
export const rolInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const rol = auth.getRol();
  if (!rol) {
    return next(req);
  }
  const cloned = req.clone({
    setHeaders: {
      'X-ROL': rol,
    },
  });
  return next(cloned);
};
