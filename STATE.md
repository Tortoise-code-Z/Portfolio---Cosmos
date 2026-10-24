# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** F2 · paso 6 en `main` (PR #25, `b164906`) · la Mesa audita **AUD-F2-6** (lanzada, sin entrega) ·
siguiente: decidir AUD-F2-6 cuando llegue y **F2 · paso 7** (páginas de proyecto completas y 404).

_Última actualización: 2026-10-24 (**CIERRE DE SESIÓN · 11**) · F2.6 hecho en 5 commits (PR #25, squash): misión
rápida (`/#quick`), copiar email, chip «Open to work» y sugerencia de idioma; sin ADR nuevo. 604 unitarios, 117 e2e
en Chromium y CI verde en los tres motores._

**Hecho esta sesión** (vivas S11 en `_claude/cadena/hecho/2026-10-24/decisiones-vivas-S11.md`):
1. **Piezas comunes** (`558f678`): `ui/ButtonOutline`, `ui/CopyButton`, `ui/Notice` (región `status` que existe
   siempre), `stores/uiStore` (`useUiStore`, `quickMissionOpen`), `lib/storage` (localStorage que nunca lanza),
   `browserLocale` (manda la primera preferencia del navegador); claves y tokens nuevos.
2. **Copiar el email en Contacto** (`2c80406`): Copy → Copied (1,8 s); sin portapapeles o si lo rechaza, selecciona el
   email y dice «Select and copy it». El lector oye «Copy email».
3. **Chip y misión rápida** (`4a8f30f`): chip desde 900 px (punto que respira, quieto con movimiento reducido);
   botón «Quick mission» (corto por debajo de 520 px: «Quick» / «Rápida», contenido en el nombre accesible);
   `<dialog>` modal a pantalla completa con todo el contenido, foco en «Back to the journey», `#quick` con
   `replaceState` y vuelta del ancla anterior al cerrar, `/#quick` al cargar, fondo bloqueado
   (`html:has(dialog[open])`), contenido montado solo al abrir. `replaceHash` sale a `lib/history` (lo comparten
   los saltos y `#quick`).
4. **Sugerencia de idioma** (`567ddfe`): en páginas EN con el navegador en español, aviso en español con «Ver en
   español» (mismo capítulo) y «No, gracias»; la respuesta se recuerda (`cosmos.languageNotice`).
5. **Docs** (`18d7750`): navegacion, componentes, design-system, movimiento, estados-y-accesibilidad, textos-sitio,
   arquitectura y roadmap.

**Incidencias y lecciones:**
- **La carpeta no deja borrar:** `tar` no sobrescribe (desenlaza antes). Se extrae en el `$HOME` del equipo y se
  copia cada archivo con `cat > destino`; después, `git hash-object` por archivo = blobs del contenedor (y
  `HEAD^{tree}` igual tras cada commit de Víctor).
- **`device_commit_files` reutiliza lo subido si se repite la ruta de origen:** cada entrega con un nombre nuevo
  (`arbol-cN.tar.gz`).
- **jsdom no implementa `showModal` ni `close`** del `<dialog>`: los tests los simulan (y `close` lanza el evento
  `close`, como `Esc` en un navegador).
- **Un e2e que no probaba lo que decía:** la rueda sobre el modo no mueve la página aunque falte el bloqueo (el
  propio diálogo hace scroll con `overscroll-behavior: contain`); el test mira ahora `overflow: hidden` del `html`.
  Cada test nuevo se probó contra el código roto a propósito.
- `toHaveText` de Playwright cuenta el texto oculto (las dos etiquetas del botón): lo visible se mira con
  `innerText()`. La región `status` del aviso no ocupa sitio: se comprueba el texto de dentro.
- Contenedor: solo Chromium (Firefox y WebKit no se descargan; `playwright install` borra los enlaces de
  `PLAYWRIGHT_BROWSERS_PATH`, no los navegadores de `/opt`). `pkill -f "vite preview"` mata la propia shell: arrancar
  el preview con `setsid` y no matarlo así. El aviso de «push» del contenedor se ignora.
- Víctor quiere las respuestas **en español** (los commits y los PR siguen en inglés): anotado en `CLAUDE.md`.

**Deuda anotada:**
- **F6 · tableta:** entre 520 y 900 px el HUD (abajo a la izquierda) pasa por encima del texto del panel al hacer
  scroll, como el prototipo (es decorativo y sin puntero), y la sugerencia de idioma lo tapa hasta que se contesta.
  Revisarlo con la escena.
- **F6 · texto al 200 % (ya estaba antes de F2.6):** a 390 px, las filas de Proyectos se salen del ancho
  (`scrollWidth` ≈ 605 px: scroll lateral). La barra sí cabe (lo vigila `chrome.spec.ts`).
- **F2.7:** montar `QuickMissionDialog` también en la página de proyecto (allí entra la barra con su botón) y
  decidir si la sugerencia de idioma sale ahí (roadmap F2.7).
- **F3:** la escena deja de pintar con `quickMissionOpen` de `uiStore` (roadmap F3.5).
- **F6 · NVDA (F2.6):** tras «No, gracias» el aviso desaparece y el foco cae al `body`; antes de hidratar,
  «Quick mission» no hace nada (sin JS, el viaje ya tiene todo). Mirarlo con NVDA.
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
- El e2e de alto contraste solo corre en Chromium (los demás no emulan `forced-colors`); el de copiar al
  portapapeles, también (solo Chromium deja dar el permiso en un test).
- ADR-022 (entre features, solo contratos sin React) no lo vigila ESLint: se revisa en las auditorías.
- La flecha «→» de los pasos TryIt de Chessmate se maqueta con el icono SVG en **F2.7** (página de proyecto).
- **Riesgo F2.7 · `NotFoundPage`:** al maquetarla, moverla a `features/` (o `ui/`).
- Grupos de Skills enfocables (`tabindex`) solo en **F4.3**, cuando enciendan su constelación.
- Iconos de GitHub y LinkedIn: hoy enlaces de texto + icono externo; decidir si se dibujan en F6.
- **WebKit descarga dos veces las fuentes precargadas** (bug 194589): en F6, medir en un Safari real.
- Contraste AA sobre el velo de los paneles (`--color-veil`) encima de la escena: F3–F4 (ADR-015).
- La lista de valores neutros del test de colores obliga a ampliarla con un valor legítimo nuevo (a propósito).
- `@lhci/cli` y los scripts `visual` / `lhci` se instalan en F3/F6.
- **F7:** que `/es/*` reciba la 404 ES y que las 404 salgan con estado 404 real en Vercel (en `preview` salen con
  200); comprobar el `X-Robots-Tag: noindex` de las previews; **`cleanUrls: true`** en `vercel.json`.
- Provisional: páginas mínimas de proyecto y 404 (F2.7), `favicon.svg` (F6).
- **React Router 8.4 no pasa `caseSensitive` a las rutas del cliente:** lo cubre `isLowerCasePathname`. Al
  actualizar React Router, comprobar si ya lo pasa.
- `throw data(null, { status: 404 })` en un `loader` choca con `@typescript-eslint/only-throw-error`: si F2.7 lanza
  404 desde `loader`, configurar el `allow` de la regla.

**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`).
2. **AUD-F2-6** está lanzada (base `9bdcf11` · hasta `b164906`; entrega en `_claude/cadena/aud-f2-6/auditoria.md`,
   citará las vivas S11): cuando llegue, Víctor elige qué se corrige y va en `fix/aud-f2-6`.
3. **F2 · paso 7** (esquema → VB): páginas de proyecto completas (galería con visor accesible) y 404; la barra entra
   en la página de proyecto con la misión rápida (montar `QuickMissionDialog`). Docs: `pagina-proyecto.md`,
   `navegacion.md` → «Volver desde una página de proyecto», `componentes.md` (Lightbox, ProjectNote), roadmap F2.7 y
   la deuda F2.7 de arriba.

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7) · Tareas de Víctor: script de consola en el README
de Chessmate (F2.7), CV en PDF EN/ES.
**Limpieza manual del usuario:** ramas locales ya fusionadas: `git branch -D feat/scroll-nav-hud
docs/session-close-2026-10-23-4 docs/session-close-2026-10-23-5 fix/aud-f2-5 docs/session-close-2026-10-24
feat/quick-mission` (y `docs/session-close-2026-10-24-2` cuando se fusione). En el buzón se pueden borrar
`_claude/cadena/tmp/arbol*.tar.gz` y, dentro de `_claude/cadena/hecho/`, los `arbol.tar.gz` y `cambio.diff` (nunca la
carpeta `_claude/cadena/`). · **Bloqueos:** ninguno.
