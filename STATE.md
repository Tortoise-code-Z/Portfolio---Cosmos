# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** F2 · paso 3 escrito en la rama `feat/i18n-seo` (3 commits + este cierre; PR por abrir o en
borrador) · siguiente: **PR en verde en los tres motores y fusión**, auditoría **AUD-F2-3** y **F2 · paso 4**.

_Última actualización: 2026-10-23 (**CIERRE DE SESIÓN · 4**) · F2.2 (contenido) hecho, auditado y corregido en
`main`; F2.3 (i18n, rutas EN/ES y SEO) hecho tras un estudio de la Mesa; ADR-017 (qué importa `lib` de `content`)._

**Hecho esta sesión:**
1. **F2 · paso 2 · capa de contenido tipada** (PR #10, `68f5006`): perfil, 4 constelaciones (31 estrellas; IA con
   las 4 prácticas + Claude y ChatGPT), 3 proyectos y 95 textos EN/ES en `src/content/`, con claves planas en
   `src/content/texts/` (`uiTexts`, `UiKey`). Comprobaciones puras en `validate.ts` y tests de invariantes.
2. **AUD-F2-2** (Mesa) corregida entera, 9 hallazgos y P3 (PR #11, `e00e246`): casos rotos también del lado EN,
   regla 8 (listas que siempre se pintan, no vacías), email más estricto, etiquetas compartidas en
   `projects/labels.ts`, ADR-006 y el doc de escena al día.
3. **EST-F2-3** (estudio de la Mesa): 15 preguntas respondidas con su recomendación (vivas S4 #16–#31).
4. **F2 · paso 3** en `feat/i18n-seo`:
   - `1567bd3` · i18n: `translate`/`useT` con huecos tipados por el compilador, `formatNumber`/`formatList`
     (`Intl` con `en`/`es`), `workModesText`, rutas por idioma; regla de ESLint de ADR-017.
   - `b9eb354` · SEO: `SITE_ORIGIN`, `absoluteUrl` (forma única), `sitePages`, meta, JSON-LD (`Person`,
     `SoftwareSourceCode`), sitemap y robots; `VITE_SITE_URL` exigida también en `dev` y `preview`.
   - `46729b1` · rutas: home, proyecto y 404 en EN/ES; slug desconocido = misma 404; `ErrorBoundary` traducido;
     prerender, `sitemap.xml`, `robots.txt` y `404.html` en el build; e2e `seo.spec.ts` y presupuesto de JS de la
     home (`budgets.spec.ts`).
   - Cierre: ADR-017, `arquitectura.md`, `calidad.md`, `git-y-despliegue.md`, `pagina-proyecto.md`,
     `DEVELOPMENT_RULES.md` §13 y `.husky/pre-commit` (genera los tipos de las rutas antes del lint).

**Incidencias y lecciones:**
- **Prueba de viabilidad antes de construir** (3.0): la 404 se puede pre-renderizar con la ruta `*`, pero
  `react-router.config.ts` **no** entiende el alias `~/` (lo que importa va con rutas relativas) y lanzar un 404
  desde el render de la página de proyecto daba 4 errores de consola → se pinta la misma 404 sin lanzar.
- El pre-commit falló en el equipo de Víctor: faltaban los tipos de las rutas nuevas (`.react-router/`, fuera de
  git). Arreglado en `.husky/pre-commit` (`react-router typegen` antes de `lint-staged`).
- Las comprobaciones se hacen en un contenedor con Node 24.22.0 instalado desde npm (`node-linux-x64`): nodejs.org
  da 403 y el `node_modules` de Víctor es de Windows. Los e2e del Taller son solo de Chromium.
- Cada test nuevo se valida rompiendo a propósito lo que vigila: la Mesa encontró 7 mutaciones que sobrevivían en
  `validate.test.ts` (corregido). En F2.3, 14 mutaciones y roturas ponen tests en rojo.
- Cobertura por carpeta: una rama imposible (`?? char`) dejó `lib/seo` en 83 % de ramas; se reescribió sin rama.
- El límite de 120 KB de JS es una **alarma propia** (puesta en la fase de documentación, sin ADR); los objetivos
  reales son Core Web Vitals y Lighthouse del brief (F6). Aclarado con Víctor (viva #47).
- La Mesa en modo completa: una auditoría y un estudio en paralelo sobre zonas distintas, sin incidentes.

**Deuda anotada:**
- **JS inicial:** home **118,5 KB** gzip (vigilada por `budgets.spec.ts`, ≤ 120 KB); **página de proyecto ~123 KB**,
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

**Siguiente paso (próxima sesión):**
1. Arrancar con `session-start` (y la skill `taller`).
2. **PR `feat/i18n-seo`:** CI en verde en Chromium, Firefox y WebKit (los e2e nuevos solo se han visto en
   Chromium), título y descripción que dé el Taller, fusión con squash.
3. Ofrecer **AUD-F2-3** a la Mesa (base `e00e246` · hasta el commit fusionado en `main`). Ámbitos: lógica y contenido
   (`lib/i18n`, `lib/seo`, capas) · tests · documentación y ADR · estilos e interfaz solo para las páginas mínimas.
4. **F2 · paso 4** (capítulos del viaje sin escena): esquema → VB. Ahí se mide el JS inicial con la home real y se
   decide la deuda del proyecto (viva #47).

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7) · Tareas de Víctor: script de consola en el README
de Chessmate (F2.7), CV en PDF EN/ES.
**Limpieza manual del usuario:** ramas locales ya fusionadas: `git branch -D chore/env-init chore/site-url
docs/session-close-2026-10-22 docs/session-close-2026-10-22-3 feat/design-tokens feat/content-layer fix/aud-f2-2`
(y `feat/i18n-seo` cuando se fusione). En el buzón, dentro de `_claude/cadena/hecho/`, se pueden borrar los
`.tar.gz` y los `cambio.diff` (nunca la carpeta `_claude/cadena/`). · **Bloqueos:** ninguno.
