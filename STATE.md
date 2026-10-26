# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** **F3 · paso 2 hecho** (`main` en `feb3e3c`: F3.2 en PR #48, dominio en PR #49) · **AUD-F3-2**
entregada y decidida (corrige 1–10, con 2-A y 3-B), **sin corregir** · siguiente: corregir AUD-F3-2 y después
**F3 · paso 3** (`Particles` con el shader de morph y estrellas de fondo).

_Última actualización: 2026-10-26 (**CIERRE DE SESIÓN · 20**) · AUD-F3-1 corregida, las formas de la escena en un
worker (F3.2) y el sitio en su dominio propio, `tortoisecode.dev`. 995 unitarios y 187 e2e en Chromium; los tres
PR fusionados con el check obligatorio del CI._

**Hecho esta sesión** (vivas S20 en `_claude/cadena/hecho/2026-10-26/decisiones-vivas-S20.md`):
1. **AUD-F3-1 corregida** (PR #47, `86263e7`; vivas #7–#17): el plazo del contexto perdido solo corre con la
   página a la vista y al volver se pide un frame; el shader que no compila registra cada shader; WebGL2 por
   software arranca en Bajo (`detectWebGL2`); `SceneMount` en `Layout` (una sola región de aviso, también en la
   404); ESLint vigila `routes/`, `root.tsx` y los `import()` con ruta no fija; e2e con `data-ready`, recargar,
   el chunk que no llega y la 404; regla del bucle de frames en `rendimiento.md`; nota de ADR-020.
2. **EST-F3-2** (la Mesa estudió F3.2: 16 preguntas, todas A; vivas #18–#34) y **F3.2** (PR #48, `59da754`;
   vivas #35–#40): `scene/shapes` (prng/subSeed, noise, sampling, hexGrid, los 4 generadores con los números del
   prototipo, `shapeContract`, `generateShapes`), `scene/config` (`SCENE_SEED`, `SHELL`, `HEX_SIZE`,
   `plateSlots`/`assignPlates`), `scene/worker` (protocolo validado, un worker por encargo, 3 s) y
   `useSceneShapes` (reintento único en el hilo principal a Bajo con `lowerSceneLevel`; si falla, Apagado);
   `data-shapes`; ESLint (`Math.random`, imports del código puro); presupuestos del worker y del reintento;
   `formas.md` y `rendimiento.md` reescritos. ADR-026 y nota de ADR-011 (en este cierre).
3. **Dominio propio** (PR #49, `feb3e3c`; ADR-025; vivas #41–#49): D2 resuelta con `tortoisecode.dev`; `www` y
   `cosmos-portfolio-two.vercel.app` → 308 → apex; `VITE_SITE_URL` en Production y Preview. Comprobado en
   producción tras un Redeploy (canónica, `robots.txt`, `sitemap.xml`).
4. **AUD-F3-2** entregada (3 recomendados, 7 menores; sin bloqueantes) y decidida (viva #50); la corrección queda
   para la próxima sesión.

**Incidencias y lecciones:**
- **Vercel aplica un cambio de variable solo a los despliegues nuevos:** `VITE_SITE_URL` se guardó con el build
  del merge ya en marcha y producción salió con la URL vieja. Redeploy sin caché y se arregló (lo recoge
  `git-y-despliegue.md`).
- **Rolldown `INEFFECTIVE_DYNAMIC_IMPORT`:** el protocolo importaba `generateShapes` y los generadores entraban en
  el chunk de `SceneRoot`; por eso el contrato va aparte (`shapeContract`, ADR-026). Mirar ese aviso en el build.
- El worker sale en IIFE aunque se cree con `type: 'module'` y funciona: `vite.config.ts` no se tocó. Probado en
  `npm run dev` (formas del worker en `/`, una ficha y `/es`).
- `projectEntries` en la escena lo saca a un chunk compartido `entries-*` (y aparece `preload-helper-*`) que
  piden también las páginas; presupuestos del JS inicial en verde.
- **React 19 registra con `console.error` todo error que recoge un boundary:** un fallo de escena deja dos
  registros. El Chromium headless (SwiftShader) da WebGL2 solo por software: los e2e montan la escena en Bajo.
- Los tests de repo cazan dos cosas al escribir código nuevo: ninguna clave del buzón en el código
  (`code-references.test.ts`) y ningún archivo solo en una carpeta con su nombre (`structure.test.ts`).
- **Método del contenedor:** Node 24 con `npm pack node-linux-x64@24.22.0`, `PLAYWRIGHT_BROWSERS_PATH` propio con
  enlaces `chromium*-1248 → -1243`, árbol por `tar` desde `_claude/cadena/tmp/` y vuelta con `tar --overwrite` +
  md5 de cada archivo y de todo el árbol. Los commits de marca del contenedor hacen saltar el aviso de push:
  al acabar, dejar la copia del contenedor en `origin/main` (nunca push). En el equipo, nunca `git diff` contra el
  árbol de trabajo (se usó una vez por error; no dejó `index.lock`).

**Deuda anotada:**
- **F3.3 · peso de la escena:** 241,6 KB de 250 con el lienzo vacío y las formas pedidas (R3F importa Three.js
  entero; los generadores van aparte: worker 4,4 KB y reintento 3,8 KB, ADR-026). Si los shaders y `Particles` lo
  pasan, decidir (subir el límite con ADR, importar menos de Three…) antes de tocar el número.
- **F3.3:** antes de pintar partículas, `--z-content` en el contenido de los capítulos (hoy solo el hero) y los
  estilos que cuelgan de `no-gl` (fondo, relevo del punto del hero); hoy la clase solo marca.
- **F3.3 · shader (notas de AUD-F3-2):** las placas pasan de las etiquetas 2..4 del prototipo a 20..26: en el
  shader del prototipo caerían en `tag > 13.5` (el color del plastrón), hay que reescribir esa cadena de `if`.
  `uPlate = 0` como «ninguna» solo es seguro si `abs(tag − uPlate)` va **dentro** de la rama de placas (la
  etiqueta 0 es la base del caparazón). En Bajo la estela se esconde con un uniform (el generador no mira el
  nivel). Los tipos vienen de `scene/shapes/shapeContract`. Errores del bucle de frames: decidir el mecanismo
  con el primer `useFrame` (`rendimiento.md` → «Robustez»).
- **F3.6 · regenerar a media visita (AUD-F3-2-3-B):** hoy cualquier cambio de `count` pasa por `obtainShapes`,
  que reintenta en el hilo principal y, si falla, apaga la escena. F3.6 debe regenerar con `loadShapes` sin
  reintento y, si falla, quedarse como estaba. Pregunta de orden: si se baja el nivel antes de regenerar,
  «dejar el nivel actual» ya no es posible.
- **Generación de 60.000 partículas:** ~0,4 s en el contenedor (casi todo la nube de la nebulosa; algoritmo del
  prototipo). Pasa el límite de 1 s; si en el CI o en un móvil real pesa, mirarlo allí antes de tocar nada.
- **CI · Firefox y WebKit:** no sabemos si tienen WebGL2 ni si solo por software (desde P1-B arrancarían en Bajo);
  los e2e con WebGL se omiten si no lo hay. Mirarlo en el log de un PR.
- **R3F 9.8.1 + three 0.186:** `console.warn` «THREE.Clock: This module has been deprecated» al montar el lienzo.
  Se va cuando R3F use `THREE.Timer`: mirarlo al subir R3F.
- **F6 · NVDA:** el aviso sin WebGL se descarta con «Got it» y el foco cae al `body` (igual que «No, gracias»).
- **F6 · fuentes:** IBM Plex Mono no se precarga y pinta la primera pantalla (barra, metadatos de la ficha, HUD,
  eyebrows). Desde #43 sus reservas miden lo mismo por letra (0,6 em) y el cambio ya no mueve las líneas; valorar
  precargarla midiendo la LCP, y mirar en un Windows real cómo se ve Courier New mientras llega.
- **CI:** cada job de e2e descarga la imagen de Playwright (~2 GB). Si el CI vuelve a ir lento, medir cuánto es
  la descarga antes de tocar nada. Subir `@playwright/test` = subir cada `image:` de `ci.yml` (ADR-024).
- **F6 · Lighthouse:** aviso sin peso `label-content-name-mismatch` en EN / ES (se ve «EN», el nombre accesible
  es «English», decidido en `componentes.md`): revisarlo con NVDA y control por voz. Hasta F6, Lighthouse se pasa
  a mano al cerrar cada fase y se apunta en `calidad.md` → «Mediciones» (en local y, con PageSpeed Insights, en
  producción).
- **F3–F4 · móvil:** a 390 px el raíl (y cualquier ancla) cae en el capítulo con la escena primero
  (`03-tortuga.md` → «Móvil»); en F2 son ~700 px vacíos. La escena los llena; `recruiter.spec.ts` fija que las filas
  quedan a **un** deslizamiento y avisará si el hueco crece.
- **Imágenes (F2.8):** Vercel no guarda la caché de `vite-imagetools`, así que cada despliegue genera las 128
  variantes (~1 min más; ADR-023). La LCP de las fichas es la portada: medida al cerrar F2 (`calidad.md` →
  «Mediciones»); en local pasa algo de 2,5 s y en producción no: vigilarla en F6.
  El `og:image` de las fichas mide ~1200×576 (proporción de la captura, no 1,91:1): ver cómo lo recortan las redes
  cuando se hagan las imágenes del sitio (F6). Las capturas traen de origen la barra de scroll del navegador a la
  derecha: recortarla en F6 si molesta. En el contenedor solo corre Chromium: Firefox y WebKit de
  `project-images.spec.ts` se ven en el CI.
- **`sizes` (AUD-F2-8):** los cortes no cuentan una barra de scroll clásica de escritorio: en esa franja de ~15 px
  se pide una variante algo menor, que solo se nota a densidad 2. Si cambian `--read-w`, `--project-col-min`,
  `--space-3` o `--gutter`, `imageSizes.test.ts` falla y hay que revisar `PROJECT_LAYOUT`.
- **F6:** mirar si al navegar dentro del sitio a una ficha se pide también la WebP de 1920 (`src`) además de la
  AVIF elegida (sin evidencia; la Mesa lo dejó como comprobación: `page.on('request')` yendo de `/` a «View
  project»).
- **Windows/Edge:** comprobar a mano que abrir y cerrar «Quick mission» no hace saltar la página de lado
  (`scrollbar-gutter`), si no se hizo.
- **F6 · iPhone real:** el aire de arriba de la ficha con la zona segura (headless no la tiene).
- **F5:** la placa iluminada al volver lee `uiStore.visitedProject` (el mismo dato del foco en la fila).
- En el visor y en la misión rápida (modal nativo), el Tab puede pasar por la interfaz del navegador antes de volver
  al diálogo: la página sigue inerte. Aceptado; mirarlo con NVDA en F6.
- **F6 · NVDA:** el foco al nombre del proyecto al llegar a una ficha (también al cambiar EN / ES); tras «No,
  gracias» el aviso desaparece y el foco cae al `body`; antes de hidratar, «Quick mission» no hace nada; en modo
  exploración, NVDA/JAWS activan con un clic sintético que el `HoldButton` ignora.
- **F6 · tableta:** entre 520 y 900 px el HUD (abajo a la izquierda) pasa por encima del texto del panel al hacer
  scroll, como el prototipo (es decorativo y sin puntero), y la sugerencia de idioma lo tapa hasta que se contesta.
- **F6 · texto al 200 %:** a 390 px, las filas de Proyectos del viaje se salen del ancho (`scrollWidth` ≈ 605 px).
  La ficha de proyecto y la 404 no (lo vigila `project-page.spec.ts`).
- **F6:** el «≈» de los eyebrows, los superíndices `⁰ ⁴–⁹ ⁻` y el «∞» del HUD salen con la mono del sistema
  (excepción en `design-system.md` → «Iconos»): mirarlo en los tres motores. El hero en un móvil real y el CLS.
- El `useLayoutEffect` del HUD (sin parpadeo al cambiar de idioma) no tiene test: mirarlo con Performance en F6.
- El e2e de alto contraste y el de copiar al portapapeles solo corren en Chromium.
- ADR-022 (entre features, solo contratos sin React) no lo vigila ESLint: se revisa en las auditorías.
- Grupos de Skills enfocables (`tabindex`) solo en **F4.3**, cuando enciendan su constelación.
- Iconos de GitHub y LinkedIn: hoy enlaces de texto + icono externo; decidir si se dibujan en F6.
- **WebKit descarga dos veces las fuentes precargadas** (bug 194589): en F6, medir en un Safari real.
- Contraste AA sobre el velo de los paneles (`--color-veil`) encima de la escena: F3–F4 (ADR-015).
- La lista de valores neutros del test de colores obliga a ampliarla con un valor legítimo nuevo (a propósito).
- `@lhci/cli` y los scripts `visual` / `lhci` se instalan en F3/F6.
- **F7:** que `/es/*` reciba la 404 ES y que las 404 salgan con estado 404 real en Vercel (en `preview` salen con
  200); comprobar el `X-Robots-Tag: noindex` de las previews (ahora más importante: su canónica apunta a
  `tortoisecode.dev`, ADR-025); **`cleanUrls: true`** en `vercel.json`.
- Provisional: `favicon.svg` (F6).
- **React Router 8.4 no pasa `caseSensitive` a las rutas del cliente:** lo cubre `isLowerCasePathname`. Al
  actualizar React Router, comprobar si ya lo pasa.
- Si alguna ruta lanza un 404 desde un `loader` (`throw data(null, { status: 404 })`), choca con
  `@typescript-eslint/only-throw-error`: configurar el `allow` de la regla. Hoy ninguna lo hace.
- **F3.5:** la escena deja de pintar con `quickMissionOpen` de `uiStore` y suaviza `m`; hasta entonces
  `setScrollTarget` escribe `m = mTarget` (ADR-021 → Consecuencias). Hoy pinta bajo demanda (un frame).


**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`). **Corregir AUD-F3-2** (1–10, con 2-A y 3-B) en
   `fix/aud-f3-2`, su propio commit; detalle en `_claude/cadena/aud-f3-2/auditoria.md`. Al hacerlo: el punto 9
   (fila de `uiStore` en `arquitectura.md`) ya no choca con el dominio (fusionado); traer de nuevo el árbol al
   contenedor (la copia de allí está en `acd72a9`).
2. **F3 · paso 3** (esquema → VB): `Particles` con el shader de morph entre las 5 formas y estrellas de fondo
   (`docs/04-escena/particulas-y-shaders.md`), con la deuda de F3.3 de arriba. Ojo al presupuesto de la escena.

**Dudas abiertas:** D5 · analítica (F7). Tareas de Víctor: script de consola en el README de Chessmate (lo cita el
«Try it»), CV en PDF EN/ES.
**Limpieza manual del usuario:**
- Ramas locales ya fusionadas: `feat/f3-1-scene-mount`, `docs/session-close-2026-10-26-2`,
  `docs/session-close-2026-10-26-3`, `fix/aud-f3-1`, `feat/f3-2-shapes`, `chore/domain-tortoisecode`, y la de
  este cierre (`docs/session-close-2026-10-26-4`) cuando se fusione.
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` (`arbol*.tar.gz`, `cambio*.tar.gz`, `cambio*.md5`,
  `*.blobs`, `cierre-s*.tar.gz`, `s16-files.list`, `STATE-*.md`) y, dentro de `_claude/cadena/hecho/` y de
  `_claude/cadena/aud-f3-2/`, los `arbol.tar.gz` y `cambio.diff` (nunca la carpeta `_claude/cadena/`).

**Bloqueos:** ninguno.
