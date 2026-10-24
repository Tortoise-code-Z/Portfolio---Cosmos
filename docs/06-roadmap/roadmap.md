# Roadmap

> Fases en orden. Cada fase termina con: `npm run check` y CI en verde, auditoría con mirada fresca
> (`code-audit` o la Mesa), `STATE.md`/`DECISIONS.md` al día y una etiqueta de versión.
> Dentro de cada fase se trabaja con el ciclo: `session-start` → esquema → **Visto Bueno** → pasos pequeños
> con commit → auditoría → `session-close`. Una rama y un PR por tarea.

## Principio de orden

**Primero la web útil, después el espectáculo.** Al acabar la fase 2 el portfolio ya funciona completo sin 3D
(principio P1 del brief). Las fases 3–5 añaden la escena encima sin tocar el contenido.

## F0 · Contexto del proyecto

- `project-bootstrap` en modo **/docs + Mapa** sobre esta carpeta: crea `CLAUDE.md` (con el Mapa apuntando a
  `docs/`), `STATE.md`, `DECISIONS.md` (con los 12 ADR de `docs/05-tecnico/README.md`) y `DEVELOPMENT_RULES.md`.
- Decidir si se usa la cadena **Taller/Mesa** (recomendado a partir de F3, donde el código se complica).

**Hecho cuando:** la espina dorsal existe, el Mapa localiza cada documento y no hay contradicciones entre docs.

## F1 · Entorno (`env-init`)

- `git init` + `.gitattributes` + `.gitignore` + `.nvmrc` + `.npmrc` (`engine-strict`).
- Andamiaje de React Router (modo framework) **en la raíz**, con `appDirectory: "src"`, versiones de `stack.md`.
- TypeScript estricto, ESLint + Prettier, Vitest + Testing Library, Playwright, Husky + lint-staged.
- CI de GitHub Actions (typecheck, lint, test, build; e2e con un test mínimo).
- Repo `Tortoise-code-Z/Portfolio---Cosmos` y proyecto en Vercel con preview por PR.
- Página «hello» pre-renderizada en `/` y `/es`.

**Hecho cuando:** `npm run check` y `npm run build` en verde en local (PowerShell) y en CI; la preview de Vercel
se abre. Etiqueta `v0.0.1`.

## F2 · Cimientos sin 3D

1. Tokens, `global.css` y fuentes autoalojadas (eje `wdth` de Anybody verificado: `docs/05-tecnico/stack.md`).
2. Capa de contenido tipada + tests de invariantes (`docs/01-contenido`).
3. i18n propio, rutas EN/ES, `meta`, `hreflang`, JSON-LD y `sitemap.xml`.
4. Capítulos del viaje con su layout, paneles y textos (sin escena; punto de la singularidad en CSS).
5. Mapeo de scroll (`mapM`) con tests; raíl, HUD y barra superior conectados.
6. Modo misión rápida (incluido `/#quick` y su botón en la barra), copiar email, chip de disponibilidad en la barra,
   sugerencia de idioma.
7. Páginas de proyecto completas (galería con visor accesible) y 404. La barra superior, la misión rápida y la
   sugerencia de idioma entran también en la página de proyecto; al volver al viaje, el foco queda en la fila del
   proyecto visitado. *(Hecho en F2.7: el visor está probado con imágenes de prueba; las galerías siguen vacías.)*
8. Imágenes de proyectos migradas desde el repo antiguo y optimizadas: `cover` y `gallery` de cada proyecto (la
   portada y la galería se pintan solas en cuanto tienen datos) y un e2e del visor con las imágenes reales.

**Hecho cuando:** el sitio completo se puede usar y desplegar sin escena; Lighthouse Accessibility ≥ 95 y SEO ≥ 95;
recorridos e2e del recruiter en verde. Etiqueta `v0.1.0`. *(Se podría publicar ya.)*

## F3 · Motor de escena

1. `SceneMount` diferido, detección de WebGL2, niveles de rendimiento y `ErrorBoundary` de escena. Antes de
   importar la escena, sacar `three` y `@react-three/*` del grupo `framework` de `vite.config.ts` (ADR-020).
2. Utilidades puras (PRNG, ruido, hex) y generadores de las 4 formas en el worker, con sus tests.
3. `Particles` con el shader de morph entre las 5 formas; estrellas de fondo.
4. `CameraRig` con keyframes, encuadre por capítulo, FOV para móvil y paralaje.
5. Puente `sceneStore` ↔ scroll (el scroll ya escribe `mTarget` desde F2.5, ADR-021: la escena pasa a suavizar `m`);
   pausa con pestaña oculta y en misión rápida (`quickMissionOpen` de `uiStore`, desde F2.6).
6. Primeras capturas de regresión visual (Docker) y medición de fps.

**Hecho cuando:** el viaje se ve de punta a punta con las 5 formas, 60 fps en escritorio y sin errores con WebGL
desactivado. Etiqueta `v0.2.0`.

## F4 · Capítulos (uno por PR, en este orden)

1. **Singularidad:** mantén para detonar (puntero y teclado), destello, temblor, nombre con `wdth`, autoscroll.
2. **Nebulosa:** protoestrella y gravedad del cursor.
3. **Galaxia:** 4 constelaciones, etiquetas proyectadas, encendido sincronizado con el panel (ratón, foco, toque);
   test de no solapamiento.
4. **Tortuga:** placas por huecos, pins, ciclo automático, resaltado sincronizado con las filas.
5. **Tierra:** día/noche, amanecer, luces de ciudad, atmósfera y Sol.

**Hecho cuando:** cada capítulo cumple sus criterios de aceptación de `docs/02-experiencia/capitulos/`.
Etiqueta `v0.3.0`.

## F5 · Transiciones a proyectos

- Lienzo persistente entre rutas, vuelo de cámara a la placa, escena atenuada en la página de proyecto,
  anterior/siguiente, vuelta con la posición restaurada, carga directa sin Big Bang. La placa que se ilumina al
  volver es la de `uiStore.visitedProject` (el mismo dato que ya deja el foco en su fila desde F2.7).

**Hecho cuando:** se cumplen los criterios de `pagina-proyecto.md` en escritorio y móvil. Etiqueta `v0.4.0`.

## F6 · Pulido

- Movimiento reducido completo, táctil, encuadre en los 6 tamaños de referencia, degradación de nivel en caliente.
- Presupuestos de Lighthouse CI activados en CI; revisión con NVDA; pruebas en un móvil real.
- Ficha de **Cosmos** con datos reales (proceso, retos, capturas; revisar el stack); imágenes Open Graph EN/ES; favicon.
- README del repo en inglés con capturas y arquitectura.

**Hecho cuando:** todas las métricas del brief se cumplen medidas en producción de preview. Etiqueta `v0.9.0`.

## F7 · Lanzamiento

- Dominio (D2) y `VITE_SITE_URL` de producción; cabeceras de seguridad; 404 real verificado.
- Analítica (D5), si se decide.
- Enlace al nuevo portfolio en GitHub, LinkedIn y CV; retirar o redirigir el sitio antiguo.

**Hecho cuando:** producción publicada, comprobada y enlazada. Etiqueta `v1.0.0`.

## Tareas de Víctor (en paralelo, fuera del código)

| Tarea | Necesaria para |
|---|---|
| ✔ Confirmar si el curso de Hola Mundo está terminado (sí: F2 · paso 2) | F2 (contenido) |
| ✔ Decidir si las estrellas de IA son prácticas o herramientas concretas (las dos: F2 · paso 2) | F2 (contenido) · F4.3 |
| Comprobar que el README de Chessmate incluye el script de consola | F2 (página de Chessmate) |
| CV en PDF, EN y ES | F2 o más tarde (el enlace aparece al existir) |
| Dominio propio (D2) y analítica (D5) | F7 |

## Backlog después de la v1

- Cielo real según la ubicación y la hora del visitante.
- Foto astronómica del día (NASA APOD), validando la respuesta en el borde.
- Sonido ambiente opcional y easter egg de «salto warp».
- Migración a Node 26 LTS; TypeScript 7 cuando `typescript-eslint` lo soporte.
