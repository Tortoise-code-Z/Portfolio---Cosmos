# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** F2 · paso 4 auditado y corregido en `main` (PR #19, `9cf5114`) · siguiente: **F2 · paso 5**
(`mapM`, raíl, HUD y barra superior).

_Última actualización: 2026-10-23 (**CIERRE DE SESIÓN · 8**) · AUD-F2-4 decidida (los 22 hallazgos con la opción
recomendada + P1-A, P2-A, P3-A) y corregida en 4 commits; 388 unitarios y 73 e2e (Chromium) en verde._

**Hecho esta sesión:**
1. **Interfaz y accesibilidad** (`a9874d1`): email de contacto con 44 px de alto y tan ancho como su texto; la zona
   del hero solo carga sobre su parte vacía (el texto se puede seleccionar; mientras carga, sin menú contextual);
   `role="list"` en las 9 listas sin viñetas (Safari/VoiceOver) con `jsx-a11y-x/no-redundant-roles` configurada;
   la descripción del `HoldButton` en un `<span hidden>`; el botón ocupa la fila en móvil (`className` del dueño);
   brillo de la fila de proyecto con fundido (`::before`); pares `-webkit-user-select`. **P1-A:** al detonar, el foco
   va al título de About (`tabindex="-1"`, `focus({ preventScroll: true })`).
2. **Carga** (`4889d73`): un puntero por carga (otro dedo no la corta; el mismo puntero vuelve a empezar), un
   `AbortController` por gesto de la zona, suelta en `blur` de la ventana y con la pestaña oculta, bucle rAF con una
   sola función. Tests que fallan si se quita la guarda, si la carga re-renderiza o si hay doble bucle.
3. **Tests** (`5af9eab`): sin esperas fijas (clic corto: la carga vuelve a 0; detonar: se mantiene hasta ver el
   resultado); el Tab recorre hasta salir de `main` y exige visitarlo todo (aguanta la barra de F2.5); encuadre
   acotado al hero con el kicker; desborde con `clientWidth`; CLS también a 390×844; e2e táctiles (CDP) y de 44 px;
   presupuestos sobre **todos** los HTML del build y **CSS ≤ 50 KB gzip** (hoy 4,3 KB).
4. **Docs y tokens** (cuarto commit del PR): ADR-020 precisado (dependencias del JS inicial, nombre del chunk,
   trampa de Three.js para F3.1); iconos con `vector-effect: non-scaling-stroke` y token `--icon-baseline-shift`;
   `design-system.md` escribe las excepciones (viewport, visualmente oculto, `z-index: -1` local, tracking cruzado,
   «≈»); componentes, textos y capítulo 1 al día. **P2-A:** los ADR ya no citan claves del buzón (todos
   limpiados) y `code-references.test.ts` vigila también `DECISIONS.md` y `docs/` (§5 de las reglas). **P3-A:** el
   panel es *sticky* durante su capítulo.
5. Roadmap: F3.1 ya incluye sacar Three.js del grupo `framework` (ADR-020).

**Incidencias y lecciones:**
- **Contenedor:** trae Node 22 (el proyecto exige 24, `engine-strict`) y Chromium 1243 (Playwright pide 1248).
  Arreglo sin descargas bloqueadas: `npm pack node-linux-x64@24.22.0` en `/opt/node24` (con el npm de Node 22 en
  el `PATH`) y enlace `chromium*-1248 → -1243` en `/opt/pw-browsers`. Hace falta `.env` (copia de `.env.example`).
- **Método que funcionó:** los 4 commits se prepararon y probaron en la copia del contenedor y se pasaron a la
  carpeta de uno en uno tras cada «commit hecho», comprobando con un md5 de todos los archivos que coincidían. El
  aviso de «push» del contenedor salta mientras tanto: se ignora (nunca se sube desde allí) y tras el merge la
  copia se alinea con `origin/main`.
- Las reglas del plugin de accesibilidad se llaman `jsx-a11y-x/<regla>`, no `jsx-a11y/…`.
- El build deja dos `style-*.css` iguales en `assets/` (uno sin enlazar): los presupuestos miden la hoja que piden
  las páginas.
- Un `z-index: -1` dentro de un componente con `isolation: isolate` es una excepción local (escrita en
  `design-system.md` → «Capas»).
- Cada test nuevo se comprobó contra el código anterior (debe fallar): así se pilló que el de la zona del hero
  necesitaba el puntero en `window`.

**Deuda anotada:**
- **F3.1:** el `test` del grupo `framework` de `vite.config.ts` es todo `node_modules`: excluir `three` y
  `@react-three/*` antes de importar la escena en diferido (ADR-020 → Consecuencias; roadmap F3.1).
- **F6 · NVDA:** en modo exploración, NVDA/JAWS activan con un clic sintético que el `HoldButton` ignora (no
  detonan; avanzan por encabezados). Revisarlo con NVDA (`estados-y-accesibilidad.md`, punto 8).
- **F6:** el «≈» de los eyebrows sale con la mono del sistema (aceptado en `design-system.md` → «Iconos»): mirarlo en
  los tres motores. El hero en un móvil real (toque largo sobre el texto y sobre el botón) y el CLS.
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
1. Arrancar con `session-start` (y la skill `taller`).
2. **F2 · paso 5** (`mapM` con tests, raíl, HUD y barra superior): esquema → VB. Docs:
   `docs/02-experiencia/scroll-y-escena.md` y `navegacion.md`, `docs/03-diseno/componentes.md`. La barra fija añade
   su altura en `scroll-padding-block-start`; `mapM` mide la altura real de las secciones (son mínimas). Los saltos
   del raíl deberían llevar el foco al título del capítulo como la detonación: `focusChapterTitle` vive hoy en
   `Hero.tsx` (sacarlo a una pieza compartida) y solo el `h2` de About tiene `tabindex="-1"`.
3. Si el paso lo merece, pedir a la Mesa el estudio de reglas en paralelo (modo completa).

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7) · Tareas de Víctor: script de consola en el README
de Chessmate (F2.7), CV en PDF EN/ES.
**Limpieza manual del usuario:** ramas locales ya fusionadas: `git branch -D feat/journey-chapters fix/aud-f2-2
fix/aud-f2-3 fix/aud-f2-4 docs/session-close-2026-10-23-2 docs/session-close-2026-10-23-3` (y
`docs/session-close-2026-10-23-4` cuando se fusione). En el buzón, dentro de `_claude/cadena/hecho/`, se pueden
borrar los `arbol.tar.gz` y los `cambio.diff` (nunca la carpeta `_claude/cadena/`).
· **Bloqueos:** ninguno.
