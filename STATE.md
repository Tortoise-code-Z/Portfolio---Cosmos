# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** F2 · paso 4 en `main` (PR #17, `e1b13e1`) · la Mesa ya entregó **AUD-F2-4** (sin decidir) ·
siguiente: **decidir AUD-F2-4** y corregirla; después **F2 · paso 5** (scroll, raíl, HUD, barra superior).

_Última actualización: 2026-10-23 (**CIERRE DE SESIÓN · 7**) · el viaje completo sin escena: hero y capítulos 1–4,
ADR-019 (un solo CSS) y ADR-020 (presupuesto de JS en dos partes); CI verde en los tres motores._

**Hecho esta sesión:**
1. **UI base:** `Icon` (SVG propios), `ActionLink` (interno / externo / descarga; el externo anuncia la pestaña nueva
   con la clave `link.newTab`), `HoldButton` (anillo SVG con `--_charge`, nombre = texto visible y explicación en
   `aria-describedby`, `aria-disabled` al detonar) y `VisuallyHidden`.
2. **Esqueleto:** `ChapterSection` (región con ancla y altura **mínima** por tokens `--chapter-h-*`), `ChapterPanel`
   (velo, corchetes, *sticky* en escritorio; si es más alto que la ventana se fija por abajo con `--_panel-h`) y
   `Eyebrow`. Anclas en `src/content/chapters.ts`.
3. **Hero (cap. 0):** punto y halo en CSS, detonación funcional sin efectos (P4-1-A): 1,5 s con ratón, dedo,
   Espacio/Enter o zona vacía del hero → baja a About; se rearma arriba del todo. Carga en `lib/hold` (rAF + variable
   CSS, sin estado por frame).
4. **Capítulos 1–4:** About, Skills (frase ratón/táctil por CSS), Projects (`ProjectRow`, enlaces con el nombre del
   proyecto oculto) y Contact (disponibilidad del perfil, `mailto:`, CV solo si existe, formación, pie con
   `SITE_REPOSITORY`).
5. **ADR-019:** todo el CSS en un archivo (`cssCodeSplit: false`): la 404 de `/ES` o de un slug desconocido hidrata sin
   el error #418. Resuelve también el riesgo de la hoja de la 404 en F2.7 (AUD-F2-3-P2).
6. **ADR-020:** presupuesto de JS = framework ≤ 112 KB (107,3) + código propio ≤ 35 KB por página (home 17,4,
   proyecto 12,6, 404 7,0). Cierra la deuda del JS de la página de proyecto.
7. **e2e `journey.spec.ts`** (sustituye a `hello.spec.ts`): capítulos EN/ES, anclas, detonación (también con
   movimiento reducido), encuadre en 3 tamaños, Tab con anillo de foco visible, CLS con fuentes lentas, sin JS.
8. **Foco:** `scroll-padding-block-end: var(--space-6)` en `global.css` (Firefox dejaba el último enlace pegado al
   borde; el test endurecido lo reproducía también en Chromium).
9. Docs al día (tokens, componentes, movimiento, cap. 0, arquitectura con el árbol y la regla de nombres, calidad,
   textos). Duda explicada: `_claude/dudas/2026-10-23-hojas-de-estilo-404-hidratacion.md`. 362 unitarios y 59 e2e
   (Chromium); CI verde en Chromium, Firefox y WebKit.

**Incidencias y lecciones:**
- **CSS por ruta + 404 servida desde `404.html`** = error de hidratación cuando el cliente casa otra ruta: lo vigila
  el e2e «every page links the same single stylesheet» (ADR-019).
- **Firefox solo en CI:** el contenedor solo tiene Chromium. Un test de visibilidad «al píxel» pasó en Chromium y
  falló en Firefox; los tests de encuadre deben medir con margen real (el anillo de foco), no con decimales.
- **Accessible names:** un `VisuallyHidden` (posición absoluta) tras texto en línea hace que Chrome meta un espacio
  («View project , Chessmate»); se pone un espacio de texto real antes y sin puntuación.
- `aria-label` largo en un botón con texto visible incumple WCAG 2.5.3: la explicación va en `aria-describedby`.
- Playwright: esperar a la hidratación (`networkidle`) antes de mantener una tecla; sin ella, el gesto se pierde.
- Las copias de trabajo del contenedor dejaban commits locales y el aviso de «push» saltaba: tras el push de Víctor
  se alinea la copia con su rama de GitHub (nunca se sube desde el contenedor).
- Seguir probando en Windows antes de commitear cuando cambia `vite.config.ts` (esta vez, verde).

**Deuda anotada:**
- **AUD-F2-4 sin decidir** (`_claude/cadena/aud-f2-4/auditoria.md`): 7 recomendados, 15 menores, 3 preguntas; ninguno
  bloqueante. El -21 (árbol de `arquitectura.md`) queda hecho en este cierre; sus otras dos partes, no. El -6 ya está
  en parte cubierto por el arreglo de Firefox (viva S7 #24).
- La flecha «→» de los pasos TryIt de Chessmate se maqueta con el icono SVG en **F2.7** (página de proyecto).
- **Riesgo F2.7 · `NotFoundPage`:** al maquetarla, moverla a `features/` (o `ui/`); lo de las hojas duplicadas ya no
  aplica (ADR-019).
- Grupos de Skills enfocables (`tabindex`) solo en **F4.3**, cuando enciendan su constelación.
- Iconos de GitHub y LinkedIn: hoy enlaces de texto + icono externo; decidir si se dibujan en F2.6/F6.
- **CLS** del hero: ≤ 0,006 con fuentes lentas (sin caras de reserva); volver a medir en un móvil real en **F6**.
- **WebKit descarga dos veces las fuentes precargadas** (bug 194589): en F6, medir en un Safari real.
- Contraste AA sobre el velo de los paneles (`--color-veil`) encima de la escena: F3–F4 (ADR-015).
- La lista de valores neutros del test de colores obliga a ampliarla con un valor legítimo nuevo (a propósito).
- `@lhci/cli` y los scripts `visual` / `lhci` se instalan en F3/F6.
- **F7:** que `/es/*` reciba la 404 ES y que las 404 salgan con estado 404 real en Vercel (en `preview` salen con
  200); comprobar el `X-Robots-Tag: noindex` de las previews; **`cleanUrls: true`** en `vercel.json` (AUD-F2-3-13).
- Provisional: páginas mínimas de proyecto y 404 (F2.7), `favicon.svg` (F6).
- Fuera de este paso: la sugerencia «¿Ver en español?» (F2.6) no tiene claves en `textos-sitio.md`.
- **React Router 8.4 no pasa `caseSensitive` a las rutas del cliente:** lo cubre `isLowerCasePathname`. Al
  actualizar React Router, comprobar si ya lo pasa.
- `throw data(null, { status: 404 })` en un `loader` choca con `@typescript-eslint/only-throw-error`: si F2.7 lanza
  404 desde `loader`, configurar el `allow` de la regla.

**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`).
2. **Decidir AUD-F2-4** con Víctor: elegir hallazgos (`AUD-F2-4: corrige …; no …`) y responder P1 (foco tras
   detonar), P2 (citar claves del buzón en `DECISIONS.md`, como ADR-018/019/020) y P3 (*sticky* «primera mitad»
   del capítulo vs toda la sección). Sello: commit 908ad8a + vivas S7 hasta #24 (hoy en `main` como `e1b13e1`).
   Corregir en `fix/aud-f2-4`.
3. Después, **F2 · paso 5** (`mapM` con tests, raíl, HUD y barra superior): esquema → VB. Docs:
   `docs/02-experiencia/scroll-y-escena.md` y `navegacion.md`, `docs/03-diseno/componentes.md`. La barra fija
   añade su altura en `scroll-padding-block-start`; `mapM` mide la altura real de las secciones (son mínimas).

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7) · Tareas de Víctor: script de consola en el README
de Chessmate (F2.7), CV en PDF EN/ES.
**Limpieza manual del usuario:** ramas locales ya fusionadas: `git branch -D feat/journey-chapters fix/aud-f2-2
fix/aud-f2-3 docs/session-close-2026-10-23-2` (y `docs/session-close-2026-10-23-3` cuando se fusione). En el buzón,
dentro de `_claude/cadena/hecho/`, se pueden borrar los `arbol.tar.gz` y los `cambio.diff` (nunca la carpeta
`_claude/cadena/`).
· **Bloqueos:** ninguno.
