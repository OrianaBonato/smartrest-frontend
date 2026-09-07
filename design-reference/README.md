# Referencia de diseño — rediseño v2.0

Artboards exportados de Claude Design que sirven de referencia visual para el
rediseño de la interfaz. **No son Angular y no entran al build**: viven fuera de
`src/` a propósito.

Usan su propio runtime (`support.js`, etiquetas `sc-if` / `sc-for`, bindings
`{{ }}`). De ellos se toma el HTML, el CSS y los estados — colores, tipografías,
spacing, textos, estados vacíos y hover. La lógica de `state` / `renderVals()` es
una simulación de la maqueta, no una guía de arquitectura Angular.

## Qué debe haber aquí

```
SmartRest Login.dc.html
SmartRest Cocina.dc.html
SmartRest Barra.dc.html
SmartRest Sala.dc.html
support.js
assets/
```

Copia aquí la exportación original completa de Claude Design. Sin `support.js` y
sin la carpeta `assets/` los `.dc.html` no se renderizan en el navegador.

La traducción campo a campo de cada maqueta a los nombres reales del código está
en [`../docs/plan-rediseno-ui.md`](../docs/plan-rediseno-ui.md).
