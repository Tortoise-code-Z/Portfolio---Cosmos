# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba). La deuda abierta vive en `docs/06-roadmap/deuda.md`.

**Dónde estamos:** **C.7 · primer paso (la entrada del Crew file)** · PR 1 (#124) y la corrección de su auditoría
(#126, `9f83a74`) en `main` · siguiente: el PR 2 (la coreografía de la página).

_Última actualización: 2026-11-25 (**CIERRE DE SESIÓN · 48**) · AUD-C7-1 decidida y corregida entera; la deuda
anotada pasa a su propio doc y `STATE.md` vuelve a ser una foto ligera._

**Hecho esta sesión** (vivas S48 en `_claude/cadena/hecho/2026-11-25/decisiones-vivas-S48.md`):
1. **AUD-C7-1 decidida y corregida entera** (PR #126, `9f83a74`; 8 recomendados y 22 menores). Respuestas: P1-A (el
   tramo de la llegada en línea recta, `JourneyStep.linear`), P2-A (con movimiento reducido el retrato llega solo,
   escrito), P3-A (el escenario mide lo visible bajo la barra durante la llegada), P4-A (cambiar de idioma a mitad de
   la llegada aterriza en `#crew-file`, escrito y con test), P5-B (sin WebGL, la foto fija sigue a la forma) y P6-A
   (capturas con movimiento en el PR 2). Lo principal:
   - el foco del escenario solo actúa con Tab (`tabIndex` ≥ 0 y `:focus-visible`), respeta el `scroll-padding` de
     abajo, se corta si el usuario mueve la página y no actúa sin llegada: el raíl vuelve a ir suave;
   - el marcador `data-landing` va el primero en el DOM (el Tab desde `/#crew-file` entra en el Crew file) y el
     escenario se busca por `data-stage`;
   - alto contraste sobre `Canvas`; sin hueco al imprimir; `.arriving` recorta solo;
   - `EPILOGUE_ARRIVAL.beamReach` (1,025) llega al shader como `ARRIVAL_BEAM_REACH`; el haz se compara tras la
     gravedad; lo que solo pinta la página va en `lib/scroll/arrivalChoreography` (fuera de la huella);
     `selectActiveChapter` se quita (las fotos leen `selectStillChapter`);
   - tests (cámara, Sol y gravedad con anclas fijas, el puente con y sin llegada, HUD e idioma en la llegada, claves
     tipo `C7E-1` en `code-references`) y e2e nuevos; docs y ADR-032/034/039.
   - Peso de la escena: 257 367 B medidos en `main` antes (sin cambios en la escena desde los 257 312 B apuntados:
     los nombres con hash de los chunks); la corrección, −27 B: **257 340 B**; quedan 2 660 B.
2. **La deuda anotada sale de `STATE.md`** a `docs/06-roadmap/deuda.md` (ADR-040): agrupada por tema y sin claves del
   buzón; el Mapa de `CLAUDE.md`, `docs/README.md` y `DEVELOPMENT_RULES.md` (§3 y §13) apuntan allí.

**Incidencias y lecciones:**
- **El CI del PR #126 falló en WebKit** («the rail travels to it smoothly»: 0 valores intermedios). Sin GPU, WebKit
  acaba un scroll suave en uno o dos frames. Para probar que algo no corta un scroll, espiar la llamada que lo cortaría
  (`window.scrollTo`), no muestrear `scrollY`; los valores intermedios, solo fuera de WebKit.
- **Sospechados confirmados sobre la base antes de corregir** (regla de §13): un `git worktree` de `0f7d51f` con su
  build y los e2e nuevos. Destapó que el e2e de alto contraste pasaba también en la base: Chromium pinta `Canvas` con
  el alfa del CSS (`rgba(255, 255, 255, 0)`), así que hay que exigir un color opaco, no «distinto de transparente».
- **jsdom y `:focus-visible`:** depende de los eventos de tests anteriores del mismo archivo; los tests del foco lo
  fijan con un espía de `Element.prototype.matches`.
- **Orden de los comandos de un commit de solo docs:** el cierre dio `git pull --rebase` antes del `git add`, y git no
  deja hacer el rebase con cambios sin commitear. El orden es commit, `git pull --rebase` y push (§10 y
  `git-y-despliegue.md`, ya corregidos).
- **`npm run check` en el equipo de Víctor (S48):** fallaron por tiempo `docsOnly.test.ts` (su `beforeAll`) y
  `useSceneShapes.test.ts` con la tanda entera; sueltos pasan (deuda, «Tests, CI y entorno»).
- **Contenedor (S48):** limpio al empezar. Node 24 del paquete npm (`node@24.22.0`), Chromium 1243 enlazado como 1248
  en `~/pwb`, el árbol con `git archive` de `0f7d51f` en `~/repo` (`git init` con `core.hooksPath /dev/null`),
  volcado con `tar --overwrite` y `md5sum -c` (base antes, nuevos después). e2e de Chromium enteros: 362 en ~11 min,
  con la huella de las fotos puesta a mano solo en el contenedor (las fotos las saca Víctor en Docker).

**Deuda anotada:** en `docs/06-roadmap/deuda.md`. Nuevo en S48: WebKit y el scroll suave en el CI, jsdom y
`:focus-visible`, lo que lee el PR 2 de C.7 y los dos tests que agotan su tiempo en `npm run check` en Windows.

**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`).
2. **C.7 · PR 2 de la entrada del Crew file** (rama nueva desde `main`, `9f83a74`): la coreografía de la página, en un
   bucle propio con la `m` suavizada (como ADR-030) que escribe variables CSS: el haz revela la sección de arriba abajo
   (`clip-path` con `arrivalBeamLine`, la misma línea que el shader), las esquinas del visor se cierran (0,15 → 0,75)
   sobre el rectángulo del escenario (`data-stage`, lo visible bajo la barra), encaje en 0,78, líneas guía
   0,78 → 0,92, la ficha con el teletipo al encajar y «Identity verified»; el foco revela de golpe; con movimiento
   reducido, nada. Los cortes van en la escala lineal de `a`. Una o dos capturas con movimiento y la llegada parada
   (`05-crew-file.md` → «Transición», ADR-039). Después, su auditoría a la Mesa.
3. Después, las naves (`transiciones-naves.md`, versión 8; su ADR sube el límite de la escena).
4. Víctor: mirar la imagen para compartir en WhatsApp (home y una ficha); mirar `/#crew-file` en Brave en producción
   y el Sol en su móvil (también apaisado); pegar la descripción, la web y los topics de Cosmos en GitHub
   (`ABOUT_REPOS.md` del Proyecto de claude.ai); suavizar el CV y LinkedIn con el chat de mentor (y avisar para volver
   a copiar el PDF: lo pedirá `content.test.ts`); redirigir el portfolio antiguo de Vercel a tortoisecode.dev; mirar
   las líneas de las constelaciones en su pantalla; revisar los textos del Crew file y, si la quiere, una captura del
   Crew file para el README.

**Dudas abiertas:** D5 · analítica (F7). Tareas de Víctor: script de consola en el README de Chessmate (lo cita el
«Try it»).

**Limpieza manual del usuario:**
- Todo `_claude/tmp/` (copias del repo y archivos de las sesiones 34 a 48, entre ellas `s37/` a `s48/` —en `s44/`,
  `env.txt`, la copia vaciada de `.env`; en `s48/ci/`, el informe de WebKit del CI—, `c3/` y `aud-c2/`) y
  `_claude/lstree.txt`; `_claude/readme-originales/` si ya no hacen falta.
- Ramas locales ya fusionadas (todas menos `main`, entre ellas `fix/aud-c7-1`, `fix/aud-share`, `feat/crew-arrival`,
  `fix/favicon-xml`, `feat/share-image-favicon`, `fix/aud-f4-cierre`, `fix/aud-f4-5`, `chore/release-0.3.0`,
  `feat/earth-sun`, `fix/aud-f4-4b`, `feat/turtle-plates`, `feat/turtle-pins`, `fix/aud-f4-4a`, `fix/aud-c-cierre` y
  `chore/deps-2026-11`): `git branch` para verlas y `git branch -D <rama>`.
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` y, dentro de `_claude/cadena/hecho/`, los
  `arbol*.tar.gz`, `previas.tar.gz` y los `*.diff` (nunca la carpeta `_claude/cadena/`, ni `hecho/2026-10-28/medir-fps.js`
  ni `hecho/2026-10-28/encuadre/` ni `hecho/2026-11-24/medir-fps.js`). Mover a mano a `hecho/` lo que no se pudo desde
  aquí (`aud-f4-1/` a `hecho/2026-11-18/` y `aud-c2/` a `hecho/2026-11-21/`, si
  siguen fuera). No borrar `_claude/diseno/`, `_claude/retrato/`, `_claude/naves/`, `_claude/crew-entrada/` ni
  `_claude/c3/`.
- En la raíz del repo, los `playwright-report-*.zip` y `test-results/`.
- Perfiles temporales de las pruebas sin WebGL: `$env:TEMP\cosmos-sin-webgl` y `$env:TEMP\cosmos-swiftshader`.
- Si alguna vez falla `npm ci` dentro de Docker: `docker volume rm cosmos-portfolio-visual-node-modules`.

**Bloqueos:** ninguno.
