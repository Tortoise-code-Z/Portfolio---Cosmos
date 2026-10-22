# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** F2 · paso 1 auditado y corregido en `main` (`94f24ff`) · siguiente: **F2 · paso 2 · capa de
contenido tipada**.

_Última actualización: 2026-10-22 (**CIERRE DE SESIÓN · 3**) · AUD-F2-1 corregida entera (18 hallazgos y 3
preguntas); ADR-015 sustituye a ADR-007 y ADR-016 fija los navegadores; piloto Taller/Mesa terminado → modo completa._

**Hecho esta sesión:**
1. **AUD-F2-1** (entrega de la Mesa sobre F2 · paso 1): todo corregido con sus recomendaciones · **PR #8**
   (`94f24ff`, título Conventional, CI en verde en los tres motores).
   - Estilos: el reset ya no descentra `<dialog>` ni `[popover]`; los SVG van en línea; token `--underline-offset`.
   - Invariantes (`src/styles/styles.test.ts`): tokens solo del `:root` de nivel superior; variables privadas `--_x`
     permitidas; colores revisados por declaración; sin duraciones literales y fundidos con `--dur-fade-*`; familias
     solo vía `--font-*`; el contraste exige `#rrggbb` opaco. Cada comprobación con su test de guarda.
   - E2E: cada cara de fuente; eje `wdth` por ancho pintado; precargas que coinciden con su `@font-face` y se
     descargan una vez; foco ámbar; `--gutter`; duraciones con y sin movimiento reducido; reset; fondo sin JS;
     presupuesto de fuentes sobre el build (`tests/e2e/budgets.spec.ts`).
   - Docs: ADR-007 → «Sustituida por ADR-015»; **ADR-016** (dos últimas versiones de cada motor); `movimiento.md`
     coherente y regla de `transitionend`; tokens citados en lugar de valores; `stack.md`, `roadmap.md`, `calidad.md`.
2. **Cadena Taller/Mesa:** piloto terminado; pasa a **modo completa** (`DEVELOPMENT_RULES.md` §13).

**Incidencias y lecciones:**
- El e2e de precarga falló dos veces en el CI en WebKit: (1) Resource Timing no sirve para contar descargas
  (deja dos entradas por fuente) → se cuentan las peticiones de red con `page.route`; (2) WebKit descarga dos veces
  las fuentes precargadas aunque la precarga sea correcta ([bug 194589](https://bugs.webkit.org/show_bug.cgi?id=194589))
  → la comprobación «una sola descarga» se salta en WebKit.
- Un test de precarga debe comparar el `href` con los `@font-face` reales: si solo mira que se pide, un `href` a
  otro archivo pasa en verde.
- Lo que la Mesa marca como sospechado se comprueba antes de documentarlo: renombrar el `.woff2` de Plex solo da
  un aviso en el build (lo pilla el e2e); Vite no reescribe `@media (width < 520px)`.
- Cada test nuevo se valida rompiendo a propósito lo que vigila (las 8 roturas de la Mesa y 2 más fallan).
- Los e2e que corre el Taller son solo de Chromium; Firefox y WebKit se ven en el CI del PR: abrirlo pronto.
- **Piloto · sesión 2 de 2:** bien, uso normal. Una entrega útil (18 hallazgos, ninguno falso), sin incidentes de
  la cadena; el tiempo extra se fue en los dos fallos de WebKit en el CI.

**Deuda anotada:**
- **JS inicial ~112 KB gzip** frente a ≤ 120 KB (`calidad.md`). Vigilar en cada paso de F2; si no cabe, ADR.
- La tilde de «VÍCTOR» toca el borde superior en la página «hello» (sin maquetación): F2.4 con `--hero-accent-room`.
- **Riesgo · salto de diseño al cargar las fuentes** (AUD-F2-1-9 · medir en **F2.4**): con la maquetación real del
  hero, medir el CLS (Lighthouse con 4G simulada o `PerformanceObserver('layout-shift')`); si pasa de 0,1, caras de
  reserva con `size-adjust` / `ascent-override`.
- La flecha «→» de los textos (Chessmate) se maqueta con el icono SVG de flecha en F2.4 (`design-system.md` → «Iconos»).
- **WebKit descarga dos veces las fuentes precargadas** (bug 194589): en F6, medir en un Safari real si la precarga
  compensa (LCP/CLS frente a ~82 KB de más en Safari).
- Contraste AA sobre el velo de los paneles (`--color-veil`) encima de la escena: comprobar en F3–F4 (ADR-015).
- El test de colores usa una lista de valores neutros: un valor legítimo nuevo (p. ej. `url()` en un fondo) obligará
  a ampliarla, a propósito.
- `@lhci/cli` y los scripts `visual` / `lhci` se instalan en F3/F6.
- Provisional: textos de «hello» y del `ErrorBoundary` raíz (→ `src/content` en F2); `favicon.svg` (→ F6); 404
  genérica de Vercel (→ nuestra página en F2, configuración en F7).

**Siguiente paso (próxima sesión):**
1. Arrancar con `session-start` (y la skill `taller`; la cadena ya está en modo completa).
2. **F2 · paso 2:** capa de contenido tipada + tests de invariantes. Leer `docs/01-contenido/README.md` y
   `modelo-de-datos.md` y traer el esquema → Visto Bueno. Zona caliente: `src/content/**`. Con su commit en verde,
   ofrecer la auditoría a la Mesa (y, si lo pides, el estudio del paso 3 en paralelo).

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7) · Tareas de Víctor: confirmar curso de Hola Mundo
terminado (F2), estrellas de IA como prácticas o herramientas (F2/F4.3), script de consola en el README de Chessmate
(F2), CV en PDF EN/ES.
**Limpieza manual del usuario:** ramas locales ya fusionadas: `git branch -D chore/env-init chore/site-url
docs/session-close-2026-10-22 feat/design-tokens` (y `docs/session-close-2026-10-22-3`, cuando se fusione). En el
buzón, dentro de `_claude/cadena/hecho/2026-10-22/aud-f2-1/`, se pueden borrar los `.tar.gz` y `cambio.diff`
(nunca la carpeta `_claude/cadena/`). · **Bloqueos:** ninguno.
