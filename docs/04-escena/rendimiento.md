# Rendimiento y robustez de la escena

## Presupuesto

- **60 fps** (16,6 ms por frame) en escritorio; **≥ 30 fps** en móvil de gama media.
- De esos 16,6 ms, la escena puede usar ~8 ms en GPU y ~2 ms en CPU (proyección de etiquetas, store, uniforms).
- El código 3D va en un **chunk aparte** que se carga después de la primera pintura: el JS inicial de la interfaz
  no incluye Three.js. Sin WebGL2 ni siquiera se descarga. Pesa ≤ 250 KB gzip (`calidad.md` → «Presupuestos»);
  en F3.1, con el lienzo vacío, 241,6 KB: React Three Fiber importa Three.js entero, así que lo que añadan las
  formas y los shaders tiene poco margen.

## Niveles

| Nivel | Partículas | Estrellas fondo | DPR máx. | Extras |
|---|---|---|---|---|
| Alto | 60.000 | 5.000 | 2 | Todo |
| Medio | 36.000 | 3.500 | 1,5 | Todo |
| Bajo | 20.000 | 2.000 | 1 | Sin estela de la tortuga ni luces de ciudad |
| Apagado | — | — | — | Modo sin WebGL |

**Elección inicial** (función pura testeable a partir de señales del navegador: `chooseInitialLevel` en
`src/lib/device/sceneLevel`, con la tabla de arriba en `LEVEL_SETTINGS`; una señal que el navegador no da,
como `deviceMemory` en Firefox y Safari, no baja el nivel):
- `navigator.connection.saveData` o `deviceMemory ≤ 2` → Bajo.
- Puntero grueso (táctil) o ancho < 760 px → Bajo.
- `hardwareConcurrency ≤ 4` → Medio.
- En otro caso → Alto.

**Degradación en caliente** (F3.6, con partículas que medir): media de fps en ventanas de 2 s; si está por debajo de 45 (escritorio) o 26
(móvil) en **3 ventanas seguidas**, se baja un nivel (se regeneran las formas en el worker con el nuevo
`count`). Nunca se sube durante la visita. Un fallo al regenerar deja el nivel actual.

## Ahorro de trabajo

- **Pausa** del render con la pestaña oculta (`visibilitychange`), el modo misión rápida abierto o el lienzo
  fuera de vista.
- Las etiquetas solo se proyectan si el peso de su capítulo es > 0,01.
- El HUD solo toca el DOM cuando su texto cambia.
- Cero asignaciones por frame en `useFrame` (vectores reutilizados) para no provocar recolección de basura.

## Robustez

- Detección de WebGL2 antes de montar el `<Canvas>`; si falla la creación del contexto o compila mal un shader,
  se captura el error, se registra (`console.error` con contexto, sin datos del usuario) y se pasa a Apagado.
- `webglcontextlost` / `webglcontextrestored`: un intento de restauración (Three.js la pide); si el contexto no
  vuelve en 3 s o se pierde otra vez, Apagado (`src/scene/contextLoss`).
- Un shader que no compila no lanza (Three.js solo lo registra): `gl.debug.onShaderError` lo registra y pasa a
  Apagado.
- Si el worker falla o tarda más de 3 s, se reintenta una vez en el hilo principal con el nivel Bajo.
- La escena nunca lanza errores hacia la interfaz: está aislada en un *error boundary* propio.

## Tests de la escena

| Tipo | Herramienta | Qué cubre |
|---|---|---|
| Unitarios | Vitest | Generadores, mapeo de `m`, cámara, proyección, elección de nivel, formato del HUD, paridad TS/GLSL de las funciones compartidas |
| Componentes | Vitest + Testing Library | Montaje con WebGL simulado, paso a Apagado ante error |
| Extremo a extremo | Playwright | Recorrido completo, raíl, detonación, misión rápida, idioma, sin WebGL (WebGL desactivado) |
| Regresión visual | Playwright (capturas) | Un estado por capítulo en los tamaños de referencia, render por software (SwiftShader) y tolerancia de píxeles |
| Rendimiento | Lighthouse CI + medida manual | Core Web Vitals y presupuesto de JS; fps medidos a mano en un móvil real antes de cada versión |
