# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** F2 · paso 7 en `main` (PR #27, `b350dad`) · **AUD-F2-6 decidida, sin corregir** · la Mesa
audita **AUD-F2-7** (lanzada, sin entrega) · siguiente: corregir AUD-F2-6 en `fix/aud-f2-6`.

_Última actualización: 2026-10-24 (**CIERRE DE SESIÓN · 12**) · F2.7 hecho en 5 commits (PR #27, squash): 404
maquetada, página de proyecto completa, galería con visor accesible, la interfaz fija en la ficha y la vuelta al
viaje con el foco en la fila; sin ADR nuevo. 710 unitarios y 130 e2e en Chromium._

**Hecho esta sesión** (vivas S12 en `_claude/cadena/hecho/2026-10-24/decisiones-vivas-S12.md`):
1. **404** (`618e27f`): `NotFoundPage` pasa a `features/errors/` y se maqueta (centrada, corchetes de esquina,
   título, frase y «Back to the start»).
2. **Ficha de proyecto** (`0300f38`): `features/project/` (ProjectPage, ProjectHeader, ProjectSection,
   ProjectStack, ProjectNote, ProjectTryIt, ProjectPager y `neighbours`), `ui/ArrowText` (las «→» con el icono),
   `ActionLink` con `kind="mail"` y `leadingIcon`, iconos `arrow-left`, `info`, `warning`; tokens
   `--project-col-min` y `--note-border-width`. Las secciones sin datos no se pintan; anterior/siguiente **sin
   vuelta**; cuentas de demo con un copiar por dato («Copy password (Admin)») en una rejilla con `subgrid`.
3. **Galería y visor** (`aeaf27c`): `ui/Lightbox` (modal nativo, foco en «Close», ← → con vuelta, Esc, anuncio
   «3 of 9: alt», foco de vuelta a la miniatura) y `ProjectGallery`; token `--gallery-thumb-ratio`. Probado en
   Chromium con imágenes temporales; las galerías siguen vacías hasta F2.8.
4. **Interfaz fija en la ficha y vuelta** (`5e006e5`): SkipLink (`targetId` → nombre del proyecto), TopBar,
   misión rápida y sugerencia de idioma; `pathFor` hace que EN / ES y la sugerencia lleven al mismo proyecto.
   `uiStore.visitedProject` + `takeVisitedProject`: al volver (Atrás, «Back to the shell» o «Projects»), el foco
   queda en la fila del proyecto visto. Arreglo: la misión rápida ya no se reabre en la página a la que lleva uno
   de sus enlaces. e2e nuevo `tests/e2e/project-page.spec.ts`.
5. **Docs** (`ec60c92`): pagina-proyecto, navegacion, estados-y-accesibilidad, componentes, design-system,
   textos-sitio, arquitectura y roadmap; e2e de la 404 con una sola hoja de estilos.
6. **AUD-F2-6** entregada y decidida (vivas S12 #25): corrige 1–20 con las opciones recomendadas y responde
   P1-C, P2-A, P3-B, P4-A, P5-A, P6-A. **AUD-F2-7** lanzada.

**Incidencias y lecciones:**
- Método de siempre en el contenedor (Node 24 de `node-linux-x64`, enlaces `chromium*-1248 → -1243`, `.env`), clon
  de GitHub; cada commit se pasó con un `tar` a `_claude/cadena/tmp/arbol-s12-cN.tar.gz`, `cat > destino` en el
  equipo y `git hash-object` por archivo contra una lista de blobs (`cN.blobs`). `HEAD^{tree}` igual tras cada
  commit. Los avisos de `tar` («time stamp in the future») son inofensivos.
- Se trabajó un commit por delante: mientras Víctor commiteaba el N, el N+1 se preparaba en el contenedor, sin tocar
  su carpeta hasta el «commit hecho».
- **`pkill -f "vite preview"` vuelve a matar la shell del contenedor**: arrancar el preview con `setsid` y dejarlo.
- **Montar el mismo diálogo en dos rutas** hereda su estado de Zustand al navegar: el `useLayoutEffect` de la página
  nueva corre antes que la limpieza de la vieja. Lo cazó un e2e que ya existía.
- `display: contents` en `dl`/`dd` puede quitar la semántica: para alinear columnas entre listas se usó `subgrid`.
- En jsdom el espacio final dentro de un `VisuallyHidden` se pierde en el nombre accesible: el espacio va fuera.
  jsdom trata un `<header>` dentro de `<main>` como `banner` (el navegador no).
- El aviso de «push» del contenedor tras el merge se resuelve alineando la copia con `origin/main`; nunca se sube
  desde allí.

**Deuda anotada:**
- **AUD-F2-6** (decidida, sin corregir): lista completa en `_claude/cadena/hecho/2026-10-24/aud-f2-6/auditoria.md`.
  Al corregir, contrastar con `b350dad`: F2.7 ya tocó QuickMissionDialog, SkipLink, TopBar y LanguageNotice, y
  reutiliza `CopyButton` (claves `contact.*`, P4) en Try it; el arreglo 9 («Selecciónalo y cópialo» al 200 %) y el
  2 (el aviso tapa el foco) valen también para la ficha. `calidad.md` sigue sin nombrar los e2e de F2.6 y F2.7.
- **F2.8:** e2e del visor con las imágenes reales; portadas y galerías (se pintan solas al tener datos).
- **F5:** la placa iluminada al volver lee `uiStore.visitedProject` (el mismo dato del foco en la fila).
- En el visor y en la misión rápida (modal nativo), el Tab puede pasar por la interfaz del navegador antes de volver
  al diálogo: la página sigue inerte. Aceptado; mirarlo con NVDA en F6.
- **F6 · tableta:** entre 520 y 900 px el HUD (abajo a la izquierda) pasa por encima del texto del panel al hacer
  scroll, como el prototipo (es decorativo y sin puntero), y la sugerencia de idioma lo tapa hasta que se contesta.
- **F6 · texto al 200 %:** a 390 px, las filas de Proyectos del viaje se salen del ancho (`scrollWidth` ≈ 605 px).
  La ficha de proyecto y la 404 no (lo vigila `project-page.spec.ts`).
- **F3:** la escena deja de pintar con `quickMissionOpen` de `uiStore` (roadmap F3.5).
- **F6 · NVDA (F2.6):** tras «No, gracias» el aviso desaparece y el foco cae al `body`; antes de hidratar,
  «Quick mission» no hace nada (sin JS, el viaje ya tiene todo).
- **F3:** la escena suaviza `m`; hasta entonces `setScrollTarget` escribe `m = mTarget` (ADR-021 → Consecuencias).
- **F3.1:** el `test` del grupo `framework` de `vite.config.ts` es todo `node_modules`: excluir `three` y
  `@react-three/*` antes de importar la escena en diferido (ADR-020 → Consecuencias; roadmap F3.1).
- **F6 · NVDA:** en modo exploración, NVDA/JAWS activan con un clic sintético que el `HoldButton` ignora.
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
2. **Corregir AUD-F2-6** en `fix/aud-f2-6` (esquema → VB): los 20 hallazgos con las opciones recomendadas y P1-C,
   P2-A, P3-B, P4-A, P5-A, P6-A (vivas S12 #25), contrastando cada uno con `b350dad`.
3. **AUD-F2-7** (base `1e9fbd8` · hasta `b350dad`; entrega en `_claude/cadena/aud-f2-7/auditoria.md`, citará las
   vivas S12): cuando llegue, Víctor elige qué se corrige.
4. Después, **F2 · paso 8**: imágenes de proyectos (portada y galería) y e2e del visor con ellas.

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7) · Tareas de Víctor: script de consola en el README
de Chessmate (lo cita el «Try it»), CV en PDF EN/ES, capturas de los proyectos (F2.8).
**Limpieza manual del usuario:** ramas locales ya fusionadas: `git branch -D feat/scroll-nav-hud
docs/session-close-2026-10-23-4 docs/session-close-2026-10-23-5 fix/aud-f2-5 docs/session-close-2026-10-24
feat/quick-mission docs/session-close-2026-10-24-2 feat/project-page` (y `docs/session-close-2026-10-24-3` cuando se
fusione). En el buzón se pueden borrar `_claude/cadena/tmp/arbol*.tar.gz` y `_claude/cadena/tmp/c*.blobs` y, dentro
de `_claude/cadena/hecho/`, los `arbol.tar.gz` y `cambio.diff` (nunca la carpeta `_claude/cadena/`). ·
**Bloqueos:** ninguno.
