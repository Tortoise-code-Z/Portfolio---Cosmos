# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** F2 · paso 7 en `main` y **AUD-F2-6 corregida** (PR #29, `2746f2a`) · **AUD-F2-7 entregada, sin
decidir** · siguiente: Víctor elige qué se corrige de AUD-F2-7 y se corrige en `fix/aud-f2-7`.

_Última actualización: 2026-10-24 (**CIERRE DE SESIÓN · 13**) · AUD-F2-6 corregida entera en 5 commits (PR #29,
squash): los 20 hallazgos y P1-C, P2-A, P3-B, P4-A, P5-A, P6-A, más un arreglo para Firefox que pidió el CI; sin ADR
nuevo (una línea en ADR-018). 727 unitarios y 139 e2e en Chromium; CI en verde en los tres navegadores._

**Hecho esta sesión** (vivas S13 en `_claude/cadena/hecho/2026-10-24/decisiones-vivas-S13.md`):
1. **Letra grande y foco** (`5054d72`): la barra es un contenedor (`container: topbar`); el chip pide además 52em y
   la etiqueta larga de «Quick mission» 28em (con el texto al 100 % mandan md y sm). Mientras se ve el aviso de
   idioma, su alto (`--_notice-h`, `useHeightVar(…, 'root')`) amplía el `scroll-padding` de abajo y el final de la
   página. `ButtonOutline` parte su texto en vez de salirse. `scrollbar-gutter: stable` en `:root`; el modo usa
   `100vw`. Cabecera del modo fija (`--color-void`) y el rótulo como `aria-describedby`.
2. **Lógica** (`2119c28`): el modo abierto por un cambio de ancla devuelve el ancla de antes y Atrás lo cierra;
   `quickMission.ts` suelto (ADR-018; `structure.test.ts` caza una carpeta con un solo archivo de su nombre);
   `lib/storage` recuerda en memoria lo que no pudo guardar y avisa una vez por clave; `CopyButton` anuncia cada
   intento (`key`) y usa `copy.idle/copied/failed`; elegir idioma con EN / ES contesta el aviso
   (`rememberLanguageAnswer`).
3. **Tests** (`e752b10`): Tab del modo con `:modal` y cruzando los dos bordes, temporizador y StrictMode de
   `CopyButton`, el aviso el último en el Tab (viaje y ficha), sin portapapeles explícito, negativas e2e tras hidratar,
   44 px de los controles de F2.6. Cada uno, comprobado rompiendo el código.
4. **Docs** (`422c1c3`): `console.error`/`warn` en arquitectura, ADR-006, tres comentarios, componentes,
   design-system, estados-y-accesibilidad, `calidad.md` (nombra ya los e2e de F2.6 y F2.7) y `01-nebulosa.md`.
5. **Firefox** (último commit del PR): Firefox no mira el `scroll-padding` si lo enfocado ya está en la ventana,
   aunque quede bajo el aviso; `Notice` sube la página lo justo tras cada `focusin` (en Chromium no hace nada).
6. **AUD-F2-7** entregada por la Mesa: 7 recomendados, 16 menores y P1–P5. Sin decidir.

**Incidencias y lecciones:**
- Método de siempre en el contenedor (Node 24 de `node-linux-x64`, enlaces `chromium*-1248 → -1243`, `.env`), clon
  de GitHub; cada commit pasado con `tar` a `_claude/cadena/tmp/arbol-s13-cN.tar.gz`, `cat > destino` y
  `git hash-object` contra `s13-cN.blobs`; `HEAD^{tree}` igual tras cada commit. Un archivo movido: Víctor hace el
  `git rm` del viejo (la sesión no borra en su equipo).
- **El contenedor no tiene Firefox ni WebKit** (no se pueden instalar): lo que dependa del scroll al enfocar o de la
  barra de scroll, mirarlo en el CI antes de dar un paso por cerrado. Para imitar a Firefox en Chromium sirve
  `focus({ preventScroll: true })`.
- **Chromium headless reserva el hueco de `scrollbar-gutter: stable`** (15 px) aunque oculte las barras: medir
  centrados contra un `position: fixed; inset: 0` y no contra `innerWidth`. El salto lateral en sí no se ve allí.
- Los umbrales en `em` de una auditoría se miden antes de aplicarlos: los propuestos (66em/35em) habrían quitado el
  chip con el texto al 100 % entre 900 y ~1100 px. Un barrido de anchos × tamaños de letra lo resolvió.
- Estado de módulo (`lib/storage`): los tests lo aíslan con `vi.resetModules()` e `import()` dinámico.
- El preview del contenedor puede morir entre turnos: relanzarlo con `setsid`. El aviso de «push» del contenedor se
  ignora (nunca se sube desde allí).

**Deuda anotada:**
- **AUD-F2-7** (entregada, sin decidir): `_claude/cadena/aud-f2-7/auditoria.md`. Al corregir, contrastar con
  `2746f2a`: de su hallazgo 23 ya están la memoria de `lib/storage`, el hueco de la barra de scroll (vale para el
  visor), el aviso el último en el Tab en la ficha, el foco bajo el aviso en la ficha y `project-page.spec.ts` en
  `calidad.md`; faltan el e2e de la barra al 200 % en una ficha, los 44 px de la ficha, asentar la posición en el e2e
  de Atrás y el test nuevo de `seo.spec.ts` en `calidad.md`. Su 17 (`ui/Lightbox` con claves `project.gallery.*`)
  sigue el camino de `copy.*`.
- **Windows/Edge:** comprobar a mano que abrir y cerrar «Quick mission» no hace saltar la página de lado
  (`scrollbar-gutter`), si no se hizo antes del merge.
- **F2.8:** e2e del visor con las imágenes reales; portadas y galerías (se pintan solas al tener datos).
- **F5:** la placa iluminada al volver lee `uiStore.visitedProject` (el mismo dato del foco en la fila).
- En el visor y en la misión rápida (modal nativo), el Tab puede pasar por la interfaz del navegador antes de volver
  al diálogo: la página sigue inerte. Aceptado; mirarlo con NVDA en F6.
- **F6 · tableta:** entre 520 y 900 px el HUD (abajo a la izquierda) pasa por encima del texto del panel al hacer
  scroll, como el prototipo (es decorativo y sin puntero), y la sugerencia de idioma lo tapa hasta que se contesta.
- **F6 · texto al 200 %:** a 390 px, las filas de Proyectos del viaje se salen del ancho (`scrollWidth` ≈ 605 px).
  La ficha de proyecto y la 404 no (lo vigila `project-page.spec.ts`).
- **F3:** la escena deja de pintar con `quickMissionOpen` de `uiStore` (roadmap F3.5).
- **F6 · NVDA (F2.6):** tras «No, gracias» el aviso desaparece y el foco cae al `body`; antes de hidratar,
  «Quick mission» no hace nada (sin JS, el viaje ya tiene todo).
- **F3:** la escena suaviza `m`; hasta entonces `setScrollTarget` escribe `m = mTarget` (ADR-021 → Consecuencias).
- **F3.1:** el `test` del grupo `framework` de `vite.config.ts` es todo `node_modules`: excluir `three` y
  `@react-three/*` antes de importar la escena en diferido (ADR-020 → Consecuencias; roadmap F3.1).
- **F6 · NVDA:** en modo exploración, NVDA/JAWS activan con un clic sintético que el `HoldButton` ignora.
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
2. **Decidir AUD-F2-7** (Víctor): qué se corrige de 1–23 y P1–P5 (recomendadas: P1-C, P2-C, P3-A, P4-B, P5-C).
3. Corregirla en `fix/aud-f2-7` (esquema → VB), contrastando cada hallazgo con `2746f2a`.
4. Después, **F2 · paso 8**: imágenes de proyectos (portada y galería) y e2e del visor con ellas.

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7) · Tareas de Víctor: script de consola en el README
de Chessmate (lo cita el «Try it»), CV en PDF EN/ES, capturas de los proyectos (F2.8).
**Limpieza manual del usuario:** ramas locales ya fusionadas: `git branch -D feat/scroll-nav-hud
docs/session-close-2026-10-23-4 docs/session-close-2026-10-23-5 fix/aud-f2-5 docs/session-close-2026-10-24
feat/quick-mission docs/session-close-2026-10-24-2 feat/project-page docs/session-close-2026-10-24-3 fix/aud-f2-6`
(y `docs/session-close-2026-10-24-4` cuando se fusione). En el buzón se pueden borrar `_claude/cadena/tmp/arbol*.tar.gz`,
`_claude/cadena/tmp/*.blobs` y `_claude/cadena/tmp/STATE-cierre-s12.md` y, dentro de `_claude/cadena/hecho/`, los
`arbol.tar.gz` y `cambio.diff` (nunca la carpeta `_claude/cadena/`). · **Bloqueos:** ninguno.
