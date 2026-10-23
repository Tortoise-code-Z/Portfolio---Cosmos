# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** F2 · paso 3 cerrado y auditado: AUD-F2-3 corregida en `main` (PR #15, `f79c064`) ·
siguiente: **F2 · paso 4** (capítulos del viaje sin escena).

_Última actualización: 2026-10-23 (**CIERRE DE SESIÓN · 6**) · AUD-F2-3 decidida (los 14 hallazgos + P1, P2,
FIX-1, FIX-2) y corregida en 4 commits; verde en los tres motores._

**Hecho esta sesión:**
1. **Mayúsculas → 404** (AUD-F2-3-1, -12): `isLowerCasePathname` (`lib/i18n/paths/`) es la única regla «ruta en
   minúsculas»; `/ES`, `/PROJECTS/chessmate`, `/es/PROJECTS/…` pintan la 404 del idioma (página y `meta`) en
   `journey` y `project`. El plugin de `preview` la repite en línea antes de `existsSync` (Windows no distingue
   mayúsculas). Comprobado por Víctor en Windows.
2. **Raíz y página de error** (-2, -7, -8, -13): el `ErrorBoundary` reutiliza `NotFoundPage` con un 404 y pone
   `noindex` a los demás errores; `src/root.test.tsx` prueba la `meta` de reserva, la página de error EN/ES, el
   `HydrateFallback` y que **cada ruta de `routes.ts` exporta su `meta`**. ADR-018 con una excepción: `root.tsx` y
   su test, sueltos en `src/` (FIX-1-A).
3. **Tests más firmes** (-3, -4, -9, -10, -11): `networkidle` en las páginas indexables; título, descripción y
   `name` del JSON-LD exactos; 404 con título, `og:locale` y `/en`; resumen del proyecto EN/ES; `fillPlaceholders`
   exportada (huecos repetidos); `SITE_ORIGIN` recargado con `vi.resetModules`; `@ts-expect-error` sobre `t`.
4. **Citas y docs** (-5, -6, -14, P1-A, FIX-2-A): el código ya no cita el buzón (~40 citas → docs del repo);
   regla en `DEVELOPMENT_RULES.md` §5 vigilada por `src/code-references.test.ts`; docs al día (pre-commit con
   `typegen`, origen del `hreflang`, `lib/env/`, `UiTemplate`, coma de Oxford, «≈ 1000 millones» en el brief); la
   404 sin descripción ni `og:url` queda escrita como decisión en `arquitectura.md`.
5. Cada arreglo, validado rompiéndolo a propósito (los tests se ponen en rojo). 233 unitarios y 42 e2e (Chromium).

**Incidencias y lecciones:**
- **Entregas del contenedor al equipo:** copiar a `outputs` y escribir en el equipo **nunca en paralelo** (van a la
  vez y se escribió un `vite.config.ts` viejo; Víctor lo vio por el aviso de Vite). Tras cada entrega, comparar
  sha1 contenedor ↔ equipo. `device_commit_files` no escribe en `.husky/`: se edita desde la shell del equipo.
- **Configs de Vite:** importar desde `vite.config.ts` un módulo que arrastre `content/` hace que Vite avise
  (`configLoader: 'native'`, imports sin extensión). Por eso el plugin de preview repite la regla en una línea.
- **Comprobaciones en el contenedor:** clon de GitHub; Node 24.22.0 desde el paquete npm `node-linux-x64`
  (nodejs.org bloqueado); Playwright 1.64 pide `chromium_headless_shell-1248` y hay la 1243 (enlace simbólico).
- **`throw data(null, { status: 404 })`** en un `loader` choca con `@typescript-eslint/only-throw-error`: en el test
  va con un `eslint-disable` puntual; si F2.7 lanza 404 desde `loader`, configurar el `allow` de la regla.
- Probar en Windows antes del commit (Víctor) pilló lo que el contenedor no podía ver: mantenerlo cuando un cambio
  toque el preview o rutas de disco.

**Deuda anotada:**
- **JS inicial:** home **118,5 KB** gzip (vigilada por `budgets.spec.ts`, ≤ 120 KB); **página de proyecto 122,9 KB**,
  por encima. En **F2.4**, con la home maquetada: `loader` en el build para el proyecto (datos fuera del JS) o ADR
  que revise el presupuesto (por página, o «framework + X KB»). React 19 + React Router 8 ya ocupan ~108 KB.
- La tilde de «VÍCTOR» toca el borde superior en la «hello» (sin maquetación): F2.4 con `--hero-accent-room`.
- **Riesgo · salto de diseño al cargar las fuentes** (medir en **F2.4**): CLS con la maquetación real del hero; si
  pasa de 0,1, caras de reserva con `size-adjust` / `ascent-override`.
- La flecha «→» de los textos se maqueta con el icono SVG en F2.4 (`design-system.md` → «Iconos»).
- **Riesgo F2.7 · `NotFoundPage`** (AUD-F2-3-P2): hoy la importa `root.tsx`; con su CSS Module viajaría con la raíz
  y el `HydrateFallback` podría enlazar otra hoja que el `404.html`. Al maquetarla, moverla a `features/` (o `ui/`)
  con su CSS y añadir al e2e de la 404 «sin hojas de estilo duplicadas».
- **WebKit descarga dos veces las fuentes precargadas** (bug 194589): en F6, medir en un Safari real.
- Contraste AA sobre el velo de los paneles (`--color-veil`) encima de la escena: F3–F4 (ADR-015).
- La lista de valores neutros del test de colores obliga a ampliarla con un valor legítimo nuevo (a propósito).
- `@lhci/cli` y los scripts `visual` / `lhci` se instalan en F3/F6.
- **F7:** que `/es/*` reciba la 404 ES y que las 404 salgan con estado 404 real en Vercel (en `preview` salen con
  200); comprobar el `X-Robots-Tag: noindex` de las previews; **`cleanUrls: true`** en `vercel.json` (`/index.html`
  sirve la home y el cliente casa la ruta `*`: AUD-F2-3-13).
- Provisional: la página «hello» (F2.4), las páginas mínimas de proyecto y 404 (F2.7), `favicon.svg` (F6).
- Fuera de este paso: la sugerencia «¿Ver en español?» (F2.6) no tiene claves en `textos-sitio.md`.
- **React Router 8.4 no pasa `caseSensitive` a las rutas del cliente:** lo cubre `isLowerCasePathname`. Al
  actualizar React Router, comprobar si ya lo pasa (y si `isLowerCasePathname` sigue haciendo falta).

**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`).
2. **F2 · paso 4** (capítulos del viaje sin escena): esquema → VB. Docs: `docs/02-experiencia/capitulos/`,
   `docs/03-diseno/`. Ahí se mide el JS inicial con la home real y se decide la deuda de la página de proyecto.
   Para cualquier ruta o página nueva: exporta su `meta` (lo exige `root.test.tsx`), usa `isLowerCasePathname` y
   los comentarios citan docs del repo, no el buzón (`code-references.test.ts`).
3. Opcional (modo completa, si Víctor lo pide): estudio de la Mesa con las reglas del paso 4, `hasta f79c064`.

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7) · Tareas de Víctor: script de consola en el README
de Chessmate (F2.7), CV en PDF EN/ES.
**Limpieza manual del usuario:** ramas locales ya fusionadas: `git branch -D fix/aud-f2-2 fix/aud-f2-3` (y
`docs/session-close-2026-10-23-2` cuando se fusione). En el buzón, dentro de `_claude/cadena/hecho/`, se pueden
borrar los `.tar.gz` y los `cambio.diff` (nunca la carpeta `_claude/cadena/`).
· **Bloqueos:** ninguno.
