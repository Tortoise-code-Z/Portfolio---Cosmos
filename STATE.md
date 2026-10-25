# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** F2 · paso 8 en `main` (PR #33, `02abc5b`) · la Mesa audita **AUD-F2-8** (lanzada, sin entrega)
· siguiente: decidir AUD-F2-8 y, después, cerrar F2 (`v0.1.0`).

_Última actualización: 2026-10-25 (**CIERRE DE SESIÓN · 15**) · F2.8 hecho: capturas de Chessmate y AstroHub como
portada y galería (AVIF/WebP con `vite-imagetools`), `og:image` de las fichas y e2e del visor con las imágenes
reales; ADR-023. 800 unitarios y 163 e2e en Chromium; CI en verde en los tres navegadores (PR #33, squash de 4
commits)._

**Hecho esta sesión** (vivas S15 en `_claude/cadena/hecho/2026-10-25/decisiones-vivas-S15.md`):
1. **Código** (`26be79d`):
   - Imágenes: 21 PNG del repo antiguo en `src/assets/projects/<slug>/NN-<nombre>.png`. Presets de
     `vite.config.ts`: `?project` (AVIF + WebP · 640/1280/1920, `ResponsiveImage`) y `?share` (JPEG de 1200 px).
     Tipos en `env.d.ts` y sustituto en `vitest.config.ts`.
   - Interfaz: `ui/Picture` (`<picture>` con `sizes`), que usan la portada (prioridad alta), las miniaturas (lazy)
     y el visor. `--gallery-thumb-ratio` pasa a 2/1.
   - Contenido: textos aparte de las imágenes (`ProjectEntry` / `ProjectMedia`, `projects/{entries,media,index}.ts`).
   - SEO: `og:image` + `summary_large_image` en las fichas con portada (`coverShareImage`, `assetUrl`).
   - CI: caché de imagetools (`actions/cache@v6`).
2. **Tests** (`c7463b6`):
   - Unitarios: regla 5 del contenido (`findImageProblems`, `findImageFileProblems`; portada = 1.ª de la galería),
     `Picture`, `assetUrl`, meta con y sin portada.
   - E2E nuevo `project-images.spec.ts`: portada AVIF del ancho de la columna con su hueco, 640 px a 390 px, todo
     lo ofrecido se sirve, visor con las capturas (← →, Esc, «Close», foco de vuelta), 44 px a 390 px y CLS con
     imágenes lentas.
   - `seo.spec.ts` (`og:image` real, `WITH_COVER`) y `budgets.spec.ts` (≤ 200 KB por variante; la mayor, 148 KB).
3. **Docs** (`cbb77df`): ADR-023; assets, modelo-de-datos, fichas («Imágenes»), pagina-proyecto, componentes,
   design-system, arquitectura, calidad, git-y-despliegue, stack y roadmap.
4. **Arreglo** (`d43facc`): en `npm run dev` las imágenes se sirven en `/@imagetools/<hash>`, sin extensión, y
   `assetUrl` tumbaba las fichas (lo vio Víctor antes del merge). Ahora acepta esa forma, con tests.

**Incidencias y lecciones:**
- **Las portadas del repo antiguo no valían:** `Chessmate.webp` es una foto de stock de un tablero (sin licencia
  clara) y `Astrohub-Proyect.webp`, un recorte de Noticias; las medidas de las fichas tampoco cuadraban. Portada =
  captura de Inicio (IMG-4-A). Las capturas se bajaron desde el equipo de Víctor (el contenedor no tiene acceso a
  la API de GitHub de ese repo; `raw.githubusercontent.com` sí).
- **Un import de imagen solo lo entiende Vite:** Playwright (`seo.spec.ts`) y `react-router.config.ts` cargan el
  contenido sin Vite. De ahí la separación textos / imágenes (ADR-023).
- **Abrir también `npm run dev`** tras tocar la config de Vite o imports especiales: los e2e prueban el build y
  Vitest usa el sustituto, así que nada vio el fallo de `assetUrl` en desarrollo.
- **Tests que no probaban lo que decían** (salió rompiendo el código):
  - CLS con imágenes lentas: medido tras `goto`, que espera al `load` (las imágenes ya habían llegado). Ahora va
    con `waitUntil: 'commit'` y comprueba `complete === false` antes de medir.
  - `sizes`: solo se nota a un ancho donde la ventana pediría otra variante (1440 px, no 1280).
  - La caja de la portada cambia ~0,2 px al llegar la variante (alto redondeado): tolerancia de 1 px.
- Método de siempre en el contenedor (Node 24 de `node-linux-x64@24.22.0`, enlaces `chromium*-1248 → -1243`,
  `.env`, clon de GitHub y md5 de la carpeta antes de empezar). Cada commit, como
  `_claude/cadena/tmp/arbol-s15-cN.tar.gz` + `s15-cN.blobs`, con `cat > destino` y `git hash-object`; `HEAD^{tree}`
  igual en los cuatro y en `main`.
- `pkill -f` volvió a matar la shell del contenedor: parar servidores por puerto (`fuser -k 5173/tcp`). El aviso
  de push del contenedor se ignora.

**Deuda anotada:**
- **Imágenes (F2.8):** Vercel no guarda la caché de `vite-imagetools`, así que cada despliegue genera las 128
  variantes (~1 min más; ADR-023). La LCP de las fichas es ahora la portada: medirla con Lighthouse al cerrar F2 y
  en F6. El `og:image` de las fichas mide ~1200×576 (proporción de la captura, no 1,91:1): ver cómo lo recortan
  las redes cuando se hagan las imágenes del sitio (F6). Las capturas traen de origen la barra de scroll del
  navegador a la derecha: recortarla en F6 si molesta. En el contenedor solo corre Chromium: Firefox y WebKit de
  `project-images.spec.ts` se ven en el CI (en WebKit de Linux se admite WebP si no lee AVIF).
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
2. **AUD-F2-8** (lanzada; base `98d1284` · hasta `02abc5b`; cita las vivas S15 hasta #13, ya en
   `hecho/2026-10-25/decisiones-vivas-S15.md`). Cuando llegue la entrega a `_claude/cadena/aud-f2-8/auditoria.md`,
   Víctor elige qué se corrige y se corrige en su rama.
3. **Cierre de F2** (esquema → VB):
   - Antes, recortar la ficha de Cosmos a lo hecho (deuda de arriba).
   - Lighthouse Accessibility ≥ 95 y SEO ≥ 95, y recorridos e2e del recruiter.
   - Etiqueta `v0.1.0`.

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7). Tareas de Víctor: script de consola en el
README de Chessmate (lo cita el «Try it»), CV en PDF EN/ES.
**Limpieza manual del usuario:**
- Ramas locales ya fusionadas: `git branch -D feat/scroll-nav-hud docs/session-close-2026-10-23-4
  docs/session-close-2026-10-23-5 fix/aud-f2-5 docs/session-close-2026-10-24 feat/quick-mission
  docs/session-close-2026-10-24-2 feat/project-page docs/session-close-2026-10-24-3 fix/aud-f2-6
  docs/session-close-2026-10-24-4 fix/aud-f2-7 docs/session-close-2026-10-25 feat/project-images`, y
  `docs/session-close-2026-10-25-2` cuando se fusione.
- En el buzón se pueden borrar `_claude/cadena/tmp/arbol*.tar.gz`, `_claude/cadena/tmp/*.blobs`,
  `_claude/cadena/tmp/cierre-s13.tar.gz` y `_claude/cadena/tmp/STATE-cierre-s12.md` y, dentro de
  `_claude/cadena/hecho/`, los `arbol.tar.gz` y `cambio.diff` (nunca la carpeta `_claude/cadena/`).

**Bloqueos:** ninguno.
