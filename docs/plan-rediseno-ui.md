# Plan de desarrollo — Rediseño de UI (v2.0)

Documento de trabajo para integrar el rediseño de Claude Design en la app Angular
existente. No es un mockup aparte: se reescriben las plantillas y estilos de los
componentes actuales, manteniendo los servicios y el backend tal y como están.

---

## 1. Objetivo y alcance

Llevar los cuatro artboards (`Login`, `Cocina`, `Barra`, `Sala`) a componentes
Angular reales, conectados a los servicios que ya existen.

**Sin cambios en `smartrest-backend`.** Todo lo que se pinte sale de los endpoints
actuales o se deriva en cliente a partir de ellos.

Fuera de alcance: `admin-home` (hoy es un stub, `<h2>ADMIN ✅</h2>`, y no tiene
artboard).

---

## 2. Estado de partida

Lo que ya está hecho y **no** hay que rehacer:

- `shared/comandas-cola` ya es un componente único parametrizado por
  `@Input({required:true}) destino: 'COCINA'|'BARRA'`. `cocina-home` y `barra-home`
  ya son wrappers de una línea. No hace falta ningún refactor de extracción.
- Ya persisten contra la API: cargar cola, cambiar estado, cancelar, abrir servicio,
  cerrar servicio, crear líneas de comanda, listar productos y mesas.
- `cambiarEstado()`, `cancelarLinea()`, `cargarCola()`, `agregarAlCarrito()`,
  `quitarDelCarrito()`, `totalItems()`, `enviarComandas()`, `abrirServicio()`,
  `cerrarServicio()` y `mesaOnClick()` existen y funcionan. El trabajo es de
  plantilla y estilos, no de lógica nueva.

Contexto técnico a respetar:

- Angular 20 standalone, **zoneless** (`provideZonelessChangeDetection()`). Los
  componentes actuales usan `ChangeDetectorRef.markForCheck()` a mano; se mantiene
  ese patrón por consistencia.
- Autenticación: **no hay JWT**. `AuthService` guarda `{idUsuario, nombre, rol}` en
  `localStorage` y `rolInterceptor` manda un header `X-ROL` en cada petición.
- Rama base `master`. Commits en español.

---

## 3. Decisiones tomadas

| Decisión | Motivo |
|---|---|
| Cero cambios en backend | Enfoque en integrar el rediseño limpio; iterar después |
| Componentes propios + Material puntual | El diseño no es Material (radios 18-34px, botones 72-88px). Material se queda en el login (`mat-form-field`) y donde ya aporte |
| Responsive: móvil/tablet primero, breakpoints a escritorio | Los artboards son 820×1180 |
| **Sin header dentro de los componentes** | El `mat-toolbar` global de `app.html` ya usa `#10432a`, el mismo verde del diseño. Dos headers apilados sería un bug visual |
| Estilos compartidos como clases globales, sin subir el budget | Menor CSS total que duplicar los mismos estilos en cada componente. Ver §4 |
| Polling 12s + botón manual en las colas | Decisión de producto: cocina no puede depender de pulsar un botón |
| Intro del login siempre, como la maqueta | Fidelidad al diseño |
| Antes/después vía tag de git + capturas | Un toggle en vivo mostraría la v1 contaminada por los estilos globales nuevos, que no es el "antes" real |

**Consecuencia del header:** el botón "Actualizar", que en los artboards de Cocina y
Barra vive dentro del header, pasa junto al título de la pantalla — que es
exactamente donde lo coloca el artboard de Sala. Las tres colas quedan coherentes.
El chip de rol (`COCINA`/`BARRA`/`SALA`) no se implementa.

---

## 4. Sistema visual

### Tokens — `src/app/styles/_tokens.scss`

Como CSS custom properties en `:root`: se compilan una vez y no se duplican.

```
Marca        --sr-verde #185638 · --sr-verde-oscuro #0E3A24 · --sr-header #10432A
Fondos       --sr-fondo #F7F9F5 · --sr-fondo-alt #EDEFE9 · --sr-blanco #fff
Texto        --sr-texto #121A15 · --sr-texto-suave #5C6B60 · --sr-texto-tenue #8A9990
Bordes       --sr-borde rgba(14,58,36,.12)
Estados      pendiente  #F1F3EE / #5C6B60
             preparacion #FDF1DF / #8A5406   (acento --sr-ambar #B8710A)
             listo      #E2F7EA / #14743F
             cancelado  #FDE7E6 / #8A1214    (acento --sr-rojo #BA1A1A)
Radios       --sr-r-s 14px · --sr-r-m 20px · --sr-r-l 24px · --sr-r-xl 34px
Sombras      --sr-sombra-card   0 6px 18px rgba(14,58,36,.08)
             --sr-sombra-accion 0 10px 26px rgba(24,86,56,.30)
```

### Tipografías

Figtree (400-800) para texto y Space Grotesk (300-700) para números y etiquetas,
añadidas al `<head>` de `index.html` junto a las fuentes que ya se cargan de Google.
Hay que cambiar `typography: Roboto` por Figtree en el `mat.theme()` de `styles.scss`.

### Clases globales — `src/app/styles/_componentes.scss`

Las piezas que se repiten entre pantallas van aquí, importadas desde `styles.scss`:

- `.sr-card` — tarjeta blanca con borde y sombra
- `.sr-chip` + `.is-pendiente` / `.is-preparacion` / `.is-listo` / `.is-cancelado`
- `.sr-tab` / `.sr-tab.is-activa` — botón de pestaña con contador
- `.sr-empty` — estado vacío con borde punteado
- `.sr-btn-accion` / `.sr-btn-secundario` / `.sr-btn-peligro`
- `.sr-num` — Space Grotesk para cifras
- `.sr-seccion` — separador con punto y línea ("EN SERVICIO · 4")

El SCSS de cada componente queda sólo con su layout propio, muy por debajo del
límite de 4kB de `angular.json`.

---

## 5. Mapeo maqueta → código

Referencia al escribir las plantillas. Los nombres de la maqueta **no** coinciden
siempre con los del código.

### Cocina / Barra (`shared/comandas-cola`)

| Maqueta | Código |
|---|---|
| `l.idLinea`, `l.cantidad`, `l.observaciones`, `l.estado` | idénticos en `LineaComandaResponse` |
| `l.productoNombre` | `productoNombre` (opcional — fallback `'Producto #' + idProducto`) |
| `l.numeroMesa` `'07'` | `numeroMesa` es **number** → padear a 2 dígitos |
| `l.hora` `'21:41'` | derivado de `fechaCreacion` |
| `l.espera` `'9 min en cola'` | derivado de `fechaCreacion` vs ahora |
| `l.avanzar` | `cambiarEstado(linea, 'EN_PREPARACION' \| 'LISTO')` |
| `l.cancelar` | `cancelarLinea(linea)` |
| `l.entregar` | `cambiarEstado(linea, 'ENTREGADO')` — existe, sin usar hoy |
| `recargar` | `cargarCola()` |
| `tabs[].count` | `pendientes[]`, `listas[]`, `canceladas[]` — ya calculados |
| chip `COCINA`/`BARRA` | `@Input() destino` / `@Input() titulo` |

Los valores de `estado` de la maqueta coinciden literalmente con el enum del
backend (`PENDIENTE`/`EN_PREPARACION`/`LISTO`/`ENTREGADO`/`CANCELADO`).

### Sala · mesas (`features/sala/sala-mesas`)

| Maqueta | Código |
|---|---|
| `m.numero` `'01'` | `Mesa.numero` (number) → padear |
| `m.capacidad`, `m.estado` | `Mesa.capacidad`, `Mesa.estado` (`LIBRE`/`OCUPADA`) |
| `m.comensales` | `ServicioResponse.numeroComensales` vía `getServicioMesaByMesaId(idMesa)` |
| `m.tiempo` `'00:38'` | derivado de `ServicioResponse.fechaInicio` |
| `m.total` `'86,50 €'` | suma de `lineasByServicioId` (`precioUnitario × cantidad`), excluyendo `CANCELADO` |
| `m.aviso` / `m.listo` | derivado de los estados de esas líneas |
| botón "Entrar" | `mesaOnClick(mesa)` |
| `m.zona` | **no existe** en la BD → se elimina del diseño |

Coste: `getMesas()` + 2 peticiones por mesa ocupada, en `forkJoin`. Con 4 ocupadas
son 9 peticiones. Aceptable; si molesta, se resuelve luego con un endpoint de resumen.

### Abrir mesa (estado `LIBRE` de `sala-mesa-detalle`)

`opcionesComensales` → `formAbrir.numeroComensales` · `observaciones` (textarea y
atajos) → `formAbrir.observaciones` · `continuar` → `abrirServicio()`, que ya arma
`AbrirServicioRequest {idMesa, idUsuarioApertura, numeroComensales, observaciones}`
con el `idUsuario` de la sesión. Cabecera: `mesa.numero`, `mesa.capacidad`, `mesa.estado`.

### Comandero y cuenta (estado `OCUPADA` de `sala-mesa-detalle`)

| Maqueta | Código |
|---|---|
| `categorias` | derivadas de `Producto.nombreCategoria` (dinámicas, no fijas) |
| `p.nombre`, `p.precioFmt` | `Producto.nombre`, `Producto.precio` |
| **`p.destino`** | **`producto.destinoDefecto`** — `destino` a secas es de `LineaComandaResponse` |
| `p.add` | `agregarAlCarrito(producto)` |
| `i.nombre`, `i.precioFmt` | **`carrito[].producto.nombre`** — el carrito real es anidado `{producto, cantidad}` |
| `i.inc` / `i.dec` | `agregarAlCarrito()` / `quitarDelCarrito()` |
| `carritoCount` | `totalItems()` |
| `enviar` | `enviarComandas()` |
| `pendientes[]` | `pendientes: LineaComandaResponse[]` — mismo nombre |
| **`cuentaLineas`** | **`lineasServicio`** |
| `l.detalle` `'2 × 9,50 €'` | `cantidad` + `precioUnitario` |
| `total` | `totalCuenta()` |
| cabecera `'Servicio #1042 · 4 comensales · desde 21:15'` | `servicioActual.idServicio` / `.numeroComensales` / `.fechaInicio` |
| chip `ABIERTO` | `servicioActual.estado` |
| banner de observaciones | `servicioActual.observaciones` |
| "Cobrar" / "Cerrar servicio" | `cerrarServicio()` |

### Login (`features/auth/login`)

`email` / `password` → `form`. `onLogin` → `submit()`. `loginError` → `error`.
`togglePass` / `passType` → estado local nuevo.

El bloque "TU ROL DEFINE TU PANTALLA" **no se implementa**: antes de autenticarse no
hay rol que mostrar. Los valores `sala@smartrest.es` / `smartrest` de la maqueta son
placeholders del diseño y no se hardcodean.

### Nota sobre fechas

`Mesa.fechaActualizacion` es un `Instant` (con zona). `Servicio.fechaInicio` y
`LineaComanda.fechaCreacion` son `LocalDateTime` (sin zona) — al parsearlos en JS se
interpretan como hora local, que es el comportamiento deseado para "9 min en cola"
y "desde 21:15".

---

## 6. Fases

### Fase 0 — Congelar la v1 (antes de tocar nada)

1. `git tag v1.0` en `master` y push del tag. Desde ahí siempre se puede levantar la
   versión original entera con `git checkout v1.0`.
2. Levantar backend + `npm run start` y capturar en `docs/portfolio/v1/`:
   - `login.png`
   - `sala-mesas.png`
   - `sala-mesa-libre.png` (formulario de abrir servicio)
   - `sala-mesa-ocupada.png` (comandero con carrito, pendientes y cuenta)
   - `cocina.png` (con comandas en los tres estados)
   - `barra.png`
3. Crear rama `feature/ui-redesign`.

Las capturas se harán con Chromium headless vía Playwright, que **no está instalado**
(~1 min de descarga, fuera del `package.json` del proyecto). Alternativa: capturarlas
a mano desde el navegador. Al final del trabajo se repite el mismo juego en
`docs/portfolio/v2/` para tener los pares antes/después.

> Requisito: la BD debe tener mesas libres y ocupadas, y comandas en varios estados,
> o las capturas del "antes" saldrán vacías y no servirán.

### Fase 1 — Base visual

`_tokens.scss`, `_componentes.scss`, fuentes en `index.html`, tipografía del
`mat.theme()`, y `design-reference/` en la raíz con los cuatro `.dc.html` y sus
assets (fuera de `src/`, no entra al build). Sin cambio funcional.

`commit: sistema visual base con tokens, tipografias y clases compartidas`

### Fase 2 — Cocina y Barra

Reescribir plantilla y estilos de `comandas-cola`: tres pestañas con contador,
tarjetas nuevas en rejilla, bloque OBS, botones Preparar/Listo/Cancelar, lista de
Listas con botón "Entregado", lista de Canceladas, estado vacío por pestaña, y
línea de resumen. Polling de 12s con parada en `ngOnDestroy` + botón Actualizar.

Sustituye las tablas con paginador actuales, así que se pueden retirar
`MatTableModule` y `MatPaginatorModule` de este componente.

`commit: rediseño de la cola de comandas para cocina y barra`

### Fase 3 — Sala · mesas

Agrupación "en servicio" / "libres" con sus separadores, tarjetas con comensales,
tiempo, total y aviso, halo animado en "listo para servir", y botón Actualizar.

`commit: rediseño del panel de mesas con agrupacion por estado y avisos`

### Fase 4 — Abrir mesa, comandero y cuenta

La más grande. Se mantiene una sola ruta `/sala/mesa/:id` que muestra el formulario
de apertura si la mesa está `LIBRE` y el comandero si está `OCUPADA` — que es lo que
ya hace el componente y encaja con el flujo del diseño.

- Abrir mesa: selector de comensales (limitado por `mesa.capacidad`), textarea y
  atajos de observaciones, resumen y botón Continuar.
- Comandero: pestañas de categoría, rejilla de productos, bloque "en cocina y barra".
- Carrito con +/− y "Enviar comandas".
- Panel de cuenta deslizable con desglose, división en partes, forma de pago,
  "Cobrar" y "Cerrar servicio".

El gesto de arrastre se deja para el final; si aprieta el tiempo, el botón normal que
abre el panel es una degradación aceptable.

`commit: rediseño de la apertura de mesa`
`commit: rediseño del comandero y panel de cuenta`

### Fase 5 — Login

Splash con la animación de intro (3,6s, siempre), logo, tarjeta del formulario,
toggle de mostrar/ocultar contraseña y estado de error.

`commit: rediseño de la pantalla de login con animacion de intro`

### Fase 6 — Cierre

Pase responsive de las cinco pantallas, capturas de la v2 en `docs/portfolio/v2/`,
y PR de `feature/ui-redesign` a `master`.

---

## 7. Piezas del diseño sin respaldo en la API

Se documentan aquí para retomarlas en una v2.1 con cambios de backend:

| Pieza | Situación |
|---|---|
| Contador de unidades `2/4` en cocina | `LineaComanda` no tiene campo de unidades hechas. Se pinta el total de unidades sin progreso |
| Forma de pago (Efectivo/Tarjeta/Bizum) | Se implementa como selección local. **No persiste** — no hay campo en `Servicio` |
| División en partes | Cálculo en cliente. Correcto así: es una calculadora de ayuda, no un dato a guardar |
| Botón "Quitar" línea de la cuenta | **No se implementa.** Cancelar una línea de `COCINA` exige rol `COCINA`/`ADMIN` y quien mira la cuenta es Sala: el botón sólo podría devolver 403 |
| Zona de la mesa (Interior/Terraza) | No existe en la BD. Se elimina del diseño |

---

## 8. Checklist por pantalla

- [ ] Los datos vienen de la API, no de arrays en el componente
- [ ] Las acciones persisten vía el servicio correspondiente
- [ ] Estado vacío implementado
- [ ] Sin credenciales ni datos de prueba hardcodeados
- [ ] Verificado en móvil/tablet y escritorio
- [ ] `npm run build` sin errores nuevos

---

## 9. Estimación

| Fase | |
|---|---|
| 0 · Congelar v1 | ~15 min |
| 1 · Base visual | ~20 min |
| 2 · Cocina + Barra | ~40 min |
| 3 · Sala · mesas | ~30 min |
| 4 · Abrir mesa + comandero + cuenta | ~1h 30 min |
| 5 · Login | ~25 min |
| 6 · Responsive y capturas v2 | ~40 min |
| **Total** | **~4h** |

La fase 4 concentra la mayor parte del riesgo: tres bloques en un solo componente más
el panel deslizable.

Recomendación: entregar fases 0-2 primero (~1h 15), levantarlo contra el backend y
validar el enfoque visual antes de seguir. Si el sistema visual hay que cambiarlo,
mejor descubrirlo en la primera pantalla que en la quinta.
