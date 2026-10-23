# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** F2 · paso 5 en `main` (PR #21, `d6a995c`) · la Mesa audita **AUD-F2-5** (lanzada, sin entrega) ·
siguiente: decidir AUD-F2-5 cuando llegue y **F2 · paso 6** (misión rápida, copiar email, chip, sugerencia de idioma).

_Última actualización: 2026-10-23 (**CIERRE DE SESIÓN · 9**) · F2.5 hecho en 6 commits (PR #21, squash): scroll → `m`
en `sceneStore`, HUD cósmico, raíl, barra superior con EN/ES y «Skip to content»; ADR-021. 493 unitarios, 89 e2e en
Chromium y CI verde en los tres motores._

**Hecho esta sesión** (F25-1…F25-7, todas con la opción recomendada; vivas S9 en `_claude/cadena/hecho/`):
1. **Scroll → `m`** (`f9cfd8e`): `lib/math` (`clamp`, `smoothstep`, `lerp`); `lib/scroll` con `mapM` puro,
   `useChapterLayout` (alturas reales: ResizeObserver + `fonts.ready`) y `useScrollTarget` (un escuchador pasivo);
   `stores/sceneStore` (*vanilla*) con `mTarget`/`m`, `setScrollTarget`, `activeChapter` y `selectActiveChapter`.
   Ventanas de morph en `content/chapters.ts`. Sin escena, `m = mTarget` (F25-3).
2. **HUD** (`c8bc763`): `features/hud/cosmicClock` puro (Planck → 200 Ma → 1000 Ma en escala log, en segundos hasta
   1 año, 2 cifras significativas; ∞ de `m` 2,5 a 3,5; 13.800 Ma) y `CosmicHud` (`aria-hidden`, toca el DOM solo si
   cambia el texto). `hud.seconds` pasa a «t = 10{exp} s» con el exponente en superíndice.
3. **Raíl** (`ee37141`): `ChapterRail` (`<nav>` + `<ol>` de botones, `aria-current="step"`, solo se repinta al
   cambiar de capítulo, puntos en columna, 44 × 44 px en móvil). `lib/scroll/jumpToChapter` sustituye a
   `focusChapterTitle` del Hero (scroll + foco al título + `replaceState`); todos los títulos con `tabindex="-1"`.
4. **Barra** (`c78297c`): `TopBar` (logo, Projects, Contact, CV si hay PDF), `LanguageSwitch` (conserva el capítulo
   activo, F25-2) y `SkipLink` (al principio de `<main>`, F25-7). Enlaces reales con clic interceptado solo en clic
   normal (`onChapterLinkClick`). Barra de altura fija (`--topbar-h` 64 px) + `scroll-padding-block-start`, y
   `toScrollLayout` para que arriba `m` siga siendo 0. Sin misión rápida ni chip (F25-1, llegan en F2.6).
5. **Docs** (`a9066cb`): **ADR-021**; navegacion, scroll-y-escena, componentes, design-system (tokens nuevos),
   textos-sitio, arquitectura, calidad y roadmap al día.
6. **CI** (`7eb9979`): el e2e de la columna de puntos fallaba en Firefox por subpíxeles; ahora admite 1 px.

**Incidencias y lecciones:**
- **Contenedor nuevo:** el arreglo de siempre (Node 24 con `npm pack node-linux-x64@24.22.0` en `/opt/node24`, enlace
  `chromium*-1248 → -1243`, `.env` desde `.env.example`); el repo se clona de GitHub y se compara con la carpeta con
  un md5 de todos los archivos antes de empezar y tras cada paso.
- **Pasar archivos con `npm run dev` abierto** dejó un «Cannot find module» en caché (Vite vio `Hero.tsx` antes que
  `jumpToChapter.ts`). Orden desde entonces: primero lo nuevo y lo de base, la ruta que lo monta al final; si pasa,
  reiniciar el servidor.
- **En el contenedor solo hay Chromium:** Firefox y WebKit solo corren en el CI. Las medidas al píxel, con 1 px de
  tolerancia y sin redondear.
- Una barra fija adelantaba `m` (arriba ya no era 0) si se medía desde el borde + la barra: se resolvió pasando las
  medidas a posiciones de scroll (`toScrollLayout`, ADR-021).
- `pkill -f` con un texto que aparece en el propio comando mata la shell (exit 144): parar el `preview` por puerto.
- Cada test nuevo se probó contra el código roto a propósito: así salieron dos huecos (la pintura inicial del HUD y
  la columna de puntos), que ya tienen su test.
- El aviso de «push» del contenedor se ignoró en cada commit; tras el merge la copia se alineó con `origin/main`.

**Deuda anotada:**
- **F6 · tableta:** entre 520 y 900 px el HUD (abajo a la izquierda) pasa por encima del texto del panel al hacer
  scroll, como el prototipo (es decorativo y sin puntero). Revisarlo con la escena.
- **F3:** la escena suaviza `m`; hasta entonces `setScrollTarget` escribe `m = mTarget` (ADR-021 → Consecuencias).
- **F2.7:** la barra en la página de proyecto (`goToChapter` devuelve `false` fuera del viaje y el enlace navega:
  comprobar que `/projects/x` → `/#projects` cae bajo la barra).
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
2. Si la Mesa ya entregó **AUD-F2-5** (`_claude/cadena/aud-f2-5/auditoria.md`): contrastar su sello con las vivas
   S9 (hasta #26; la #27 solo apunta el lanzamiento), que Víctor decida y corregir en `fix/aud-f2-5`.
3. **F2 · paso 6** (esquema → VB): misión rápida (`QuickMissionDialog`, `/#quick`, botón «Quick mission» en la
   barra), `CopyButton` del email en Contacto (aún no existe), `AvailabilityChip` en la barra y sugerencia «¿Ver en
   español?» (`Notice`; faltan sus claves en `textos-sitio.md`). Docs: `navegacion.md`, `componentes.md`,
   `estados-y-accesibilidad.md`, `textos-sitio.md`. La barra (`features/navigation/TopBar`) ya tiene sitio para el
   botón y el chip.

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7) · Tareas de Víctor: script de consola en el README
de Chessmate (F2.7), CV en PDF EN/ES.
**Limpieza manual del usuario:** ramas locales ya fusionadas: `git branch -D feat/scroll-nav-hud
docs/session-close-2026-10-23-4` (y `docs/session-close-2026-10-23-5` cuando se fusione). En el buzón, dentro de
`_claude/cadena/hecho/`, se pueden borrar los `arbol.tar.gz` y los `cambio.diff` (nunca la carpeta `_claude/cadena/`).
· **Bloqueos:** ninguno.
