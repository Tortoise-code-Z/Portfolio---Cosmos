# Rendimiento y robustez de la escena

## Presupuesto

- **60 fps** (16,6 ms por frame) en escritorio; **≥ 30 fps** en móvil de gama media.
- De esos 16,6 ms, la escena puede usar ~8 ms en GPU y ~2 ms en CPU (proyección de etiquetas, store, uniforms).
- El código 3D va en un **chunk aparte** que se carga después de la primera pintura: el JS inicial de la interfaz
  no incluye Three.js. Sin WebGL2 ni siquiera se descarga. Pesa ≤ 250 KB gzip (`calidad.md` → «Presupuestos»);
  en F3.2, con el lienzo vacío y las formas pedidas, 241,6 KB; en F3.3, con las partículas, sus shaders y las
  estrellas, 248,2 KB. Desde justo antes de F3.4 los shaders llegan sin comentarios (el plugin `cosmos:glsl-without-comments`
  de `vite.config.ts`, que conserva los saltos de línea para que la línea de un error siga siendo la del archivo):
  247,0 KB; en F3.4, con la cámara (`CameraRig`, `math/camera`, el ratón), 248,0 KB; con el color de fondo leído sin linealizar y
  el reajuste de las partículas y del shader, 248,1 KB; en F3.5, con el suavizado de `m` y la pausa, 248,4 KB; en F3.6, con la degradación en caliente, 249,0 KB. React Three Fiber importa
  Three.js entero, así que lo que añadan las constelaciones (F4) tiene muy poco margen. Los generadores no cuentan ahí: van en el
  worker (≤ 10 KB) y, para el reintento, en su propio chunk (≤ 10 KB).

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
- WebGL2 pintado por software (`detectWebGL2` → `software`: solo da contexto sin
  `failIfMajorPerformanceCaveat`; SwiftShader, llvmpipe, un escritorio remoto) → Bajo. No todo SwiftShader lo
  dice: en la imagen de Playwright (la de los e2e del CI y las capturas), Chromium da contexto incluso con esa
  opción y en escritorio arranca en Alto. Las capturas lo fuerzan a «software» (`calidad.md` → «Regresión
  visual»); los e2e de Chromium del CI, no (ver `STATE.md`).
- `navigator.connection.saveData` o `deviceMemory ≤ 2` → Bajo.
- Puntero grueso (táctil) o ancho < 760 px → Bajo.
- `hardwareConcurrency ≤ 4` → Medio.
- En otro caso → Alto.

En Bajo, la estela de la tortuga la esconde el shader (un uniform) y las luces de ciudad son color del shader:
el generador de las formas no mira el nivel (las mismas fracciones en todos).

**Degradación en caliente** (F3.6): media de fps en ventanas de 2 s; si está por debajo de 45 (escritorio) o 26
(móvil: puntero grueso o < 760 px, el criterio de la elección inicial, `isHandheld`) en **3 ventanas seguidas**, se
baja **un** nivel (Alto → Medio → Bajo; `nextLowerLevel`). Las cifras, en `HOT_DEGRADATION` de
`scene/config/sceneConfig`.

- **Qué se mide:** cada frame del bucle de la escena (`scene/fpsMeter`, puro y sin asignaciones; lo alimenta el
  `step` de `SceneRoot` a través de `useHotDegradation`). Solo con partículas pintadas y con un nivel por debajo:
  en Bajo no se mide (los fps nunca llevan a Apagado). Hoy todo móvil arranca en Bajo, así que el umbral de 26 solo
  contaría si la elección inicial cambiara.
- **Qué no cuenta:** los primeros 2 s de cada nivel (el primer frame compila el shader y sube la geometría) y la
  ventana en curso al pausar (pestaña oculta, misión rápida: su hueco no es un frame lento). Las ventanas lentas ya
  cerradas antes de la pausa siguen contando.
- **Orden:** primero se piden al worker las formas del nivel de debajo (`useSceneShapes` → `lowerTo`: `loadShapes`
  con el nuevo `count`, **sin reintento** en el hilo principal) y, cuando llegan, se cambian las formas y se baja el
  nivel a la vez (`uiStore.lowerSceneLevel`, que solo baja: DPR, estrellas y extras del nivel nuevo). Mientras
  llegan no se mide; con el nivel nuevo, el medidor empieza de cero.
- **Si las formas no llegan:** `console.warn` (degradación prevista), nivel y formas siguen como estaban y no se
  mide más en esa visita (sin bucle de intentos). Nunca se sube durante la visita.
- **Límite conocido:** un navegador que limita los frames a 30 (ahorro de batería de Chrome, modo de bajo consumo
  de Safari) baja hasta Bajo en escritorio. Se acepta: en ese modo, gastar menos es lo que se pide.

## Worker de las formas

`src/scene/worker/` (generadores: `formas.md`). `SceneRoot` las pide al montar (`useSceneShapes`) con las
partículas de su nivel, la semilla del proyecto y las placas con proyecto (`assignPlates(projectEntries)`), y
las pinta (`Particles`). Solo pide otras si el nivel pide otro `count` que no tenga ya (tras el reintento o tras
una degradación en caliente, que las trajo antes de bajar el nivel).

- **Un worker por encargo** (`loadShapes`): se crea, responde y se cierra (`terminate`); también al vencer el
  plazo o al desmontar, y una respuesta tardía se ignora. Las 5 matrices vuelven **transferidas** (sin
  copiar). `loadShapes` no reintenta: devuelve las formas o el motivo, y quien llama decide.
- **Validación a los dos lados** (`worker/protocol`): el worker rechaza una petición mala con
  `{ ok: false, reason }`; el hilo principal comprueba que llegan las 5 matrices `Float32Array` con
  `count · 3` / `count · 4`. La entrada del worker (`shapes.worker.ts`) solo conecta el mensaje con
  `handleShapesRequest`, que nunca lanza.
- **Qué es fallar:** el constructor lanza (`unavailable`), evento `error` (no carga o lanza dentro),
  `messageerror`, `{ ok: false }` (`rejected`), una respuesta que no valida (`invalid`) o el **plazo de 3 s**,
  que corre desde que se crea el worker (incluye su descarga), con la página visible u oculta.
- **Reintento:** si el worker falla, `console.warn` (degradación prevista) y se generan **una vez** en el hilo
  principal con el `count` de Bajo, cargando los generadores con un `import()` (su propio chunk: solo se
  descargan si hace falta). La escena entera baja a Bajo (`lowerSceneLevel('low')`: DPR, estrellas, extras) y
  `SceneRoot` no vuelve a pedir formas. Si el reintento también falla: `console.error` y Apagado
  (`onFail('shapes-failed')`), con su aviso.
- `SceneRoot` marca de dónde llegaron (`data-shapes="worker" | "main"`) y su nivel (`data-level`) para los e2e.

## Ahorro de trabajo

- **Pausa** del render con la pestaña oculta (`visibilitychange`) o el modo misión rápida abierto (que la tapa):
  `scene/pause` (`watchScenePause`) avisa y el bucle deja de pedir frames (`FrameLoop.setPaused`); al volver, el
  reloj limita el salto a 0,1 s. `SceneRoot` lo marca con `data-paused` (e2e). Con la misión rápida, la escena se
  congela al abrirse, bajo el fundido de entrada del diálogo (400 ms; 150 ms con movimiento reducido) hacia un velo
  casi opaco: casi no se nota, y esperar al fundido metería el DOM del diálogo (una feature) en la escena. «Lienzo
  fuera de vista» no se da mientras el lienzo sea fijo a toda la ventana.
- Las etiquetas solo se proyectan si el peso de su capítulo es > 0,01.
- El HUD solo toca el DOM cuando su texto cambia.
- Cero asignaciones por frame en `useFrame` (vectores reutilizados) para no provocar recolección de basura.

## Robustez

- Detección de WebGL2 antes de montar el `<Canvas>`; si falla la creación del contexto o compila mal un shader,
  se captura el error, se registra (`console.error` con contexto, sin datos del usuario) y se pasa a Apagado.
- `webglcontextlost` / `webglcontextrestored`: un intento de restauración (Three.js la pide); si el contexto no
  vuelve en 3 s **con la página a la vista** o se pierde otra vez con la página a la vista, Apagado
  (`src/scene/contextLoss`). Con la página oculta el plazo no corre (un móvil libera la GPU al cambiar de app
  y no la devuelve hasta volver): arranca entero al volver a la vista y esa pérdida no gasta el intento. Al
  volver el contexto, Three rehace su estado (y su fondo, en negro: `SceneRoot` vuelve a poner `--color-void`)
  y el bucle de frames pinta el siguiente (o el primero al salir de la pausa).
- Un shader que no compila no lanza (Three.js solo lo registra, y con un `onShaderError` propio ni eso):
  `gl.debug.onShaderError` registra lo que Three habría escrito (el registro del programa y el de cada shader,
  con sus líneas) y pasa a Apagado.
- **Errores del bucle de frames:** lo que lanza en `useFrame` o en `gl.render` corre en el
  `requestAnimationFrame`, fuera de React: no lo recoge ningún *error boundary* y se repetiría en cada frame.
  Por eso el lienzo va con `frameloop="never"` y la escena tiene su propio bucle (`scene/frameLoop`, ADR-027):
  cada frame rellena el `SceneFrame` compartido y llama a `advance()` dentro de un solo `try`; el primer error
  para el bucle, se registra (`[scene] A frame failed…`) y pasa a Apagado (`frame-error`). Una pieza nueva de la
  escena solo añade su `useFrame` y queda cubierta.
- Si el worker de las formas falla o tarda más de 3 s, se reintenta una vez en el hilo principal con el nivel
  Bajo; si eso también falla, Apagado (ver «Worker de las formas»).
- La escena nunca lanza errores hacia la interfaz: al montar y al renderizar con React está aislada en un
  *error boundary* propio; en el bucle de frames, por la regla de arriba.

## Tests de la escena

| Tipo | Herramienta | Qué cubre |
|---|---|---|
| Unitarios | Vitest | Generadores (también las estrellas), mapeo de `m` y su suavizado (`damp`), pausa (`scene/pause`), medidor de fps (`scene/fpsMeter`: calentamiento, ventanas seguidas, pausa), nivel de debajo y móvil (`nextLowerLevel`, `isHandheld`), cámara (`scene/math/camera`: pose, encuadre, campo de visión, paralaje acotado), ratón (`scene/pointer`, solo `mouse`), `watchMediaQuery`, proyección, elección de nivel, formato del HUD, geometría y uniforms de las partículas, cabecera GLSL y shaders sin números ni nombres de más, shaders sin comentarios, paleta contra la tabla del design system, bucle de frames, reloj de la escena, color de fondo, paridad TS/GLSL de la posición de los pins (F4.4; el ruido no la necesita, `formas.md`) |
| Componentes | Vitest + Testing Library | Montaje con WebGL simulado, paso a Apagado ante error (también un frame que lanza), movimiento reducido, color de fondo al crear y al recuperar el contexto, partículas y estrellas (`useParticles`, `useBackgroundStars`: aviso en el primer frame (partículas), uniforms en cada frame, memoria liberada), `CameraRig` (pose, campo de visión al cambiar el aspecto, paralaje), pausa del bucle (`data-paused`), degradación en caliente (`useHotDegradation`: un nivel cada vez, no mide sin partículas ni mientras llegan las formas, deja de medir si no llegan; `useSceneShapes` → `lowerTo`: sin reintento, formas y nivel a la vez; en `SceneRoot`, `data-level` y una pausa que no cuenta como frame lento) |
| Extremo a extremo | Playwright | Recorrido completo, raíl, detonación, misión rápida, idioma, sin WebGL (WebGL desactivado; el fondo por debajo del contenido), formas del worker y del reintento (`data-shapes`), partículas que se ven (fracción de píxeles que no son fondo, entrando por `/#about`), fondo del color del token (al cargar y tras recuperar el contexto), movimiento reducido, la cámara por los 5 capítulos con el ratón a 1280×720 y 390×844, pausa con la misión rápida, degradación en caliente en Chromium (arrancando en Alto con SwiftShader, que no llega a 45 fps: Alto → Medio → Bajo con las formas del worker; y si las formas no llegan, el nivel se queda y avisa una vez), sin avisos de WebGL del navegador |
| Regresión visual | Playwright (capturas, Docker) | Un estado por capítulo a 1440×900 y 390×844, con movimiento reducido, render por software (SwiftShader, nivel Bajo) y una tolerancia del 0,1 % de los píxeles (`calidad.md` → «Regresión visual») |
| Rendimiento | Lighthouse CI + medida manual | Core Web Vitals y presupuesto de JS; fps medidos a mano en un móvil real antes de cada versión |
