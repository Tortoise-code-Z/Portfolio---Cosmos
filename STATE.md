# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** F2 · paso 3 en `main` (PR #12, `4ce01f5`) y estructura por carpetas en `main` (PR #13, `37734e8`) ·
siguiente: **decidir AUD-F2-3** (entregada por la Mesa, sin decidir) y corregirla; después **F2 · paso 4**.

_Última actualización: 2026-10-23 (**CIERRE DE SESIÓN · 5**) · CI de PR #12 arreglado (404 duplicada al hidratar) y
fusionado; ADR-018 (archivos con el mismo nombre, en su carpeta) y la regla de dudas en `_claude/dudas/`._

**Hecho esta sesión:**
1. **CI rojo de PR #12 arreglado** (4 e2e de `seo.spec.ts` en Firefox/WebKit): en `/projects/<slug desconocido>` el
   servidor da `404.html` (ruta `*`), pero el cliente casa la ruta de proyecto y, mientras descarga su módulo, no
   pintaba nada → React dejaba el `<main>` y las `<meta>` del HTML y añadía otros (dos `<h1>`, `robots` duplicado).
   Arreglo: `HydrateFallback` en `root.tsx` = `NotFoundPage`, y la `meta` de la raíz sin error (`null`/`undefined`)
   = `notFoundMeta`. El e2e de la 404 espera a `networkidle` y exige un solo `<h1>`. Fusionado con squash (`4ce01f5`),
   verde en los tres motores. Detalle en `arquitectura.md` → «Rutas e idiomas».
2. **ADR-018 · archivos con el mismo nombre, en su carpeta** (PR #13, `37734e8`): 18 parejas (36 archivos) de
   `src/content`, `src/lib/{env,i18n,seo}` y `src/routes` a `x/x.ts` + `x/x.test.ts`, sin `index.ts`; 57 imports
   reescritos por script; `src/structure.test.ts` vigila la regla. Docs: `arquitectura.md`, `textos-sitio.md`,
   `calidad.md`, `CLAUDE.md`, `DEVELOPMENT_RULES.md` §5.
3. **Regla de dudas** (`DEVELOPMENT_RULES.md` §3): cada duda de concepto de Víctor, explicada en cristiano y en
   detalle en `_claude/dudas/AAAA-MM-DD-tema.md` (fuera de git, índice en su `README.md`). Guardadas: el `<h1>`
   duplicado e hidratación en React 19; SPA frente a pre-renderizado.
4. **AUD-F2-3** lanzada a la Mesa (base `e00e246` · hasta `4ce01f5`) y **entregada**: 14 hallazgos (5 recomendados,
   9 menores) y 2 preguntas (P1 · meta de la 404 sin `description`/`og:url`; P2 · dónde vive `NotFoundPage` en F2.7).

**Incidencias y lecciones:**
- **Hidratación:** si el HTML servido y la ruta que casa el cliente no coinciden, React 19 no avisa dentro de `<body>`
  ni `<head>` (tolera nodos ajenos a propósito, por las extensiones): deja lo del HTML y añade lo suyo. La primera
  pintura del cliente tiene que ser idéntica al HTML, también mientras carga un módulo de ruta.
- **Un e2e que mira «nada más cargar» puede aprobar por carrera:** en Chromium aprobaba con el fallo dentro. Si lo
  vigilado puede cambiar al hidratar, esperar a `networkidle`. Validado con mutaciones: sin cada arreglo, 3 rojos.
- La `meta` de la raíz recibe `error: null` (no `undefined`) cuando no hay error: antes daba «Something went wrong»
  durante la espera.
- Las rutas fijas por slug no arreglaban `/projects/Chessmate` (`caseSensitive` no llega al cliente): descartado.
- **PR:** título y descripción siempre en inglés, con la estructura de §10 (Víctor lo recordó).
- En el contenedor solo hay Chromium (Firefox y WebKit no se pueden descargar: `cdn.playwright.dev` bloqueado); el
  CI confirma los otros dos.

**Deuda anotada:**
- **JS inicial:** home **118,5 KB** gzip (vigilada por `budgets.spec.ts`, ≤ 120 KB); **página de proyecto 122,9 KB**,
  por encima. En **F2.4**, con la home maquetada: `loader` en el build para el proyecto (datos fuera del JS) o ADR
  que revise el presupuesto (por página, o «framework + X KB»). React 19 + React Router 8 ya ocupan ~108 KB.
- La tilde de «VÍCTOR» toca el borde superior en la «hello» (sin maquetación): F2.4 con `--hero-accent-room`.
- **Riesgo · salto de diseño al cargar las fuentes** (medir en **F2.4**): CLS con la maquetación real del hero; si
  pasa de 0,1, caras de reserva con `size-adjust` / `ascent-override`.
- La flecha «→» de los textos se maqueta con el icono SVG en F2.4 (`design-system.md` → «Iconos»).
- **WebKit descarga dos veces las fuentes precargadas** (bug 194589): en F6, medir en un Safari real.
- Contraste AA sobre el velo de los paneles (`--color-veil`) encima de la escena: F3–F4 (ADR-015).
- La lista de valores neutros del test de colores obliga a ampliarla con un valor legítimo nuevo (a propósito).
- `@lhci/cli` y los scripts `visual` / `lhci` se instalan en F3/F6.
- **F7:** que `/es/*` reciba la 404 ES y que las 404 salgan con estado 404 real en Vercel (en `preview` salen con
  200). Comprobar el `X-Robots-Tag: noindex` de las previews.
- Provisional: la página «hello» (F2.4), las páginas mínimas de proyecto y 404 (F2.7), `favicon.svg` (F6).
- Fuera de este paso: la sugerencia «¿Ver en español?» (F2.6) no tiene claves en `textos-sitio.md`.
- **React Router 8.4 no pasa `caseSensitive` a las rutas del cliente** (`createClientRoutes` no lo copia): por eso
  `/projects/Chessmate` casa la ruta de proyecto en el navegador y la 404 depende del `HydrateFallback`. Revisar al
  actualizar React Router (y AUD-F2-3-1, mayúsculas en `/ES`, `/PROJECTS/…`).

**Siguiente paso (próxima sesión):**
1. Arrancar con `session-start` (y la skill `taller`).
2. **Decidir AUD-F2-3** (`_claude/cadena/aud-f2-3/auditoria.md`): Víctor dice qué se corrige
   («AUD-F2-3: corrige …; no …») y responde P1 y P2. La auditoría cita las rutas anteriores a ADR-018: traducirlas.
3. Corregirla en `fix/aud-f2-3` (esquema → VB, un commit por bloque si conviene).
4. **F2 · paso 4** (capítulos del viaje sin escena): esquema → VB. Ahí se mide el JS inicial con la home real y se
   decide la deuda de la página de proyecto (viva S4 #47).

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7) · Tareas de Víctor: script de consola en el README
de Chessmate (F2.7), CV en PDF EN/ES.
**Limpieza manual del usuario:** ramas locales ya fusionadas: `git branch -D feat/i18n-seo fix/aud-f2-2
refactor/same-name-folders` (y `docs/session-close-2026-10-23` cuando se fusione). En el buzón, dentro de
`_claude/cadena/hecho/`, se pueden borrar los `.tar.gz` y los `cambio.diff` (nunca la carpeta `_claude/cadena/`).
· **Bloqueos:** ninguno.
