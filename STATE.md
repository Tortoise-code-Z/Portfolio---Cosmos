# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** **F2 cerrada** (`v0.1.0` en `3a3e0de` y `v0.1.1` en `50b6fb4`, PR #37–#40) · la cadena no
tiene encargos abiertos · siguiente: **F3 · paso 1** (`SceneMount` diferido, WebGL2, niveles y `ErrorBoundary`).

_Última actualización: 2026-10-26 (**CIERRE DE SESIÓN · 17**) · Cierre de F2: ficha de Cosmos recortada a lo hecho,
recorridos e2e del recruiter, Lighthouse medido (Accessibility y SEO 100 en local y en producción), versión 0.1.0 y
AUD-F2-CIERRE corregida entera (v0.1.1). 813 unitarios y 173 e2e en Chromium; CI en verde en los tres navegadores._

**Hecho esta sesión** (vivas S17 en `_claude/cadena/hecho/2026-10-26/decisiones-vivas-S17.md`):
1. **Ficha de Cosmos a lo hecho** (PR #37, `d1137a0`; vivas S17 #1, CF2-1-A y CF2-2): sin partículas ni WebGL en el
   resumen, sin «particle morphing» ni «constellations and plates», «Readable without JavaScript and with reduced
   motion» y `stack.core` = React y TypeScript. El texto final, con ⏳ en `cosmos.md`; el roadmap dice qué vuelve
   en F3 (paso 7) y en F4.
2. **Recorridos del recruiter** (PR #38, `c348db6`): `tests/e2e/recruiter.spec.ts`, EN y ES. A 1280 px, «Projects»
   de la barra → proyectos en pantalla → ficha → código en pestaña nueva (GitHub simulado). A 390 px, la misión
   rápida pone los proyectos en pantalla con un toque y el raíl cae con la escena primero; en ambos, la ficha tras
   un deslizamiento.
3. **Lighthouse** (vivas #5, #8, #10): 13.5.0 con `npx`, sin dependencia nueva. Local (móvil simulado): A 100 · BP
   100 · SEO 100 en las 5 páginas indexables, P 92–96, CLS 0, LCP 2,4–2,7 s; la 404, SEO 54 a propósito (`noindex`).
   Producción (PageSpeed Insights): `/` P 97 · LCP 2,3 s y `/projects/chessmate` P 98 · LCP 2,1 s, el resto 100.
   `npm audit`: 0. En `calidad.md` → «Mediciones».
4. **Versión 0.1.0** (PR #39, `3a3e0de`): `package.json` y el lock; `git-y-despliegue.md` (`v0.1.0` es F2).
   Víctor etiquetó `v0.1.0` antes de decidir la auditoría (vivas #12); las correcciones van en `v0.1.1` (TAG-1-A).
5. **AUD-F2-CIERRE** (Mesa; vivas #13–#16; PR #40, `50b6fb4`): 0 bloqueantes, corregidos 1-A, 2-A, 3, 4, 5-A, 6,
   7-B y 8; P1-A y P2-A (el `about` y la habilidad Three.js se quedan). La nota de Cosmos ya no promete el README
   (vuelve en F6); `recruiter.spec` mide el deslizamiento a 390 px, la ruta exacta y el `lang`; ayudas comunes de
   los e2e en `tests/e2e/support/helpers.ts` (`collectErrors`, `projectBySlug`), sin las 4 copias.

**Incidencias y lecciones:**
- **El clic de Playwright desplaza solo hasta el elemento**, esté donde esté: un e2e que diga «a un toque» tiene
  que comprobar `toBeInViewport()` antes del clic. A 390 px «View project» quedaba a y≈990 en una pantalla de 844 y
  el spec lo daba por «a un toque»; lo vio la Mesa. Ahora: fuera al llegar, un deslizamiento (`mouse.wheel`), dentro.
- **A 390 px las anclas caen en la escena** (`03-tortuga.md` → «Móvil»: escena primero): en F2 son ~700 px vacíos
  sobre el título de Proyectos. En móvil, la métrica del brief (proyectos en ≤ 2 interacciones) la cumple la misión
  rápida. Anotado en `navegacion.md` → «Raíl de capítulos».
- **Lighthouse en local sobrestima la LCP** frente a producción (sin CDN): 2,6–2,7 s en local, 2,1–2,3 s en
  Vercel. Las notas de A11y, BP y SEO coinciden.
- **Producción no se alcanza desde el contenedor ni desde el shell del equipo** (proxy 403): las notas de
  PageSpeed Insights se leyeron con el navegador de la app.
- **Etiquetar antes de la auditoría** obliga a una versión de parche: la etiqueta va después de decidir la Mesa
  (`git-y-despliegue.md`: sobre el commit de `main` que sube la versión; aquí, `v0.1.1`).
- Método de siempre en el contenedor (Node 24.22.0 de `node-linux-x64` por npm —nodejs.org da 403—, enlaces
  `chromium*-1248 → -1243`, `.env`, clon de GitHub y md5 de la carpeta antes de empezar). Paso a la carpeta con
  `git diff` + `patch -p1` (o tar en base64) y md5 de todo el árbol ordenado igual al del contenedor. El aviso de
  push del contenedor se ignora (se guarda el trabajo con `git stash`).

**Deuda anotada:**
- **F6 · Lighthouse:** aviso sin peso `label-content-name-mismatch` en EN / ES (se ve «EN», el nombre accesible
  es «English», decidido en `componentes.md`): revisarlo con NVDA y control por voz. Hasta F6, Lighthouse se pasa
  a mano al cerrar cada fase y se apunta en `calidad.md` → «Mediciones» (en local y, con PageSpeed Insights, en
  producción).
- **F3–F4 · móvil:** a 390 px el raíl (y cualquier ancla) cae en el capítulo con la escena primero
  (`03-tortuga.md` → «Móvil»); en F2 son ~700 px vacíos. La escena los llena; `recruiter.spec.ts` fija que las filas
  quedan a **un** deslizamiento y avisará si el hueco crece.
- **Imágenes (F2.8):** Vercel no guarda la caché de `vite-imagetools`, así que cada despliegue genera las 128
  variantes (~1 min más; ADR-023). La LCP de las fichas es la portada: medida al cerrar F2 (`calidad.md` →
  «Mediciones»); en local pasa algo de 2,5 s y en producción no: vigilarla en F6.
  El `og:image` de las fichas mide ~1200×576 (proporción de la captura, no 1,91:1): ver cómo lo recortan las redes
  cuando se hagan las imágenes del sitio (F6). Las capturas traen de origen la barra de scroll del navegador a la
  derecha: recortarla en F6 si molesta. En el contenedor solo corre Chromium: Firefox y WebKit de
  `project-images.spec.ts` se ven en el CI.
- **`sizes` (AUD-F2-8):** los cortes no cuentan una barra de scroll clásica de escritorio: en esa franja de ~15 px
  se pide una variante algo menor, que solo se nota a densidad 2. Si cambian `--read-w`, `--project-col-min`,
  `--space-3` o `--gutter`, `imageSizes.test.ts` falla y hay que revisar `PROJECT_LAYOUT`.
- **F6:** mirar si al navegar dentro del sitio a una ficha se pide también la WebP de 1920 (`src`) además de la
  AVIF elegida (sin evidencia; la Mesa lo dejó como comprobación: `page.on('request')` yendo de `/` a «View
  project»).
- **Windows/Edge:** comprobar a mano que abrir y cerrar «Quick mission» no hace saltar la página de lado
  (`scrollbar-gutter`), si no se hizo.
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
1. Arrancar con `session-start` (y la skill `taller`). Fijar en el tablero las **zonas calientes de F3**.
2. **F3 · paso 1** (esquema → VB): `SceneMount` diferido, detección de WebGL2, niveles de rendimiento y
   `ErrorBoundary` de escena; antes, sacar `three` y `@react-three/*` del grupo `framework` de `vite.config.ts`
   (ADR-020, roadmap F3.1). Docs: `docs/04-escena/` (rendimiento) y `docs/05-tecnico/arquitectura.md`.
3. Valorar con Víctor un estudio de la Mesa para F3 (reglas de la escena: rendimiento, determinismo, cero
   asignaciones por frame).

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7). Tareas de Víctor: script de consola en el
README de Chessmate (lo cita el «Try it»), CV en PDF EN/ES.
**Limpieza manual del usuario:**
- Ramas locales ya fusionadas: `git branch -D feat/scroll-nav-hud docs/session-close-2026-10-23-4
  docs/session-close-2026-10-23-5 fix/aud-f2-5 docs/session-close-2026-10-24 feat/quick-mission
  docs/session-close-2026-10-24-2 feat/project-page docs/session-close-2026-10-24-3 fix/aud-f2-6
  docs/session-close-2026-10-24-4 fix/aud-f2-7 docs/session-close-2026-10-25 feat/project-images
  docs/session-close-2026-10-25-2 fix/aud-f2-8 docs/session-close-2026-10-25-3 fix/cosmos-entry-f2
  test/recruiter-journeys chore/release-0.1.0 fix/aud-f2-cierre`, y `docs/session-close-2026-10-26` cuando se
  fusione.
- En el buzón se pueden borrar `_claude/cadena/tmp/arbol*.tar.gz`, `_claude/cadena/tmp/*.blobs`,
  `_claude/cadena/tmp/s16-files.list`, `_claude/cadena/tmp/STATE-s16.md`, `_claude/cadena/tmp/cierre-s13.tar.gz` y
  `_claude/cadena/tmp/STATE-cierre-s12.md` y, dentro de `_claude/cadena/hecho/`, los `arbol.tar.gz` y
  `cambio.diff` (nunca la carpeta `_claude/cadena/`).

**Bloqueos:** ninguno.
