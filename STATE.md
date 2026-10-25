# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** F2 · paso 8 en `main` y **AUD-F2-8 corregida** (PR #35, `e0dce6a`) · la cadena no tiene
encargos abiertos · siguiente: **cierre de F2** (`v0.1.0`).

_Última actualización: 2026-10-25 (**CIERRE DE SESIÓN · 16**) · AUD-F2-8 corregida entera en 5 commits (PR #35,
squash): alt de AstroHub, galerías atadas a su ficha, `sizes` desde los tokens, regla 5 sobre el build, e2e de
imágenes que prueban lo que dicen y docs. 813 unitarios y 167 e2e en Chromium; CI en verde en los tres
navegadores._

**Hecho esta sesión** (vivas S16 en `_claude/cadena/hecho/2026-10-25/decisiones-vivas-S16.md`):
1. **AUD-F2-8 decidida** (vivas S16 #1): Víctor corrige los 17 hallazgos y las 2 preguntas; 1-A, 2-B+C, P1-A, P2-A.
2. **Contenido** (C1): los tres `alt` EN de AstroHub decían `astrohubNews` / `astrohubAppointments`. `content.test.ts`
   fija ahora `EXPECTED_MEDIA` (alt de la portada y galería [archivo, EN, ES] en orden, copiada de las fichas).
   `findProjectMediaProblems` (`validate.ts`, con casos rotos): con galería, portada obligatoria e igual a la 1.ª
   captura, imagen para compartir de 1200 px y sin capturas repetidas. La home y la misión rápida importan
   `projectEntries` (ya no cargan las imágenes); `ProjectRow` y `QuickProject` reciben `ProjectEntry`.
3. **`sizes`** (C2): `features/project/imageSizes` (`PROJECT_LAYOUT`, `coverSizes`, `thumbSizes`): portada
   `(min-width: 768px) 696px, 100vw`; miniaturas `(min-width: 732px) 232px, (min-width: 484px) 50vw, 100vw`. Su
   test compara las medidas con `tokens.css` y con los CSS de página y galería.
4. **Tests y configs** (C3): `src/content/imageWidths.ts` (anchos de las variantes y 1200 px), que leen
   `vite.config.ts`, el sustituto de Vitest (ahora recorta los anchos como imagetools, sin ampliar), las reglas y
   los e2e. Nuevos e2e: regla 5 sobre cada `<picture>` y `og:image` de las fichas del build; la home sin imágenes;
   a densidad 1 y en el formato que elija cada navegador, miniatura de 640 y visor de 1920 a 1440 px (WebKit ya no
   se salta); CLS también con una miniatura que llega tarde, tras aplicarse la CSS; visor `contain` dentro de la
   pantalla; cuentas exactas (55 / 73 / 128, derivadas de los anchos); `WITH_COVER` solo con proyectos que existen.
5. **CI** (C4): `restore-keys: imagetools-` y la clave suma `imageWidths.ts`.
6. **Docs** (C5): ADR-023 (forma de dev, listas a mano, ~13,2 MB, `projectEntries` en el viaje), tabla de capas y
   mensaje de ESLint (`media.ts` importa capturas), `sitePages(projectEntries)`, componentes, assets,
   modelo-de-datos (regla 5 y árbol con `validate/`), secuencia de carga (LCP de las fichas), cosmos.md y
   `calidad.md` (y `DEVELOPMENT_RULES` §11): abrir `npm run dev` si se toca la config de Vite (P1-A).

**Incidencias y lecciones:**
- **Romper `aspect-ratio` no hace fallar el e2e de CLS, y está bien:** los `width`/`height` del `<img>` reservan
  el hueco igual. Para ver que el test caza el salto hay que quitar las dos cosas (salta 162 px). Cada test nuevo
  se probó contra su rotura: `sizes` de la miniatura y del visor, la home con `projects`, presets sin `sort` o con
  la WebP menor de respaldo, `object-fit: cover` y un slug inventado en `WITH_COVER`.
- **vite-imagetools no amplía** (sin `allowUpscale`, recorta `w` al ancho del PNG y quita repetidos) y nombra cada
  variante en caché con el hash de su config + los bytes del PNG: por eso `restore-keys` es seguro. Visto en su
  código, no supuesto.
- Un `alt` mal escrito pasó Vitest, los e2e y la revisión del PR: solo lo vio la Mesa. La lista escrita a mano
  de cada galería lo vigila ahora.
- Método de siempre en el contenedor (Node 24.22.0 de `node-linux-x64`, enlaces `chromium*-1248 → -1243`, `.env`,
  clon de GitHub y md5 de la carpeta antes de empezar). C1 se pasó solo; C2–C5 juntos tras su commit, porque no
  compartían archivos con C1 salvo `ProjectPage.test.tsx` (cada uno con su `arbol-s16-cN.tar.gz` + `s16-cN.blobs`,
  `cat > destino` y `git hash-object`; md5 de los 309 archivos igual). `HEAD^{tree}` de `main` tras el squash =
  el del contenedor. El aviso de push del contenedor se ignora.

**Deuda anotada:**
- **Imágenes (F2.8):** Vercel no guarda la caché de `vite-imagetools`, así que cada despliegue genera las 128
  variantes (~1 min más; ADR-023). La LCP de las fichas es la portada: medirla con Lighthouse al cerrar F2 y en F6.
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
- **Antes de etiquetar `v0.1.0` o enseñar una preview (P5):** la ficha de Cosmos (`src/content/projects/cosmos.ts`)
  lista funcionalidades y stack de F3–F5 (partículas, constelaciones, Three.js / R3F / GLSL): recortarlos a lo
  hecho o esperar a tenerlos (`docs/01-contenido/proyectos/cosmos.md`: «no se publica nada que no esté hecho»).
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
- **F3:** la escena deja de pintar con `quickMissionOpen` de `uiStore` (roadmap F3.5); la escena suaviza `m`; hasta
  entonces `setScrollTarget` escribe `m = mTarget` (ADR-021 → Consecuencias).
- **F3.1:** el `test` del grupo `framework` de `vite.config.ts` es todo `node_modules`: excluir `three` y
  `@react-three/*` antes de importar la escena en diferido (ADR-020 → Consecuencias; roadmap F3.1).
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
  200); comprobar el `X-Robots-Tag: noindex` de las previews; **`cleanUrls: true`** en `vercel.json`.
- Provisional: `favicon.svg` (F6).
- **React Router 8.4 no pasa `caseSensitive` a las rutas del cliente:** lo cubre `isLowerCasePathname`. Al
  actualizar React Router, comprobar si ya lo pasa.
- Si alguna ruta lanza un 404 desde un `loader` (`throw data(null, { status: 404 })`), choca con
  `@typescript-eslint/only-throw-error`: configurar el `allow` de la regla. Hoy ninguna lo hace.

**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`).
2. **Cierre de F2** (esquema → VB):
   - Antes, recortar la ficha de Cosmos a lo hecho (deuda de arriba).
   - Lighthouse Accessibility ≥ 95 y SEO ≥ 95 (y medir la LCP de las fichas), y recorridos e2e del recruiter
     (`docs/06-roadmap/roadmap.md` → F2, «Hecho cuando»).
   - Etiqueta `v0.1.0`.
   - Auditoría de cierre de fase con la Mesa si Víctor la quiere.

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7). Tareas de Víctor: script de consola en el
README de Chessmate (lo cita el «Try it»), CV en PDF EN/ES.
**Limpieza manual del usuario:**
- Ramas locales ya fusionadas: `git branch -D feat/scroll-nav-hud docs/session-close-2026-10-23-4
  docs/session-close-2026-10-23-5 fix/aud-f2-5 docs/session-close-2026-10-24 feat/quick-mission
  docs/session-close-2026-10-24-2 feat/project-page docs/session-close-2026-10-24-3 fix/aud-f2-6
  docs/session-close-2026-10-24-4 fix/aud-f2-7 docs/session-close-2026-10-25 feat/project-images
  docs/session-close-2026-10-25-2 fix/aud-f2-8`, y `docs/session-close-2026-10-25-3` cuando se fusione.
- En el buzón se pueden borrar `_claude/cadena/tmp/arbol*.tar.gz`, `_claude/cadena/tmp/*.blobs`,
  `_claude/cadena/tmp/s16-files.list`, `_claude/cadena/tmp/STATE-s16.md`, `_claude/cadena/tmp/cierre-s13.tar.gz` y
  `_claude/cadena/tmp/STATE-cierre-s12.md` y, dentro de `_claude/cadena/hecho/`, los `arbol.tar.gz` y
  `cambio.diff` (nunca la carpeta `_claude/cadena/`).

**Bloqueos:** ninguno.
