# Roadmap

> Fases en orden. Cada fase termina con: `npm run check` y CI en verde, auditoría con mirada fresca
> (`code-audit` o la Mesa), `STATE.md`/`DECISIONS.md` al día y una etiqueta de versión.
> Dentro de cada fase se trabaja con el ciclo: `session-start` → esquema → **Visto Bueno** → pasos pequeños
> con commit → auditoría → `session-close`. Una rama y un PR por tarea (los commits de solo documentación van
> directos a `main`, ADR-033).

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
   *(Hecho en F2.8: 21 capturas de Chessmate y AstroHub en AVIF/WebP con `vite-imagetools`, portada = captura de
   Inicio, `og:image` de las fichas y e2e del visor; ADR-023. Cosmos, sin imágenes hasta F6.)*

**Hecho cuando:** el sitio completo se puede usar y desplegar sin escena; Lighthouse Accessibility ≥ 95 y SEO ≥ 95;
recorridos e2e del recruiter en verde. Etiqueta `v0.1.0`. *(Se podría publicar ya.)*
*(Cerrada el 2026-10-26: Accessibility y SEO 100 en local y en producción, `docs/05-tecnico/calidad.md` →
«Mediciones»; `recruiter.spec.ts` en verde; `v0.1.0` y `v0.1.1` con las correcciones de la auditoría de cierre.)*

## F3 · Motor de escena

1. `SceneMount` diferido, detección de WebGL2, niveles de rendimiento y `ErrorBoundary` de escena. Antes de
   importar la escena, sacar `three` y `@react-three/*` del grupo `framework` de `vite.config.ts` (ADR-020).
   *(Hecho en F3.1: lienzo vacío en su chunk `scene`, que ningún HTML pide; modo sin WebGL con su aviso. La
   degradación en caliente pasa al paso 6, con partículas que medir.)*
2. Utilidades puras (PRNG, ruido, hex) y generadores de las 4 formas en el worker, con sus tests.
   *(Hecho en F3.2: `SceneRoot` pide las formas al montar y las guarda sin pintar; si el worker falla, una vez
   en el hilo principal a nivel Bajo, y si no, Apagado. Worker y reintento con presupuesto propio.)*
3. `Particles` con el shader de morph entre las 5 formas; estrellas de fondo. Antes de pintar partículas, el
   contenido de los capítulos va por encima del lienzo (`--z-content`; hoy solo lo lleva el hero) y lo que
   cuelga de la clase `no-gl` (fondo, relevo del punto del hero) se ajusta a lo que ya pinta la escena.
   *(Hecho en F3.3: `main` por encima del lienzo y fondo estático sin WebGL; partículas con el morph entre las 5
   formas, estrellas de fondo y un bucle de frames propio (ADR-027); cámara fija provisional hasta el paso 4.)*
4. `CameraRig` con keyframes, encuadre por capítulo, FOV para móvil y paralaje.
   *(Hecho en F3.4: la cámara sigue a `m` por los 5 keyframes, se aparta a un lado en escritorio con la misma
   media query que los paneles, abre el campo de visión en pantallas estrechas y se mueve un poco con el ratón;
   las cifras del prototipo, ajustadas con capturas en F3.6c.)*
5. Puente `sceneStore` ↔ scroll (el scroll ya escribe `mTarget` desde F2.5, ADR-021: la escena pasa a suavizar `m`);
   pausa con pestaña oculta y en misión rápida (`quickMissionOpen` de `uiStore`, desde F2.6).
   *(Hecho en F3.5: la escena suaviza su propia `m` desde `mTarget` y arranca en él; la interfaz sigue a saltos
   (ADR-028). El bucle se pausa con la pestaña oculta o la misión rápida abierta.)*
6. Primeras capturas de regresión visual (Docker) y medición de fps; degradación en caliente de nivel (media de
   fps en ventanas de 2 s, `docs/04-escena/rendimiento.md` → «Degradación en caliente»).
   *(Degradación en caliente hecha en F3.6a: un nivel cada vez; pide las formas del worker y, si llegan, formas y
   nivel cambian en el mismo turno; si no llegan, se queda como está. En F3.6b, las capturas: un estado por
   capítulo en 1440×900 y 390×844, con movimiento reducido, en Docker y en el CI (`calidad.md` → «Regresión
   visual»). En F3.6c, el encuadre: cámaras
   algo más lejos y cada forma centrada entre panel y raíl, medido con capturas en los 6 tamaños de referencia
   (`camara-y-encuadre.md`); en su segunda parte, los fps medidos en un equipo real (60 estables en Alto, el
   shader no se toca: `calidad.md` → «Mediciones») y los e2e de Chromium en Bajo, como las capturas.)*
7. Ficha de **Cosmos** con la escena: el resumen final, «Scroll-driven particle morphing…», «Works without WebGL…»
   (en lugar de «Readable without JavaScript…») y Three.js / React Three Fiber / GLSL en el stack
   (`docs/01-contenido/proyectos/cosmos.md`).
   *(Hecho en F3.7: la ficha y su fila del viaje ya cuentan la escena; las constelaciones y placas, en F4.)*
8. WebGL pintado por software → sin escena (ADR-029): la detección mira también el `renderer`, y los e2e y las
   capturas piden Bajo sin fingir «software».
   *(Hecho en F3.8: `isSoftwareRenderer` y «software» → Apagado; los e2e y las capturas se presentan como GPU con
   poca memoria —Bajo en los tres motores— con `forceLowScene`.)*
9. Fotos fijas de las formas en el modo sin WebGL (ADR-029): un script en Docker las saca de la escena real
   (escritorio y móvil) y el CSS de `no-gl` pinta la del capítulo activo.
   *(Hecho en F3.9: `npm run stills` y `SceneStills` en el viaje, con la foto del capítulo activo fundida con
   `screen` y su huella vigilada por los e2e; `assets.md` → «Fotos fijas de la escena».)*

**Hecho cuando:** el viaje se ve de punta a punta con las 5 formas, 60 fps en escritorio y sin errores con WebGL
desactivado. Versión 0.2.0, auditoría de cierre y etiqueta `v0.2.0` sobre el último commit del cierre
(`git-y-despliegue.md`).
*(Versión 0.2.0 medida el 2026-10-30: Performance 100 en PageSpeed y 95–100 en el build local, sin escena donde
no hay GPU; `docs/05-tecnico/calidad.md` → «Mediciones». Auditoría de cierre corregida en el PR #80 y etiqueta
`v0.2.0` sobre `6b46c7d` el 2026-10-31: **F3 cerrada**.)*

## F4 · Capítulos (uno por PR, salvo la galaxia, en tres; en este orden)

1. **Singularidad:** mantén para detonar (puntero y teclado), destello, temblor, nombre con `wdth`, autoscroll.
   *(Hecho en F4.1, PR #82: la carga llega a la escena y los efectos del DOM tienen su propio bucle con la misma `m`
   suavizada, ADR-030.)*
2. **Nebulosa:** protoestrella y gravedad del cursor.
   *(Hecho en F4.2, PR #83: la protoestrella ya venía de F3; la gravedad del cursor, conectada, con la misma
   intensidad en todos los capítulos hasta que F4.3 y F4.5 ajusten los suyos.)*
3. **Galaxia:** 4 constelaciones, etiquetas proyectadas, encendido sincronizado con el panel (ratón, foco, toque);
   test de no solapamiento.
   *(En tres PR: F4.3a, el peso de la escena (ADR-032: 260 KB) y las posiciones con su test de no solapamiento;
   F4.3b, la escena, las etiquetas y el grupo activo, con las fotos y la captura de la galaxia; F4.3c, el panel, el
   táctil y los e2e de la interacción. Hecho: F4.3a (PR #87), F4.3b (PR #88) y F4.3c (PR #94).)*
*(Los pasos 4 y 5 esperan a la fase C, «Contenido y secciones nuevas», que va entre F4.3 y F4.4: ADR-034.)*

4. **Tortuga:** placas por huecos, pins, ciclo automático, resaltado sincronizado con las filas.
5. **Tierra:** día/noche, amanecer, luces de ciudad, atmósfera y Sol.

Con la galaxia y la tortuga hechas (pasos 3 y 4), la ficha de **Cosmos** suma sus constelaciones: entró en C.5
como «Skill constellations that light up with the mouse, keyboard or touch»; las placas, cuando tengan interacción
(F5) (`docs/01-contenido/proyectos/cosmos.md` → «Features»).

En cada paso que cambie lo que se ve de la escena (formas, shaders, cámara, placas, el Sol): `npm run stills` y las
fotos nuevas en el mismo PR (ADR-029; el e2e de su huella lo recuerda). Si el paso crea una carpeta nueva en
`scene/` que cambie las fotos, se añade a `STILLS_SOURCES` (`tests/stills/fingerprint.ts`).

**Hecho cuando:** cada capítulo cumple sus criterios de aceptación de `docs/02-experiencia/capitulos/`.
Etiqueta `v0.3.0`.

## C · Contenido y secciones nuevas (entre F4.3 y F4.4; ADR-034)

El portfolio acompaña al CV en las candidaturas desde el 25 nov 2026, y el pulido acaba el 1 dic. Antes de seguir con
la escena, el contenido se alinea con el CV y el viaje gana dos interludios y un epílogo que rompen su ritmo (panel
de texto sobre la escena, cinco veces seguidas). Diseño aprobado: «transmisiones» por canal de color
(`docs/03-diseno/design-system.md` → «Transmisiones»; spec de cada una en `docs/02-experiencia/capitulos/`). Un PR
por paso, en este orden:

1. **Alinear el contenido con el CV** (objetivo: 20 nov): email `victorperez@tortoisecode.dev`; formación «Advanced
   Course in Web Programming (Full-Stack)», Master.D, ene 2023 – oct 2024, 975 h; bio nueva (Física en 2019 con
   Python, vuelta en 2022, el curso y las prácticas); el nombre del curso en AstroHub; la frase del flujo con IA en
   Cosmos; el CV en PDF en `public/` y su enlace en los dos idiomas (el PDF es el inglés). Cada vez que cambie el
   CV, se vuelve a copiar.
   *(Hecho: PR #95.)*
2. **Interludios y Mission log** (objetivo: 23 nov): el tipo de sección «interludio» (`mapM` con tramos que mantienen
   `m`, raíl, anclas, HUD con el reloj parado, misión rápida) y el primero, tras About: la experiencia (Software
   Developer Intern, Studios Demanzon, jul – oct 2026) como registro de misión, con el permiso de trabajo y la
   disponibilidad en Contacto. «Strengths» sale de About.
   *(Hecho: PR #97. `m` por tramos (`JOURNEY_SEGMENTS`); la cola del interludio cambia la nebulosa a galaxia; las
   viñetas van suavizadas, sin decir qué es el producto de la empresa; la frase del CTO, con su permiso. Su auditoría,
   corregida entera: PR #99.)*
3. **Galaxia de skills** (objetivo: 25 nov, con la auditoría de F4.3c ya corregida): sale Bootstrap; entran Next.js,
   NestJS, Electron, n8n, npm, pnpm y GLSL. Posiciones, líneas, test de no solapamiento, fotos fijas y peso.
   *(Hecho: PR #98. 37 estrellas; «TanStack Query» y «Tailwind CSS» como el CV, también en la ficha de Chessmate;
   +127 B de escena. Su auditoría y los menores de F4.3c, corregidos: PR #100 y #101.)*
4. **Mission control** (objetivo: 27 nov): segundo interludio, tras la tortuga: cómo trabajo, en una cuenta atrás
   (plan, Visto Bueno, construcción, auditoría, CI en verde) que desemboca en la Tierra («Touchdown»).
   *(Hecho: PR #102. Las cifras de la telemetría se cuentan al construir (ADR-035); la tortuga cambia a la Tierra en
   la cola del interludio; canal azul a tokens con su AA. Su auditoría, corregida entera: PR #104. Aparte, la ficha de
   proyecto con velo y la escena pausada hasta F5: PR #103.)*
5. **Cosmos completo** (objetivo: 29 nov): ficha con proceso y puntos técnicos reales; README del repo en inglés y
   su descripción de GitHub (lo que F6 tenía para Cosmos se adelanta aquí).
   *(Con Visto Bueno, sesión 38: el detalle de las fichas sale del JS de la home y lo importa solo la página de
   proyecto; README con siete capturas (al principio eran cuatro); `metaDescription` solo para Cosmos; la ficha sigue sin imágenes hasta F6. Hecho: PR #105, y la corrección de su auditoría, PR #106.)*
6. **Epílogo · Crew file** (objetivo: 1 dic): capítulo 5 bajo la Tierra; el retrato de Víctor en partículas (forma 6,
   cargada como dato), la ficha con la formación (se muda de Contacto) y «Download CV». Antes de tocar el repo, una
   prueba del retrato fuera de él; si no convence, el epílogo se queda con la ficha. *(En dos PR: C.6a, el epílogo
   sin retrato —capítulo 5 en el canal verde, la ficha con los idiomas y la formación, el CV, el pie del sitio, el raíl
   de ocho paradas que encogen en un móvil apaisado y Contacto que cambia en su segunda mitad—; C.6b, el retrato con
   la transición del haz de barrido. Detalle en `05-crew-file.md`. Hechos: C.6a, PR #107; C.6b, PR #108; la
   corrección de la auditoría de C.6a, en su PR.)*
7. **Naves** (idea de Víctor aprobada, sin calendario: después de C.6 o en el pulido). La escena trae cada
   transmisión: la nebulosa se convierte en un satélite que se acerca hasta que su pantalla llena la vista; la
   transmisión se lee a pantalla completa, como hoy, y al salir el satélite se aleja llevándose la pantalla con el
   texto. En Mission control, una nave nodriza; el retrato llega directo desde la Tierra. Prueba fuera del repo hecha
   (versión 8); falta ADR-037 y un PR: `docs/02-experiencia/transiciones-naves.md`.

**Hecho cuando:** el sitio no contradice el CV, los dos interludios y el epílogo cumplen sus criterios (un doc por
sección en `docs/02-experiencia/capitulos/`, escrito en su paso) en escritorio y móvil, sin WebGL y con movimiento
reducido. Después siguen F4.4 y F4.5; F5 pasa seguramente a después del 1 dic.

## F5 · Transiciones a proyectos

- Lienzo persistente entre rutas, vuelo de cámara a la placa, escena atenuada en la página de proyecto (y en la
  404, la nebulosa atenuada y a la deriva de `estados-y-accesibilidad.md`; hasta entonces la 404 enseña la
  singularidad, que cae bajo el título a 1440×900 y entre el título y la frase a 390×844: con la nebulosa, un e2e
  de que no tapa el texto, como el del hero),
  anterior/siguiente, vuelta con la posición restaurada, carga directa sin Big Bang. La placa que se ilumina al
  volver es la de `uiStore.visitedProject` (el mismo dato que ya deja el foco en su fila desde F2.7).
- Al atenuar la escena en la ficha, quitar el arreglo de mientras tanto (`pagina-proyecto.md` → «Hasta F5»): el velo
  de `ProjectPage.module.css` y la pausa por `uiStore.projectPageOpen` (`scene/pause`), con su e2e de `scene.spec.ts`.

**Hecho cuando:** se cumplen los criterios de `pagina-proyecto.md` en escritorio y móvil. Etiqueta `v0.4.0`.

## F6 · Pulido

- Movimiento reducido completo, táctil, encuadre en los 6 tamaños de referencia, degradación de nivel en caliente.
- Presupuestos de Lighthouse CI activados en CI; revisión con NVDA; pruebas en un móvil real.
- ✔ Ficha de **Cosmos** con datos reales (proceso, retos y funcionalidades; el stack revisado): adelantada a C.5.
  Quedan aquí sus capturas (portada y galería). Imágenes Open Graph EN/ES; favicon.
- ✔ SEO de las fichas: la meta description de Cosmos pasaba de 220 (EN) y 228 (ES) caracteres; adelantado a C.5
  con un `metaDescription` opcional (≤ 160, solo Cosmos; las demás siguen con el `summary`).
- ✔ README del repo en inglés con capturas y arquitectura: adelantado a C.5 (siete capturas en `docs/readme/`), y
  la nota de la ficha de Cosmos vuelve a citarlo.

**Hecho cuando:** todas las métricas del brief se cumplen medidas en producción de preview. Etiqueta `v0.9.0`.

## F7 · Lanzamiento

- ✔ Dominio (D2): `tortoisecode.dev` (ADR-025, adelantado a F3). Pendiente: cabeceras de seguridad; 404 real
  verificado.
- Analítica (D5), si se decide.
- Enlace al nuevo portfolio en GitHub, LinkedIn y CV; retirar o redirigir el sitio antiguo.

**Hecho cuando:** producción publicada, comprobada y enlazada. Etiqueta `v1.0.0`.

## Tareas de Víctor (en paralelo, fuera del código)

| Tarea | Necesaria para |
|---|---|
| ✔ Confirmar si el curso de Hola Mundo está terminado (sí: F2 · paso 2) | F2 (contenido) |
| ✔ Decidir si las estrellas de IA son prácticas o herramientas concretas (las dos: F2 · paso 2) | F2 (contenido) · F4.3 |
| Comprobar que el README de Chessmate incluye el script de consola | F2 (página de Chessmate) |
| ✔ CV en PDF (el inglés sirve para los dos idiomas; en `public/` desde C.1, copia del CV maestro) | F2 o más tarde (el enlace aparece al existir) |
| ✔ Dominio propio (D2: `tortoisecode.dev`, comprado en F3) · analítica (D5) | F7 |

## Backlog después de la v1

- Cielo real según la ubicación y la hora del visitante.
- Foto astronómica del día (NASA APOD), validando la respuesta en el borde.
- Sonido ambiente opcional y easter egg de «salto warp».
- Migración a Node 26 LTS; TypeScript 7 cuando `typescript-eslint` lo soporte.
