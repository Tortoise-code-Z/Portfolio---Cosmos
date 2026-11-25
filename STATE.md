# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba). La deuda abierta vive en `docs/06-roadmap/deuda.md`.

**Dónde estamos:** **C.7 · paso 1 (la entrada del Crew file) hecho:** PR 1 (#124), su auditoría (#126) y el PR 2, la
coreografía de la página (#127, `3644085`), en `main` · AUD-C7-2 preparada para la Mesa, sin lanzar · siguiente: las
naves, en su propia rama.

_Última actualización: 2026-11-25 (**CIERRE DE SESIÓN · 49**) · la coreografía de la llegada del Crew file (PR #127)._

**Hecho esta sesión** (vivas S49 en `_claude/cadena/hecho/2026-11-25/decisiones-vivas-S49.md`):
1. **C.7 · PR 2, la coreografía de la llegada** (PR #127 = `3644085`; respuestas C7P2-1-A a C7P2-4-A: línea del haz
   a todo el ancho, sin barrido de entrada, destello de 0,6 s al encajar, el Tab revela hasta volver por encima de la
   llegada):
   - `lib/scroll/arrivalChoreography`: `ARRIVAL_CHOREOGRAPHY` (esquinas 0,08–0,20 y 0,15–0,75, encaje 0,78, guías
     0,78–0,92) y sus funciones, fuera de la huella de las fotos fijas (sin `npm run stills`);
   - `features/journey/useArrivalChoreography`: bucle propio con la `m` suavizada (como el Big Bang) que escribe
     variables CSS y `data-arrival`/`data-locked`/`data-revealed`/`data-armed`/`data-on` en la sección; su primer frame,
     en el rAF siguiente (ver lecciones);
   - `Transmission`: `data-stage` > `data-screen` (lo que recorta el haz, con el fondo y las líneas de barrido) + las
     marcas (línea del haz y cuatro esquinas); el epílogo ya no usa el `IntersectionObserver` ni el barrido;
   - `CrewFile`: el marco es el destino (`data-arrival-target`), esconde sus esquinas hasta el encaje y las líneas guía
     salen del visor; tokens nuevos `--arrival-corner-inset`, `--arrival-corner-from`, `--arrival-beam-h` y
     `--dur-visor-lock` (`npm run og`: `tokens.css` entra en la huella de la imagen para compartir);
   - tests unitarios del hook y de los cortes, e2e de la coreografía (`crew-file.spec.ts`) y dos capturas con
     movimiento y la llegada parada en `a` = 0,4 y 1, **sin WebGL** (no queda reloj de la escena que parar);
   - docs: `05-crew-file.md`, ADR-039, `componentes.md`, `design-system.md`, `movimiento.md` (su coreografía),
     `calidad.md`, `deuda.md` y roadmap.
   - Peso de la escena sin cambios (257 340 B): todo va en el JS de la página.

**Incidencias y lecciones:**
- **Entrando por `/#crew-file`, la llegada se repetía entera (~1 s):** el efecto de la sección corre antes que el del
  puente del scroll (en la ruta, el padre), así que en el efecto `mTarget` aún es 0. El primer frame va en el rAF
  siguiente; hasta entonces la sección se ve entera, como sin JavaScript. Lo fija un e2e.
- **Un e2e que espera a la `m` suavizada de la página** no puede fiarse de «el estilo no cambia»: hasta que la `m` pasa de
  Contacto nada cambia y parece parada. Esperar a un valor que dependa de la `a` pedida.
- **El lío tras el merge:** `npm run og` regeneró `og-en.png` y `og-es.png` (solo cambia el suavizado del texto) y
  `npm run visual:update` reescribió 4 capturas con ruido (0–2 px). No entraron en el commit y viajaron a `main` sin
  commitear; se descartaron con `git restore` y `git pull`. Tras esos comandos, si `git status` enseña más de lo pedido,
  decidirlo antes del commit.
- **`npm run test:coverage` en Windows:** con la tanda entera agotaron su tiempo `sceneModules.test.ts`,
  `siteTelemetry.test.ts` y `useSceneShapes.test.ts`; sueltos y con `--maxWorkers=2` pasan, y en el contenedor también.
  La deuda crece (ver «Tests, CI y entorno»): toca un `chore` aparte.
- **Contenedor (S49):** el VM del equipo de Víctor no descarga los navegadores de Playwright: los e2e y las capturas se
  corrieron en la nube (Node 24 de `/opt/node24`, Chromium 1243 enlazado como 1248 en `~/pwb`, el árbol por un
  `tar` subido desde `_claude/tmp/s49/`). e2e de Chromium: 368/368. Los tres lentos de la primera tanda (constelaciones,
  Tab del viaje, el teletipo sin WebGL) tardan lo mismo sobre la base.

**Deuda anotada:** en `docs/06-roadmap/deuda.md`. Nuevo en S49: el marco del visor en móvil algo bajo con la foto fija,
el alto de la ventana de la línea del haz en móvil (F6) y más tests que agotan su tiempo en Windows.

**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`).
2. **Lanzar AUD-C7-2** si no se ha lanzado (el mensaje está en la cola del tablero: base `6905831`, hasta `3644085`;
   entrega en `_claude/cadena/aud-c7-2/auditoria.md`). Su corrección, entera y en su PR, antes de fusionar las naves.
3. **C.7 · las naves** (`docs/02-experiencia/transiciones-naves.md`, versión 8), en su propia rama desde `main`: su ADR
   (nuevo: mapa de formas `uFrom`/`uTo`/`uT`, rehacer sobre él el retrato atado a `m − 4`, `LAST_M` y la subida de
   `uPor`) sube el límite de peso de la escena (quedan 2 660 B). Las transmisiones podrán usar el tipo de tramo
   `arrival` y la coreografía genérica de `Transmission` (`data-arrival-target`).
4. Cuando convenga, el `chore` de los tests que agotan su tiempo en Windows (subirles el plazo o menos hilos).
5. Víctor: mirar en su móvil, con WebGL, el Crew file (si el marco del visor cae sobre la cara y si la línea del haz de
   la página va con la de las partículas); la imagen para compartir en WhatsApp (home y una ficha); `/#crew-file` en
   Brave en producción y el Sol en su móvil (también apaisado); pegar la descripción, la web y los topics de Cosmos en
   GitHub (`ABOUT_REPOS.md` del Proyecto de claude.ai); suavizar el CV y LinkedIn con el chat de mentor (y avisar para
   volver a copiar el PDF: lo pedirá `content.test.ts`); redirigir el portfolio antiguo de Vercel a tortoisecode.dev;
   mirar las líneas de las constelaciones en su pantalla; revisar los textos del Crew file y, si la quiere, una captura
   del Crew file para el README.

**Dudas abiertas:** D5 · analítica (F7). Tareas de Víctor: script de consola en el README de Chessmate (lo cita el
«Try it»).

**Limpieza manual del usuario:**
- Todo `_claude/tmp/` (copias del repo y archivos de las sesiones 34 a 49, entre ellas `s37/` a `s49/` —en `s44/`,
  `env.txt`, la copia vaciada de `.env`; en `s48/ci/`, el informe de WebKit del CI—, `c3/` y `aud-c2/`) y
  `_claude/lstree.txt`; `_claude/readme-originales/` si ya no hacen falta.
- Ramas locales ya fusionadas (todas menos `main`, entre ellas `feat/crew-arrival-choreography`, `fix/aud-c7-1`,
  `fix/aud-share`, `feat/crew-arrival`, `fix/favicon-xml`, `feat/share-image-favicon`, `fix/aud-f4-cierre`,
  `fix/aud-f4-5`, `chore/release-0.3.0`, `feat/earth-sun`, `fix/aud-f4-4b`, `feat/turtle-plates`, `feat/turtle-pins`,
  `fix/aud-f4-4a`, `fix/aud-c-cierre` y `chore/deps-2026-11`): `git branch` para verlas y `git branch -D <rama>`.
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
