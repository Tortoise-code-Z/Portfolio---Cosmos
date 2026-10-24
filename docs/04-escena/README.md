# Escena 3D · visión general

> El motor visual: un único sistema de partículas que cambia de forma según `m` (ver
> `docs/02-experiencia/scroll-y-escena.md`). Referencia funcional: `docs/referencia/prototipo-v0.1.html`
> (Three.js r128 sin React; aquí se reescribe con React Three Fiber y TypeScript).

## Archivos

| Archivo | Qué define |
|---|---|
| `particulas-y-shaders.md` | Atributos, uniforms, shader de vértices y de fragmentos, mezcla, gravedad del cursor |
| `formas.md` | Generadores de cada forma (singularidad, nebulosa, galaxia, tortuga, Tierra) y sus etiquetas |
| `camara-y-encuadre.md` | Keyframes de cámara, encuadre por capítulo, móvil, paralaje y vuelo a las placas |
| `constelaciones-y-placas.md` | Estrellas de skills, líneas, placas de proyecto, pins y etiquetas proyectadas |
| `rendimiento.md` | Niveles, presupuestos, degradación, pausa, alternativa sin WebGL y tests de la escena |

## Piezas y flujo

```
            ┌───────────────────────── hilo principal ──────────────────────────┐
scroll ───► │ scroll/mapM (puro) ──► sceneStore (mutable, sin re-render de React) │
puntero ──► │                                │                                  │
            │       useFrame (R3F, cada frame) ◄┘                                │
            │        ├─ uniforms de partículas (uM, uTime, uCharge, uPlate…)      │
            │        ├─ cámara (keyframes + encuadre + paralaje)                  │
            │        └─ etiquetas y pins (proyección 3D→2D por refs, sin estado)  │
            └────────────────────────────────────────────────────────────────────┘
            ┌──────── Web Worker ────────┐
            │ generadores de formas      │──► Float32Array transferibles ──► BufferGeometry
            │ (PRNG con semilla fija)    │
            └────────────────────────────┘
```

## Decisiones de diseño de la escena

1. **Un solo `THREE.Points`** con todas las formas como atributos: la transición es una mezcla en la GPU, sin
   crear ni destruir objetos.
2. **El estado que cambia cada frame no pasa por React.** `m`, la carga, el puntero y los resaltados viven en un
   store mutable que `useFrame` lee. React solo renderiza cuando cambia algo estructural (idioma, nivel de
   rendimiento, ruta).
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
  SceneRoot.tsx            ← <Canvas>, carga diferida, detección de WebGL y nivel
  Particles.tsx            ← geometría + ShaderMaterial + useFrame
  BackgroundStars.tsx
  Constellations.tsx
  Sun.tsx
  CameraRig.tsx
  overlay/ProjectedLabels.tsx   ← etiquetas y pins DOM actualizados por refs
  shaders/particles.vert.glsl · particles.frag.glsl · stars.*.glsl
  worker/shapes.worker.ts
  shapes/  singularity.ts · nebula.ts · galaxy.ts · turtle.ts · earth.ts · hex.ts · noise.ts · prng.ts
  math/    camera.ts · projection.ts · easing.ts
  config/  tiers.ts · constants.ts · constellationLayout.ts · plateSlots.ts
```

`sceneStore` no vive aquí: está en `src/stores/sceneStore/sceneStore.ts` (capa `stores`, ver `docs/05-tecnico/arquitectura.md`).
