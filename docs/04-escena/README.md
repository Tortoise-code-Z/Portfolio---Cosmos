# Escena 3D · visión general

> El motor visual: un único sistema de partículas que cambia de forma según `m` (ver
> `docs/02-experiencia/scroll-y-escena.md`). Referencia funcional: `docs/referencia/prototipo-v0.1.html`
> (Three.js r128 sin React; aquí se reescribe con React Three Fiber y TypeScript).

## Archivos

| Archivo | Qué define |
|---|---|
| `particulas-y-shaders.md` | Atributos, uniforms, shader de vértices y de fragmentos, mezcla, gravedad del cursor |
| `formas.md` | Generadores de cada forma (singularidad, nebulosa, galaxia, tortuga, Tierra, retrato) y sus etiquetas |
| `camara-y-encuadre.md` | Keyframes de cámara, encuadre por capítulo, móvil, paralaje y vuelo a las placas |
| `constelaciones-y-placas.md` | Estrellas de skills, líneas, placas de proyecto, pins y etiquetas proyectadas |
| `rendimiento.md` | Niveles, presupuestos, degradación, pausa, alternativa sin WebGL y tests de la escena |

## Piezas y flujo

```
            ┌───────────────────────── hilo principal ────────────────────────────┐
scroll ───► │ scroll/mapM (puro) ──► sceneStore (mutable, sin re-render de React) │
            │                            │ mTarget, charge (la carga del hero)    │
            │  SceneRoot (su step) ◄─────┘ suaviza m, copia la carga: SceneFrame  │
puntero ──► │ scene/pointer ──► SceneFrame.pointer (lo escribe cada evento)       │
            │       useFrame de cada pieza (R3F) ◄── leen SceneFrame              │
            │        ├─ uniforms de partículas (uM, uTime, uCharge, uPlate…)      │
            │        ├─ cámara (keyframes + encuadre + paralaje)                  │
            │        └─ etiquetas y pins (proyección 3D→2D por refs, sin estado)  │
            └─────────────────────────────────────────────────────────────────────┘
            ┌──────── Web Worker ────────┐
            │ generadores de formas      │──► Float32Array transferibles ──► BufferGeometry
            │ (PRNG con semilla fija)    │
            └────────────────────────────┘
```

## Decisiones de diseño de la escena

1. **Un solo `THREE.Points`** con todas las formas como atributos: la transición es una mezcla en la GPU, sin
   crear ni destruir objetos.
2. **El estado que cambia cada frame no pasa por React.** El destino del scroll (`mTarget`) vive en un store
   mutable, junto a la carga de la detonación (`charge`, la escribe el bucle del botón del hero); el `step` del
   bucle de `SceneRoot` (sobre `scene/frameLoop`) los lee cada frame y deja su `m` suavizada, la carga
   (`SceneFrame.charge` → `uCharge`), el reloj y lo demás en un `SceneFrame` compartido, que leen los `useFrame`. El ratón y si es
   escritorio los escriben sus observadores (`scene/pointer`, `watchMediaQuery`) directamente en el
   `SceneFrame`. `CameraRig` escribe en él la pose y el campo de visión de la cámara, y su `useFrame` va antes que
   los demás por su prioridad (−1): las etiquetas proyectan con ellos en el mismo frame. React solo renderiza cuando cambia algo estructural (idioma, nivel de rendimiento, ruta).
3. **Lógica pura separada del render.** Mapeo de scroll, interpolación de cámara, generadores, proyección y
   formato del HUD son funciones puras en TypeScript, testeadas con Vitest sin WebGL.
4. **Universo determinista.** Los generadores usan un PRNG con semilla fija: el universo es idéntico en cada
   visita, los tests son reproducibles y las capturas de regresión visual son estables.
5. **Shaders en archivos `.glsl`** importados como texto (`?raw` de Vite), con las constantes de color de
   `docs/03-diseno/design-system.md`.
6. **Un lienzo para toda la app** (montado en la raíz): persiste entre rutas para la transición a las páginas de
   proyecto.

## Estructura de código propuesta (se confirma en `docs/05-tecnico/arquitectura.md`)

```
src/scene/
  SceneRoot/               ← el <Canvas> (nivel recibido de SceneMount, DPR, onFail) · contextLoss/
                             (la carga diferida y la elección del nivel: features/scene-mount/SceneMount;
                             la tabla de niveles, la elección y la detección de WebGL2: lib/device/)
  Particles/               ← monta los Points de las partículas; useParticles se prueba sin WebGL (F3.3)
  voidColour/              ← el color de fondo del lienzo, de --color-void con sus números tal cual (ADR-027)
  BackgroundStars/         ← estrellas de fondo; useBackgroundStars se prueba sin WebGL (F3.3)
  particleGeometry/ · sceneMaterials/   ← atributos · uniforms y materiales (F3.3)
  frameLoop/ · sceneClock/ ← bucle de frames propio y reloj de animación (F3.3, ADR-027)
  Constellations/          ← las 4 constelaciones (estrellas y líneas) y cómo colocan sus etiquetas (F4.3b)
  ConstellationLabels/     ← la capa del DOM de las etiquetas, en `body` (F4.3b; las vivas reciben el puntero a través de `main`, F4.3c)
  Sun/                     ← el Sol sobre la Tierra: un cuadrado que mira a la cámara (F4.5)
  CameraRig/               ← aplica la pose de math/camera a la cámara del <Canvas> en cada frame (F3.4)
  pointer/                 ← el ratón en NDC sobre el lienzo, solo `pointerType: mouse` (paralaje en F3.4; gravedad en F4.2)
  pause/                   ← cuándo pausar el bucle: pestaña oculta o misión rápida abierta (F3.5)
  PlatePins/               ← los pins de las placas: su capa del DOM en `body` y cómo se colocan en cada frame (F4.4b)
  labelWriter/             ← escribe en el DOM una etiqueta colocada (estrellas y pins), solo lo que cambia (F4.4b)
  shaders/ particles/ · stars/ · constellations/ · sun/ (los .glsl) · glslHeader/ (etiquetas, colores y `SUN_DIR` desde TS)   (F3.3)
           stripGlslComments/ (los .glsl sin comentarios al compilar: plugin de vite.config.ts)
  useSceneShapes/          ← pide las formas al montar; reintento en el hilo principal (F3.2); `lowerTo` (F3.6)
  fpsMeter/ · useHotDegradation/   ← degradación en caliente: fps por ventanas de 2 s y bajar un nivel (F3.6)
  usePortrait/             ← pide el retrato al llegar a la tortuga, una vez por visita (C.6b)
  worker/  shapes.worker.ts · handleShapesRequest/ · protocol/ · loadShapes/   (F3.2) ·
           handlePortraitRequest/ · decodePortrait/ (el retrato: sus imágenes, C.6b)
  shapes/  prng/ · noise/ · sampling/ · hexGrid/ · nebula/ · galaxy/ · turtle/ · earth/ · portrait/ ·
           shapeContract/ · generateShapes/   (F3.2; la singularidad no se genera: formas.md)
           stars/   (F3.3: las estrellas de fondo, en el hilo principal)
  math/    camera/ (pose por m, FOV de móvil, paralaje; F3.4) · gravity/ (la gravedad del cursor; F4.2) ·
           projection/ (de la escena a la pantalla; F4.3a) · chapterPresence/ (cuánto está un capítulo) ·
           constellations/ (encendido y aspecto) · labelFit/ (qué etiquetas caben; F4.3b) ·
           plateCycle/ (qué placa se ilumina; F4.4a) · platePins/ (ancla, balanceo, caja y pisos; F4.4b)
  config/  sceneConfig.ts · plateSlots/ (F3.2) · scenePalette/ (F3.3) · constellationLayout/ (F4.3a)
                             (niveles: lib/device/sceneLevel)
                             (cada archivo con test, en su carpeta: ADR-018)
```

`sceneStore` no vive aquí: está en `src/stores/sceneStore/sceneStore.ts` (capa `stores`, ver `docs/05-tecnico/arquitectura.md`).
