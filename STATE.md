# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** F2 · paso 5 auditado y corregido en `main` (PR #23, `949ac58`) · siguiente: **F2 · paso 6**
(misión rápida, copiar email, chip de disponibilidad, sugerencia de idioma).

_Última actualización: 2026-10-24 (**CIERRE DE SESIÓN · 10**) · AUD-F2-5 decidida («VB a todo lo recomendado»: 1–19
y P1-A, P2-A, P3-A, P4-B) y corregida en 6 commits (PR #23, squash); ADR-022. 505 unitarios, 100 e2e en Chromium y
CI verde en los tres motores._

**Hecho esta sesión** (vivas S10 en `_claude/cadena/hecho/2026-10-24/`):
1. **404 de `/ES` → inicio** (`d2fd198`): la ruta solo elige entre 404 y viaje; `JourneyPage` monta `<main>` y los
   hooks del scroll, que antes se quedaban sin medir (raíl congelado en Home). E2e nuevo en `chrome.spec.ts`.
2. **`chapterDom`** (`4a6c65f`): `CHAPTER_SELECTOR`, `findChapter` y `HERO_TITLE_ID` en
   `features/journey/chapterDom/`; la navegación ya no importa componentes del viaje (P4-B → **ADR-022**).
3. **Raíl y barra** (`338b83d`): el raíl son enlaces de verdad (`/#about`…, P3-A); `--opacity-muted` 0,45 → 0,7
   (AA, P1-A); velo `--color-veil-chrome` bajo el desenfoque de la barra (P2-A); texto opaco con `:focus-visible`;
   el idioma actual no navega; `role="list"` en el `<ol>`; raíl a 8 px del borde en móvil; CV ≥ 44 px; cada
   `--text-*` con su `--leading-*`; punto activo con `Highlight` en `forced-colors`; el hero deja la columna del
   raíl por debajo de 900 px y con texto al 200 % solo cede el logo.
4. **HUD** (`7d5bb5c`): la unidad del reloj se elige ya redondeada (ni «1,000,000 years» ni «1 years»: segundos hasta
   2 años) y se pinta con `useLayoutEffect` (sin frame a cero al cambiar de idioma).
5. **Tests** (`26902d5`): los de la barra miran lo que dicen (historial, Contact, todos los modificadores, foco del
   logo, fuera del viaje); tolerancia de 1 px en `journey.spec.ts`; Tab de nuevo en WebKit (pasa en CI);
   `code-references` caza también claves de pregunta y «la opción A–C».
6. **Docs** (último commit del PR): ADR-022; design-system, componentes, navegacion, scroll-y-escena,
   estados-y-accesibilidad, calidad, arquitectura, roadmap y rutas viejas al día.

**Incidencias y lecciones:**
- Dos «sospechados» de la Mesa eran reales: el n.º 1 (el e2e nuevo falla con el código viejo) y el n.º 14 (a
  360 × 640 el raíl tapaba la eyebrow del hero; con texto al 200 % «ES» salía 5 px de la pantalla).
- **Con `<Link>` de React Router, `defaultPrevented` es `true` en todo clic normal** (navega por el router): para
  saber si un salto canceló la navegación, se mira la dirección del router (un `<output>` con `useLocation`), no
  `defaultPrevented`. Para Ctrl/Cmd/Shift/Alt sí vale `defaultPrevented === false`.
- En `forced-colors`, Chromium pinta el fondo con `Canvas` (el de la página) si no se fuerza un color del sistema:
  el test compara con el fondo del `body`. `styles.test.ts` acepta ahora colores del sistema (`Highlight`…).
- Cada test nuevo se probó contra el código roto a propósito (mutaciones de `isPlainClick`, `preventDefault`,
  ventanas de morph, CSS del raíl y de la barra).
- Método de siempre: contenedor (Node 24 de `node-linux-x64`, enlace `chromium*-1248 → -1243`, `.env`), clon de
  GitHub, árbol de la carpeta = contenedor tras cada commit (`git rev-parse HEAD^{tree}`). El aviso de «push» del
  contenedor se ignora.

**Deuda anotada:**
- **F6 · tableta:** entre 520 y 900 px el HUD (abajo a la izquierda) pasa por encima del texto del panel al hacer
  scroll, como el prototipo (es decorativo y sin puntero). Revisarlo con la escena.
- **F3:** la escena suaviza `m`; hasta entonces `setScrollTarget` escribe `m = mTarget` (ADR-021 → Consecuencias).
- **F2.7:** la barra en la página de proyecto (`goToChapter` devuelve `false` fuera del viaje y el enlace navega:
  comprobar que `/projects/x` → `/#projects` cae bajo la barra). Ya anotado en el roadmap.
- **F3.1:** el `test` del grupo `framework` de `vite.config.ts` es todo `node_modules`: excluir `three` y
  `@react-three/*` antes de importar la escena en diferido (ADR-020 → Consecuencias; roadmap F3.1).
- **F6 · NVDA:** en modo exploración, NVDA/JAWS activan con un clic sintético que el `HoldButton` ignora (no
  detonan; avanzan por encabezados). Revisarlo con NVDA (`estados-y-accesibilidad.md`, punto 8).
- **F6:** el «≈» de los eyebrows y ahora también los superíndices `⁰ ⁴–⁹ ⁻` y el «∞» del HUD salen con la mono del
  sistema (excepción en `design-system.md` → «Iconos»): mirarlo en los tres motores. El hero en un móvil real
  (toque largo sobre el texto y sobre el botón) y el CLS.
- El `useLayoutEffect` del HUD (sin parpadeo al cambiar de idioma) no tiene test: jsdom no ve un frame pintado.
  Mirarlo con una grabación de Performance en F6.
- El e2e de alto contraste solo corre en Chromium (los demás no emulan `forced-colors`).
- ADR-022 (entre features, solo contratos sin React) no lo vigila ESLint: se revisa en las auditorías.
- La flecha «→» de los pasos TryIt de Chessmate se maqueta con el icono SVG en **F2.7** (página de proyecto).
- **Riesgo F2.7 · `NotFoundPage`:** al maquetarla, moverla a `features/` (o `ui/`).
- Grupos de Skills enfocables (`tabindex`) solo en **F4.3**, cuando enciendan su constelación.
- Iconos de GitHub y LinkedIn: hoy enlaces de texto + icono externo; decidir si se dibujan en F2.6/F6.
- **WebKit descarga dos veces las fuentes precargadas** (bug 194589): en F6, medir en un Safari real.
- Contraste AA sobre el velo de los paneles (`--color-veil`) encima de la escena: F3–F4 (ADR-015).
- La lista de valores neutros del test de colores obliga a ampliarla con un valor legítimo nuevo (a propósito).
- `@lhci/cli` y los scripts `visual` / `lhci` se instalan en F3/F6.
- **F7:** que `/es/*` reciba la 404 ES y que las 404 salgan con estado 404 real en Vercel (en `preview` salen con
  200); comprobar el `X-Robots-Tag: noindex` de las previews; **`cleanUrls: true`** en `vercel.json`.
- Provisional: páginas mínimas de proyecto y 404 (F2.7), `favicon.svg` (F6).
- Fuera de este paso: la sugerencia «¿Ver en español?» (F2.6) no tiene claves en `textos-sitio.md`.
- **React Router 8.4 no pasa `caseSensitive` a las rutas del cliente:** lo cubre `isLowerCasePathname`. Al
  actualizar React Router, comprobar si ya lo pasa.
- `throw data(null, { status: 404 })` en un `loader` choca con `@typescript-eslint/only-throw-error`: si F2.7 lanza
  404 desde `loader`, configurar el `allow` de la regla.

**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`). No hay encargos de la Mesa abiertos.
2. **F2 · paso 6** (esquema → VB): misión rápida (`QuickMissionDialog`, `/#quick`, botón «Quick mission» en la
   barra), `CopyButton` del email en Contacto (aún no existe), `AvailabilityChip` en la barra y sugerencia «¿Ver en
   español?» (`Notice`; faltan sus claves en `textos-sitio.md`). Docs: `navegacion.md`, `componentes.md`,
   `estados-y-accesibilidad.md`, `textos-sitio.md`. La barra (`features/navigation/TopBar`) ya tiene sitio: sus
   acciones no encogen y solo cede el logo (comprobar el botón y el chip a 390 px y con texto al 200 %).
3. Al terminar F2.6, ofrecer AUD-F2-6 a la Mesa.

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7) · Tareas de Víctor: script de consola en el README
de Chessmate (F2.7), CV en PDF EN/ES.
**Limpieza manual del usuario:** ramas locales ya fusionadas: `git branch -D feat/scroll-nav-hud
docs/session-close-2026-10-23-4 docs/session-close-2026-10-23-5 fix/aud-f2-5` (y
`docs/session-close-2026-10-24` cuando se fusione). En el buzón, dentro de `_claude/cadena/hecho/`, se pueden borrar
los `arbol.tar.gz` y los `cambio.diff` (nunca la carpeta `_claude/cadena/`). · **Bloqueos:** ninguno.
