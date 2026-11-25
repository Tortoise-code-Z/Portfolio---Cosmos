# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba). La deuda abierta vive en `docs/06-roadmap/deuda.md`.

**Dónde estamos:** **C.7 · naves: N1 (el mapa de formas) con su auditoría corregida** (#130, `b774e1b`) y **la cara
del Crew file sigue a su marco** (#131, `13eb188`; ADR-042) · siguiente: decidir EST-C7-N2 y construir N2 (el
satélite).

_Última actualización: 2026-11-25 (**CIERRE DE SESIÓN · 51**) · AUD-C7-N1 corregida entera; el PR B del Crew file (la
cara en su marco, sin gravedad y con menos giro)._

**Hecho esta sesión** (vivas S51 en `_claude/cadena/hecho/2026-11-25/decisiones-vivas-S51.md`):
1. **AUD-C7-N1 decidida y corregida entera** (PR #130 = `b774e1b`; 1-A, 4 solo el unitario, 7-A, P1-A; el resto tal
   cual): `shape()` con una rama por forma (el retrato explícito; un id sin rama no pinta nada); tests de la cabecera
   en positivo (cada forma de `SHAPE_TRACK` con su `isTag(id, SHAPE_…)`, ningún id a mano, `uM` solo para el haz,
   `SHAPE` vigilado); tabla «cuenta vieja del shader frente al mapa de formas» en 16 `m` (también a mitad de un
   cambio); `SHAPE_TRACK_REST`; uniforms del GLSL = los de TS; sin objetos por frame (espiado); docs y ADR-039/041
   al día. Lo del epílogo quieto (dos formas) y el color de la singularidad, a la deuda. Los tests nuevos se probaron
   rompiendo el código (6 mutaciones, todas cazadas). Fotos fijas idénticas; solo `stills.json`.
2. **PR B · la cara sigue a su marco** (PR #131 = `13eb188`; ADR-042; vivas S50 #8, #9, #13, #14 y S51 #6–#14): la
   página mide el marco (`usePortraitFollow` + `lib/scroll/portraitShift`, en `sceneStore.portraitShift`) y
   `CameraRig` descentra la proyección (`setViewOffset`) con la presencia del retrato; sin WebGL, la foto del epílogo
   se mueve igual (CF-3-A: abajo queda fondo, aceptado); las fotos fijas se sacan con el marco escondido. En
   escritorio el visor va en la columna del centro, del aviso al final de la ficha, y el marco en el centro de ese
   bloque (sin `sticky`). **Añadidos de Víctor:** la gravedad del cursor ya no toca la cara (GRAV-1-A: por
   partícula, `1 − tt · uPor`; el giro se queda) y la cara gira menos (`PORTRAIT_TURN` 0,22 rad, ~±12,6°; antes
   0,44). Peso de la escena: **257 898 B** (+277; quedan 2 102 B).

**Incidencias y lecciones:**
- **Pre-push caído por un test lento que causó el código nuevo:** medir el marco en cada scroll de toda la página
  (2 `getBoundingClientRect`) llevó `journey.test.tsx` de 145 a 808 ms (su mock hace un `querySelectorAll` por
  medida) y en Windows pasó de 5 s. Arreglo: solo se sigue el scroll con el marco a menos de una ventana
  (`IntersectionObserver`). **Lección:** un listener de scroll global se mide en los tests de la página entera.
- **`documentElement.clientWidth` cuenta el hueco de `scrollbar-gutter: stable` en Chromium** (7,5 px a 390): el ancho
  del lienzo se lee de la caja de `<html>`.
- **WebKit (CI) no refresca en sus capturas lo que pinta WebGL tras un scroll** (las mismas cifras con la captura del
  lienzo y con la de la ventana), aunque el vídeo de la traza muestra la cara en su marco. Dos intentos antes de verlo
  (tiempo; recorte de elementos fijos: ninguno era). El e2e con WebGL de la cara corre solo en Chromium; el de sin
  WebGL, en los tres. **Lección:** antes de culpar al código en WebKit, mirar el vídeo de la traza
  (`screencast/` del zip). Firefox, en el CI, no tiene WebGL2: los e2e de escena necesitan `skipWithoutWebGL2`.
- **`npm run visual:update` borra y rehace todas las capturas:** salieron tres más (tortuga y Mission control) por
  redondeo de SwiftShader con el shader cambiado (≤ 24/255, píxeles sueltos); se commitearon.
- **El contenedor:** Node 24 del paquete npm (`node@24.22.0` en `~/n24`), Chromium 1243 enlazado como 1248 en `~/pwb`,
  el árbol desde `_claude/tmp/s51/arbol.tgz` y `main` de base con `git archive`; volcado con `device_commit_files`.
  Las fotos fijas se compararon con las de la base sacadas en el contenedor (20 idénticas en los dos PR). La huella,
  puesta a mano con `stillsFingerprint` tras retocar comentarios. `npx vite build` se cuelga: usar `npm run build`.

**Deuda anotada:** en `docs/06-roadmap/deuda.md`. Nuevo en S51: el epílogo quieto evalúa dos formas (para el PR del
satélite); la mezcla muerta del color de la singularidad; la cara en su marco en un móvil real y en Safari (el e2e con
WebGL solo corre en Chromium).

**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`).
2. **Decidir EST-C7-N2** (`_claude/cadena/est-c7-n2/preguntas.md`, 14 preguntas; su sello es `00c8a5b` + vivas S50
   hasta #5). Antes, contrastarlas con lo que entró después: el mapa de formas tal como quedó (#128, #130: `mapM` no
   cambia, el par sale de la `m` de la escena; `shape()` con una rama por forma; `SHAPE_TRACK_REST`), la cara que
   sigue a su marco (#131, ADR-042: `CameraRig` con `setViewOffset` en el epílogo) y la deuda del epílogo quieto.
3. **N2 · el satélite** en su rama desde `main` (`transiciones-naves.md`, versión 8): la segunda coordenada de las
   formas, `uSolid`, los tramos, el tope de peso (quedan 2 102 B) y, de paso, que el epílogo quieto evalúe una forma.
4. Cuando convenga, el `chore` de los tests que agotan su tiempo en Windows.
5. Víctor: mirar en su móvil, con WebGL, el Crew file (la cara en su marco al hacer scroll, sin gravedad y con menos
   giro) y, si puede, en Safari; la línea del haz; la imagen para compartir en WhatsApp; `/#crew-file` en Brave en
   producción y el Sol en su móvil (también apaisado); pegar la descripción, la web y los topics de Cosmos en GitHub
   (`ABOUT_REPOS.md` del Proyecto de claude.ai); suavizar el CV y LinkedIn con el chat de mentor (y avisar para volver
   a copiar el PDF: lo pedirá `content.test.ts`); redirigir el portfolio antiguo de Vercel a tortoisecode.dev; mirar
   las líneas de las constelaciones en su pantalla; revisar los textos del Crew file y, si la quiere, una captura del
   Crew file para el README.

**Dudas abiertas:** D5 · analítica (F7). Tareas de Víctor: script de consola en el README de Chessmate (lo cita el
«Try it»).

**Limpieza manual del usuario:**
- Todo `_claude/tmp/` (copias del repo y archivos de las sesiones 34 a 51, entre ellas `s37/` a `s51/` —en `s44/`,
  `env.txt`, la copia vaciada de `.env`; en `s48/ci/` y `s51/ci/`, los informes del CI; en `s50/rep/`, el informe del CI
  descomprimido; en `s51/`, `arbol.tgz`, `base-src.tgz` y `vis/`—, `c3/` y `aud-c2/`) y `_claude/lstree.txt`;
  `_claude/readme-originales/` si ya no hacen falta.
- Ramas locales ya fusionadas (todas menos `main`, entre ellas `feat/crew-visor-follow`, `fix/aud-c7-n1`,
  `refactor/scene-shape-map`, `fix/aud-c7-2`, `feat/crew-arrival-choreography`, `fix/aud-c7-1`, `fix/aud-share`,
  `feat/crew-arrival`, `fix/favicon-xml`, `feat/share-image-favicon`, `fix/aud-f4-cierre`, `fix/aud-f4-5`,
  `chore/release-0.3.0`, `feat/earth-sun`, `fix/aud-f4-4b`, `feat/turtle-plates`, `feat/turtle-pins`, `fix/aud-f4-4a`,
  `fix/aud-c-cierre` y `chore/deps-2026-11`): `git branch` para verlas y `git branch -D <rama>`.
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` y, dentro de `_claude/cadena/hecho/`, los
  `arbol*.tar.gz`, `base-src.tar.gz`, `previas.tar.gz` y los `*.diff` (nunca la carpeta `_claude/cadena/`, ni
  `hecho/2026-10-28/medir-fps.js` ni `hecho/2026-10-28/encuadre/` ni `hecho/2026-11-24/medir-fps.js`, ni
  `hecho/2026-11-25/aud-c7-2/anadidos/`). Mover a mano a `hecho/` lo que no se pudo desde aquí (`aud-f4-1/` a
  `hecho/2026-11-18/`, `aud-c2/` a `hecho/2026-11-21/` y `aud-c7-2/` a `hecho/2026-11-25/`, si siguen fuera). No borrar
  `_claude/diseno/`, `_claude/retrato/`, `_claude/naves/`, `_claude/crew-entrada/` ni `_claude/c3/`.
- En la raíz del repo, los `playwright-report-*.zip` (si vuelven a aparecer) y `test-results/`.
- Perfiles temporales de las pruebas sin WebGL: `$env:TEMP\cosmos-sin-webgl` y `$env:TEMP\cosmos-swiftshader`.
- Si alguna vez falla `npm ci` dentro de Docker: `docker volume rm cosmos-portfolio-visual-node-modules`.

**Bloqueos:** ninguno.
