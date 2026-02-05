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

## Manual de usuario (base)
Este manual describe los flujos actuales del MVP. El objetivo es explicar como usar la app en una demo.

### 1. Inicio de sesion
1. Entra en `http://localhost:4200`.
2. Escribe email y password.
3. Pulsa "Login".
4. La app te redirige segun tu rol.

Roles disponibles:
- SALA
- COCINA
- BARRA
- ADMIN

### 2. Flujo de sala (SALA)
Objetivo: abrir un servicio, enviar comandas y cerrar la mesa.

1. Entra en la vista de sala.
2. Veras la lista de mesas con su estado.
3. Selecciona una mesa libre.
4. En el formulario, indica numero de comensales y observaciones.
5. Pulsa "Empezar servicio".
6. En la seccion Productos, pulsa sobre los productos para anadirlos al carrito.
7. En Comandas, ajusta cantidades si hace falta.
8. Pulsa "Enviar comandas".
9. En "Pendientes" veras las lineas creadas.
10. Cuando el servicio termina, pulsa "Cerrar servicio" y confirma.

### 3. Flujo de cocina (COCINA)
Objetivo: gestionar la cola de cocina.

1. Entra en la vista de cocina.
2. Se muestran dos secciones: Pendientes y Listas.
3. En Pendientes, pulsa "Preparar" para pasar a EN_PREPARACION.
4. Pulsa "Listo" para pasar a LISTO.
5. Si hace falta, usa "Cancelar".
6. Usa el boton "Actualizar" para refrescar la cola.

### 4. Flujo de barra (BARRA)
Objetivo: gestionar la cola de barra.

1. Entra en la vista de barra.
2. El flujo es igual que cocina, pero solo muestra productos de barra.
3. Cambia estados con "Preparar" y "Listo".
4. Usa "Cancelar" cuando proceda.

### 5. Flujo de admin (ADMIN)
Objetivo: acceso a la vista principal de admin.

1. Entra en la vista de admin.
2. Esta vista es basica en el MVP, sirve como placeholder.

## Plan de pruebas manuales (base)
Estas pruebas se han realizado manualmente y funcionan OK en el estado actual del proyecto.

### Prueba 1: Login y redireccion por rol
Pasos:
1. Iniciar sesion con usuario SALA.
2. Comprobar que redirige a `/sala`.
3. Repetir con COCINA, BARRA y ADMIN.
Resultado esperado:
- La ruta coincide con el rol.
Justificacion:
- Probado en local, funciona correctamente.

### Prueba 2: Abrir servicio en sala
Pasos:
1. Entrar como SALA.
2. Elegir mesa libre.
3. Rellenar formulario y pulsar "Empezar servicio".
Resultado esperado:
- La mesa cambia a OCUPADA y aparece el resumen de servicio.
Justificacion:
- Probado en local, el servicio se abre y se muestra.

### Prueba 3: Enviar comandas desde sala
Pasos:
1. Con servicio abierto, anadir productos al carrito.
2. Pulsar "Enviar comandas".
Resultado esperado:
- El carrito se vacia y aparecen lineas en Pendientes.
Justificacion:
- Probado en local, las comandas se crean y aparecen.

### Prueba 4: Cola de cocina
Pasos:
1. Entrar como COCINA.
2. Ver una linea pendiente.
3. Pulsar "Preparar" y luego "Listo".
Resultado esperado:
- Cambia el estado de la linea y pasa a Listas.
Justificacion:
- Probado en local, el flujo funciona.

### Prueba 5: Cola de barra
Pasos:
1. Entrar como BARRA.
2. Ver una linea pendiente.
3. Pulsar "Preparar" y luego "Listo".
Resultado esperado:
- Cambia el estado y pasa a Listas.
Justificacion:
- Probado en local, el flujo funciona.

### Prueba 6: Cancelar linea
Pasos:
1. En cocina o barra, pulsar "Cancelar" sobre una linea.
Resultado esperado:
- La linea queda en estado CANCELADO y aparece en Canceladas.
Justificacion:
- Probado en local, el estado se actualiza y se muestra.

### Prueba 7: Cerrar servicio
Pasos:
1. Entrar como SALA con servicio abierto.
2. Pulsar "Cerrar servicio" y confirmar.
Resultado esperado:
- El servicio se cierra y la mesa vuelve a LIBRE.
Justificacion:
- Probado en local, el cierre funciona.
