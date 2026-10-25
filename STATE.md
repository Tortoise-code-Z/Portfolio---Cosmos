# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** F2 · paso 7 en `main` y **AUD-F2-7 corregida** (PR #31, `89d9ab0`) · la cadena no tiene
encargos abiertos · siguiente: **F2 · paso 8** (imágenes de proyectos y e2e del visor).

_Última actualización: 2026-10-25 (**CIERRE DE SESIÓN · 14**) · AUD-F2-7 corregida entera en 3 commits (PR #31,
squash): los 23 hallazgos (del 20 y el 23, lo que no había hecho ya `2746f2a`) y P1-C, P2-C, P3-A, P4-B, P5-C; sin
ADR nuevo. 750 unitarios y 150 e2e en Chromium; CI en verde en los tres navegadores (merge con `main` protegida)._

**Hecho esta sesión** (vivas S14 en `_claude/cadena/hecho/2026-10-25/decisiones-vivas-S14.md`):
1. **Lógica e interfaz** (`e8c20ee`): `ProjectRoute` envuelve la ficha en `<Fragment key={slug}>` (cambiar de
   proyecto la rehace: ni modo abierto, ni «Copied», ni visor heredados); llegar a una ficha por PUSH/REPLACE
   (anterior/siguiente, «View project», EN / ES, «Ver en español») lleva el foco al `h1`, y POP no lo toca; el visor
   se describe con su región `status` (`aria-describedby`); `QuickMissionDialog` mira el estado vivo del store
   (StrictMode ya no lo reabre en la ficha); cuentas de demo con `@container (width < 20em)` además del corte sm;
   aire de arriba de la ficha con `env(safe-area-inset-top)`; claves `lightbox.*`; «Close quick mission» /
   «Cerrar la misión rápida»; `project.credentials.many`; anterior/siguiente en media columna como mucho.
2. **Tests** (`e149cab`): qué copia cada botón de las cuentas de demo (y qué selecciona sin portapapeles), Esc del
   visor y de la galería, `preventDefault` y modificadores de ← →, Contact que falla si la página no se mueve,
   Cosmos a 390 px, 404 y barra en el e2e del 200 %, HTML servido de verdad en `seo.spec.ts`, «proyecto vacío» sin
   galería, visto de ficha en ficha, icono de la nota, orden del stack, sin HUD, barra al 200 % en fichas, Atrás
   con la posición asentada y 44 px de la ficha. Cada test nuevo, comprobado rompiendo el código.
3. **Docs** (`89d9ab0` incluye el tercer commit): navegacion (barra de la ficha y en móvil, foco al llegar, Atrás de
   verdad y desde el modo, `ScrollRestoration`), estados-y-accesibilidad, componentes (Portada nueva),
   design-system, arquitectura («proyecto activo» de F4.4 de vuelta), README de experiencia, pagina-proyecto y
   calidad.

**Incidencias y lecciones:**
- Método de siempre en el contenedor (Node 24 de `node-linux-x64` con el npm de Node 22, enlaces
  `chromium*-1248 → -1243`, `.env`), clon de GitHub; cada commit pasado como `_claude/cadena/tmp/arbol-s14-cN.tar.gz`
  con su lista `s14-cN.blobs`, `cat > destino` y `git hash-object`. El contenedor hace commits locales (nunca push)
  para comparar `HEAD^{tree}`: coincidió en los tres. El aviso de push del contenedor se ignora.
- **Medir antes de creerse el número de una auditoría:** el desborde de las cuentas de demo era de 520 a ~528 px,
  no de 520 a 600 (`ButtonOutline` ya parte su texto desde AUD-F2-6); el e2e se puso a 520 px, donde fallaba.
- Un unitario que depende de `window.location` (el modo mira el ancla) necesita `createBrowserRouter`: con
  `createRoutesStub` la dirección no cambia y el test falla o pasa por un motivo falso.
- `toHaveTextContent('Demo account')` también casa con «Demo accounts»: comparar el texto exacto.

**Deuda anotada:**
- **Antes de etiquetar `v0.1.0` o enseñar una preview (P5):** la ficha de Cosmos (`src/content/projects/cosmos.ts`)
  lista funcionalidades y stack de F3–F5 (partículas, constelaciones, Three.js / R3F / GLSL): recortarlos a lo
  hecho o esperar a tenerlos (`docs/01-contenido/proyectos/cosmos.md`: «no se publica nada que no esté hecho»).
- **Windows/Edge:** comprobar a mano que abrir y cerrar «Quick mission» no hace saltar la página de lado
  (`scrollbar-gutter`), si no se hizo.
- **F2.8:** e2e del visor con las imágenes reales, con los 44 px de «Close» y las flechas; portadas y galerías (se
  pintan solas al tener datos).
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
2. **F2 · paso 8** (esquema → VB): portada y galería de Chessmate y AstroHub con las capturas de Víctor (formato,
   tamaños y `vite-imagetools`, textos alternativos EN/ES), y el e2e del visor con ellas (abrir, ← →, Esc y
   «Close» con el foco de vuelta, 44 px de sus controles). Sin capturas, el esquema puede prepararse igual.
3. Al cerrar F2.8, auditoría AUD-F2-8 a la Mesa.

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7) · Tareas de Víctor: **capturas de los proyectos
(F2.8)**, script de consola en el README de Chessmate (lo cita el «Try it»), CV en PDF EN/ES.
**Limpieza manual del usuario:** ramas locales ya fusionadas: `git branch -D feat/scroll-nav-hud
docs/session-close-2026-10-23-4 docs/session-close-2026-10-23-5 fix/aud-f2-5 docs/session-close-2026-10-24
feat/quick-mission docs/session-close-2026-10-24-2 feat/project-page docs/session-close-2026-10-24-3 fix/aud-f2-6
docs/session-close-2026-10-24-4 fix/aud-f2-7` (y `docs/session-close-2026-10-25` cuando se fusione). En el buzón se
pueden borrar `_claude/cadena/tmp/arbol*.tar.gz`, `_claude/cadena/tmp/*.blobs`, `_claude/cadena/tmp/cierre-s13.tar.gz`
y `_claude/cadena/tmp/STATE-cierre-s12.md` y, dentro de `_claude/cadena/hecho/`, los `arbol.tar.gz` y `cambio.diff`
(nunca la carpeta `_claude/cadena/`). · **Bloqueos:** ninguno.
