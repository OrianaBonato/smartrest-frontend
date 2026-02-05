# SmartRest Frontend

Frontend del sistema SmartRest. Aplicacion Angular para sala, cocina, barra y admin.

## Tecnologias
- Angular 20
- Angular Material
- RxJS
- TypeScript

## Requisitos
- Node.js + npm
- Backend corriendo en `http://localhost:8080`

## Instalacion
```bash
npm install
```

## Ejecucion en desarrollo
```bash
npm run start
```
Este comando usa proxy hacia `/api` para el backend (ver `proxy.conf.json`).

Aplicacion disponible en `http://localhost:4200`.

## Build
```bash
npm run build
```

## Rutas principales
- `/login`
- `/sala`
- `/sala/mesa/:id`
- `/cocina`
- `/barra`
- `/admin`

## Roles (MVP)
La app usa el rol guardado tras el login para permitir acceso a rutas:
- `SALA`
- `COCINA`
- `BARRA`
- `ADMIN`

El header `X-ROL` se envia automaticamente en las peticiones HTTP.

## Estructura del frontend (resumen)
- `src/app/core`: autenticacion, guards e interceptor de rol.
- `src/app/features`: vistas principales por rol.
- `src/app/services`: acceso a la API del backend.
- `src/app/shared`: componentes reutilizables (colas, tablas, etc).

## Notas MVP
- La sesion se guarda en `localStorage`.
- No hay JWT ni refresh tokens.
- No hay paginacion server-side.
