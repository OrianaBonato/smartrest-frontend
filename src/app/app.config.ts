import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { rolInterceptor } from './core/interceptors/rol.interceptor';

// Configuracion global de la aplicacion.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Zona desactivada: los componentes deben marcar cambios de forma manual.
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // Interceptor para enviar el rol en cada request.
    provideHttpClient(withInterceptors([rolInterceptor]))
  ]
};
