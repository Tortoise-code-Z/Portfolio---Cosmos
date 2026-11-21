# Interludio 2 · Mission control (cómo trabajo) · canal azul

> Fase C, paso 4 (ADR-034). Va entre el capítulo 3 (Tortuga) y el 4 (Tierra). Diseño aprobado el 2026-11-19
> (`docs/03-diseno/design-system.md` → «Transmisiones»). Hecho en C.4: componente `MissionControl` (sobre
> `Transmission`); la secuencia en `src/content/workflow.ts`; las cifras, contadas al construir (ADR-035); rótulos en
> `docs/01-contenido/textos-sitio.md`.

## Propósito

Responder a la duda de un tech lead con un junior que usa IA: hay un método, y la IA es un acelerador. Va justo
después de los proyectos: primero lo que construí, después cómo lo construyo. Metáfora: la secuencia de
lanzamiento; su «T-0» desemboca en la Tierra («Touchdown», el título de Contacto).

## Contenido

- Canal: «Channel 02 · blue», indicador de señal y «Skip transmission ↓».
- Cabecera: «▸ Mission control · how I work» y un **«T-0» enorme**: decorativo (`aria-hidden`), con el título real,
  «How I work», escondido para el lector de pantalla en el mismo `<h2>` (el destino del foco al llegar).
- La frase: «Every change on this site went through the same countdown. AI speeds it up; I read and understand every
  change before it goes in.»
- **Schematic · launch sequence**, una lista ordenada: T-4 **Plan** (pasos, archivos y riesgos; aún sin código) →
  T-3 **Green light** (el plan se aprueba antes de construir) → T-2 **Build** (una rama y un PR por tarea, TypeScript
  estricto) → T-1 **Audit** (revisión con mirada fresca en otra sesión) → T-0 **Launch** (checks en verde en los
  navegadores del CI, nombrados desde la telemetría). Dibujo: una cota «No code yet» sobre los pasos de antes del
  código (`beforeCode`) y un bucle discontinuo «Fixes from the audit go back to build» de Audit a Build
  (`AUDIT_LOOP`); su texto va en la lista (el del bucle, escondido en el paso de Audit).
- **Telemetry · this site · {mes}**: tests unitarios (Vitest), tests e2e (Playwright), navegadores en el CI y
  decisiones registradas (ADR), y la línea «> Co-pilot: Claude Code with skills I wrote» con cursor. Ver
  «Telemetría».
- Al final, el enlace «T-0 → Touchdown · Contact ↓» (el nombre del enlace es «Touchdown · Contact»: «T-0» y las
  flechas son dibujo; «→» es el icono de flecha, porque no está en el subconjunto de las fuentes).
- Pie: la onda de señal y «t = mythic time · cosmic clock paused».

## Telemetría

Las cifras salen del repo **al construir el sitio**, nunca a mano (ADR-035): `scripts/siteTelemetry.ts` las cuenta y
un plugin de Vite las sirve como el módulo `virtual:site-telemetry`, que lee `src/content/telemetry.ts`; el
pre-renderizado las deja escritas en el HTML.

- **Tests unitarios y e2e:** los tests **escritos**, no las ejecuciones (un `it.each` o un test dentro de un bucle de
  idiomas cuenta uno). Se leen con el compilador de TypeScript: cada llamada a `it` o `test` (también `.only`,
  `.concurrent`, `.fails` e `it.each(…)(…)`); `test.describe`, `test.skip`, `test.use`… no cuentan. Unitarios: lo que
  corre Vitest (`src/**/*.test.{ts,tsx}` y `scripts/**/*.test.ts`); e2e: `tests/e2e/**/*.spec.ts`.
- **Navegadores:** la matriz de los e2e de `.github/workflows/ci.yml`.
- **Decisiones:** los `## ADR-NNN` numerados de `DECISIONS.md` (la plantilla no cuenta).
- **Mes:** el del build, en UTC.

Si no encuentra algo (sin tests, sin matriz, sin ADR), el build falla: una cifra falsa no llega al sitio. Vitest
cuenta igual al arrancar. El e2e (`mission-control.spec.ts`) compara la página con lo que cuenta el repo; las
capturas tapan las cifras y el mes (`data-telemetry`), que cambian con cada test.

## Escena

- La tortuga se queda quieta y atenuada detrás: Projects ya no cambia en su segunda mitad (`morphStart: null`), y el
  cambio a la Tierra pasa a la cola del interludio, al salir (`JOURNEY_SEGMENTS`). En la pantalla, el reloj se para
  (`m` = 3): el HUD se esconde y el pie lo dice. Las placas no reciben el puntero (la pantalla lo recoge); la cola, sí
  lo deja pasar.
- El raíl crece a siete paradas: la reserva de las etiquetas de las estrellas (`STAR_LABEL_KEEP_OUT`, media altura
  del raíl) pasa a 154 px.

## Interacciones

- Entrada como el Mission log: el barrido y, como un teletipo, los cinco pasos uno a uno (T-4 → T-0) y después las
  cifras. Con movimiento reducido, el esquema entero sin más. Que cada paso ocupe la pantalla al hacer scroll se deja
  para el pulido (o C.7).
- «Skip transmission» y «Touchdown» llevan a Contacto (`ChapterJumpLink`), con el foco en su título.

## Layout

- **Escritorio (≥ 900 px):** dos columnas en el cuerpo (`--_body-columns`): a la izquierda el aviso, «T-0» y la frase;
  a la derecha, la telemetría; abajo, el esquema en horizontal (cinco cajas con conectores; la cota encima y el bucle
  debajo, en las columnas de sus pasos) y «Touchdown». En el DOM la telemetría va después del esquema (el orden de
  lectura de móvil); en escritorio se coloca arriba a la derecha.
- **Móvil:** «T-0», la frase, el esquema en vertical (conectores ▼; entre Build y Audit, la nota del bucle en su
  sitio) y la telemetría en 2 × 2.

## Accesibilidad y movimiento reducido

- La secuencia es una lista ordenada real; la telemetría, una lista de definiciones (el nombre antes que la cifra en
  el DOM). Las flechas, la cota, el bucle, el «T-0» y el cursor son decoración con su texto en la lista.
- Sin barrido, teletipo ni cursor que parpadee con movimiento reducido. Contraste del canal azul medido (AA) sobre su
  velo encima de una escena blanca: el atenuado pasa a `#5a8fc6` (el aprobado, `#4f86bd`, daba 4,3 : 1).
- Cambiar de idioma leyéndolo deja en él (`/es#mission-control`), no en Projects.

## Raíl y misión rápida

- Rombo propio en el raíl entre Projects y Contact («Mission control · transmission»; «Control de misión ·
  transmisión»), ancla `#mission-control`.
- En la misión rápida, la sección «How I work» va tras «Experience»: la frase y los cinco pasos.

## Aceptación

- Se entiende el método sin la animación, con lector de pantalla y sin WebGL.
- Las cifras coinciden con el repo del despliegue (lo comprueba el e2e).
