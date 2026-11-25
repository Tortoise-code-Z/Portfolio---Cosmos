# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba). La deuda abierta vive en `docs/06-roadmap/deuda.md`.

**Dónde estamos:** **C.7 · naves, N1 (el mapa de formas) hecho y en `main`** (#128, `a973c32`), con AUD-C7-2 corregida
antes (#129, `6d0f0ff`) · AUD-C7-N1 y el estudio EST-C7-N2 entregados por la Mesa, **sin decidir** · siguiente: decidir
y corregir AUD-C7-N1, los añadidos del Crew file (PR B) y, después, N2 (el satélite).

_Última actualización: 2026-11-25 (**CIERRE DE SESIÓN · 50**) · el mapa de formas (ADR-041) y la corrección entera de
AUD-C7-2._

**Hecho esta sesión** (vivas S50 en `_claude/cadena/hecho/2026-11-25/decisiones-vivas-S50.md`):
1. **C.7 · naves en cuatro PR** (NAV-1-A): N1 mapa de formas · N2 satélite (Mission log) · N3 nave nodriza (Mission
   control) · N4 coreografía de la página de las transmisiones. El tope de peso de la escena se decide en N2 con la
   cifra medida (NAV-2-C; la prueba v8 entera son ~6,7 KB gzip de GLSL).
2. **N1 · el mapa de formas** (PR #128 = `a973c32`; ADR-041): el shader recibe `uFrom`/`uTo`/`uT` con ids fijos
   (`SHAPE`: 0 singularidad … 4 Tierra · 5 satélite · 6 nave nodriza · 7 retrato) en vez de `floor(m)`;
   `lib/scroll/shapeTrack` (`SHAPE_TRACK`, `shapePosition`, `shapeMixAt`); fuera del shader `LAST_M`, el remapeo de la
   llegada y lo atado a «la forma 5»; con `uT` 0, una sola forma. **Sin cambio visible:** las 20 fotos fijas salen
   idénticas byte a byte (comparadas en el contenedor contra `00c8a5b`; en Docker solo cambió `stills.json`). Peso de la
   escena: +255 B (257 585 B medidos en Linux). En N1 el par de formas sale de la `m` de la escena y `mapM` no cambia
   (viva #6): la segunda coordenada de las formas en los interludios llega con N2.
3. **AUD-C7-2 corregida entera** (PR #129 = `6d0f0ff`; P1-A a P4-A): el bucle mide antes de escribir; el Tab revela solo
   durante la llegada; sin destello del visor si el primer frame ya llega encajado (`data-instant`); la frase de entrada
   la revela el haz con el título y el teletipo empieza en «Download CV»; desde 1280 px el recuadro abre su recorte hasta
   el marco (la guía llega; la variante B del hallazgo 1, porque la A rompía el `<dl>`); «Identity verified» al
   imprimir; sin destello en alto contraste; tokens `--glow-arrival-*` (con la estela de la prueba); `isTabFocus` a
   `lib/events`; ganchos `data-arrival-beam`/`-corners`; tests que prueban lo que dicen (el del Tab falla sin el Tab);
   docs y ADR-028/039 al día. Capturas: solo cambió `arrival-40` (la frase de entrada).
4. **Decidido para el Crew file (añadidos de Víctor, CF-1-B y CF-2-A; capturas en
   `_claude/cadena/aud-c7-2/anadidos/` → `hecho/2026-11-25/aud-c7-2/anadidos/`):** la cara sigue a su marco al hacer scroll
   (la escena se desplaza con él, en móvil y en escritorio; sin WebGL, la foto fija igual), y en escritorio el marco deja
   de ir pegado al centro de la pantalla: queda en el centro de la ficha y sube con la página. Va en su propio PR
   (`feat/crew-visor-follow`, con su ADR-042): `05-crew-file.md` → «Pendiente».

**Incidencias y lecciones:**
- **El CI de N1 cayó en la cobertura de ramas** de `shapeTrack.ts` (75 % < 90 % de `src/lib/**`): dos `??` que nunca se
  tomaban. En el contenedor la había pasado, pero filtré mal la salida (el informe omite los archivos al 100 % y el
  `ERROR` no salió en el `grep`). Arreglo en `12a3622`. **Lección:** buscar `ERROR: Coverage` en la salida entera.
- **El CI del PR #129 cayó en la huella de las fotos fijas:** el JSDoc de `lib/scroll/smoothM` (hallazgo 8) entra en
  `STILLS_SOURCES` (lección S37: hasta un comentario). En el contenedor el e2e completo corrió antes de esa edición.
  **Lección:** volver a pasar `budgets.spec.ts` tras el último cambio en algo de la huella.
- **Merge de `main` en N1:** solo chocó `stills.json` (las dos huellas). La del árbol mezclado se calculó en el
  contenedor con `stillsFingerprint` (la misma cuenta da la de `main` que sacó Windows) y se escribió a mano; Víctor
  hizo el `git add` antes de tenerla y el gancho de Prettier paró el commit con las marcas del conflicto (sin daño).
- **El puente con el equipo de Víctor se cortó** a mitad del PR A: se siguió en el contenedor y se volcó al volver
  (un `tar --overwrite`, porque sin permiso de borrar `tar` no reemplaza archivos).
- **En Windows**, `npm run test:coverage` agotó otra vez el `beforeAll` de `scripts/docsOnly.test.ts` (S50): sumado a
  la deuda de los tests lentos.
- `npm run og` tras tocar `tokens.css`: solo cambió `og.json` (las imágenes salen iguales).

**Deuda anotada:** en `docs/06-roadmap/deuda.md`. Nuevo en S50: `docsOnly` vuelve a agotar su tiempo en Windows.

**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`).
2. **Decidir AUD-C7-N1** (`_claude/cadena/aud-c7-n1/auditoria.md`: 0 bloqueantes · 8 recomendados · 15 menores · 1
   pregunta; base `00c8a5b` · hasta `4d1ed06`; después llegaron `12a3622`, el arreglo de la cobertura, y el merge
   `4dfeca8`, que la Mesa no vio). Corregirla entera en su PR antes de fusionar N2. Entre sus hallazgos: en el Crew file
   quieto el shader aún evalúa dos formas; `shape()` pinta el retrato con un id desconocido; el «Detalle» de ADR-039
   apunta a «Forma 5» (ya «Retrato»).
3. **PR B · `feat/crew-visor-follow`** (vivas S50 #8, #9, #13, #14): esquema ya aprobado; la cara sigue al marco
   (desplazamiento de la cámara con la posición del marco, medida por la página), el marco de escritorio en el centro de
   la ficha, la foto fija igual sin WebGL, ADR-042, e2e de que retrato y marco coinciden (±2 px) al hacer scroll y
   capturas nuevas. Resuelve también la deuda del marco del visor algo bajo en móvil.
4. **Decidir EST-C7-N2** (`_claude/cadena/est-c7-n2/preguntas.md`, 14 preguntas; su sello es hasta `00c8a5b` + vivas
   S50 #5: contrastar con la #6, el par de formas sale de `m` en N1 y `mapM` no cambia) y, con las respuestas, **N2 · el
   satélite** en su rama (la segunda coordenada de las formas, `uSolid`, los tramos y el tope de peso).
5. Cuando convenga, el `chore` de los tests que agotan su tiempo en Windows (ahora también `docsOnly`).
6. Víctor: mirar en su móvil, con WebGL, el Crew file (tras el PR B, la cara con su marco) y la línea del haz; la
   imagen para compartir en WhatsApp; `/#crew-file` en Brave en producción y el Sol en su móvil (también apaisado);
   pegar la descripción, la web y los topics de Cosmos en GitHub (`ABOUT_REPOS.md` del Proyecto de claude.ai); suavizar
   el CV y LinkedIn con el chat de mentor (y avisar para volver a copiar el PDF: lo pedirá `content.test.ts`);
   redirigir el portfolio antiguo de Vercel a tortoisecode.dev; mirar las líneas de las constelaciones en su pantalla;
   revisar los textos del Crew file y, si la quiere, una captura del Crew file para el README.

**Dudas abiertas:** D5 · analítica (F7). Tareas de Víctor: script de consola en el README de Chessmate (lo cita el
«Try it»).

**Limpieza manual del usuario:**
- Todo `_claude/tmp/` (copias del repo y archivos de las sesiones 34 a 50, entre ellas `s37/` a `s50/` —en `s44/`,
  `env.txt`, la copia vaciada de `.env`; en `s48/ci/`, el informe de WebKit del CI; en `s50/rep/`, el informe del CI
  descomprimido—, `c3/` y `aud-c2/`) y `_claude/lstree.txt`; `_claude/readme-originales/` si ya no hacen falta.
- Ramas locales ya fusionadas (todas menos `main`, entre ellas `refactor/scene-shape-map`, `fix/aud-c7-2`,
  `feat/crew-arrival-choreography`, `fix/aud-c7-1`, `fix/aud-share`, `feat/crew-arrival`, `fix/favicon-xml`,
  `feat/share-image-favicon`, `fix/aud-f4-cierre`, `fix/aud-f4-5`, `chore/release-0.3.0`, `feat/earth-sun`,
  `fix/aud-f4-4b`, `feat/turtle-plates`, `feat/turtle-pins`, `fix/aud-f4-4a`, `fix/aud-c-cierre` y `chore/deps-2026-11`):
  `git branch` para verlas y `git branch -D <rama>`.
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` y, dentro de `_claude/cadena/hecho/`, los
  `arbol*.tar.gz`, `previas.tar.gz` y los `*.diff` (nunca la carpeta `_claude/cadena/`, ni `hecho/2026-10-28/medir-fps.js`
  ni `hecho/2026-10-28/encuadre/` ni `hecho/2026-11-24/medir-fps.js`, ni `hecho/2026-11-25/aud-c7-2/anadidos/`). Mover a
  mano a `hecho/` lo que no se pudo desde aquí (`aud-f4-1/` a `hecho/2026-11-18/`, `aud-c2/` a `hecho/2026-11-21/` y
  `aud-c7-2/` a `hecho/2026-11-25/`, si siguen fuera). No borrar `_claude/diseno/`, `_claude/retrato/`, `_claude/naves/`, `_claude/crew-entrada/` ni
  `_claude/c3/`.
- En la raíz del repo, los `playwright-report-*.zip` y `test-results/`.
- Perfiles temporales de las pruebas sin WebGL: `$env:TEMP\cosmos-sin-webgl` y `$env:TEMP\cosmos-swiftshader`.
- Si alguna vez falla `npm ci` dentro de Docker: `docker volume rm cosmos-portfolio-visual-node-modules`.

**Bloqueos:** ninguno.
