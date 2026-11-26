# Interludio 1 · Mission log (experiencia) · canal ámbar

> Fase C, paso 2 (ADR-034). Va entre el capítulo 1 (Nebulosa) y el 2 (Galaxia). Diseño aprobado el 2026-11-19:
> «transmisiones» a pantalla completa, cada una en su canal de color (`docs/03-diseno/design-system.md` →
> «Transmisiones»). Hecho en C.2: componentes `Transmission` y `MissionLog`; datos en
> `docs/01-contenido/experiencia.md`; rótulos en `textos-sitio.md`.

## Propósito

Enseñar la experiencia real (las prácticas) donde un recruiter la busca: pronto en el viaje y con hechos concretos.
Metáfora: en mitad del viaje llega una transmisión, el registro de la primera misión.

## Contenido

- Canal: «channel 01 · amber», indicador de señal y «Skip transmission ↓».
- Cabecera: «▸ Incoming transmission · source located» y el título «MISSION 01».
- Ficha de misión (una lista de definiciones): Source **Studios Demanzon** · Role **Software Developer Intern** ·
  Position **Remote · Tenerife, Spain** · Window **Jul 2026 – Oct 2026** · Status **Mission complete**. Los mismos
  datos que el CV. Debajo, una línea con lo que hizo («Three months of remote work across the front end, a desktop
  app and backend services»), no con qué es el producto.
- **Payload manifest:** seis módulos (las herramientas y para qué se usaron), cada uno con los números de las
  entradas del registro que le tocan, en el texto («Log entries 01, 02, and 04»). Los módulos no llevan número
  propio: con el mismo formato que las entradas, parecía señalar una de ellas.
- **Flight log:** las seis viñetas del CV **suavizadas** (sin decir qué es el producto: decisión de Víctor, también
  para el CV y LinkedIn), numeradas en un círculo y con su etiqueta (BUILT, ADDED, FIXED, AUTO, BACKEND), y al final
  «End of transmission» con cursor: parpadea unas pocas veces (menos de 5 s, WCAG 2.2.2) cuando su línea ya está
  escrita y se queda quieto.
- **Reference:** con permiso expreso del CTO, una frase de su carta, en el idioma en que se lee (la traducción
  firmada en EN, la carta original en ES).
- Pie: la onda de señal y «t ≈ 200 million years · cosmic clock paused».
- **No se muestra qué es ni cómo está construido el producto del cliente** (tipo de producto, arquitectura,
  conexiones entre sus partes): es información privada de la empresa. La guarda es la revisión del texto
  (`docs/01-contenido/experiencia.md` → «Regla de privacidad»); el test del componente comprueba que solo pinta lo
  que dice `experience`.

## Escena

- **El satélite (C.7 · naves):** antes de la pantalla, un hueco vacío de 120 svh (`--transmission-arrival-h`) en el
  que la nebulosa se convierte en un satélite que se acerca y llena la vista; después, otro de 60 vh
  (`--transmission-exit-h`) en el que se aleja, y en la cola se deshace en la galaxia. Mientras tanto `m` se queda en
  la nebulosa (scroll-y-escena.md → «Posición en los tramos»; `transiciones-naves.md`). Con movimiento reducido y al
  imprimir no hay satélite (los huecos miden 0); sin WebGL los huecos están, sobre la foto de la nebulosa. Hasta la
  coreografía de la página (N4), la transmisión sube como hoy tras el hueco de la llegada.
- La forma del capítulo anterior (la nebulosa, o el satélite) se queda quieta y atenuada detrás; la pantalla del
  canal la cubre casi entera.
- En la pantalla, el reloj se para (`m` se queda en 1): el HUD se esconde y el pie de la transmisión lo dice. Estrellas
  y placas no reciben el puntero (la pantalla, hija directa de `<main>`, lo recoge). En la cola, que también es parte
  del interludio, vacía y sin puntero, la nebulosa cambia a galaxia y el reloj vuelve a andar; desde su mitad, el raíl
  marca Skills y el HUD vuelve.

## Interacciones

- «Skip transmission» lleva al capítulo siguiente (ancla), con foco en su título.
- Entrada: un golpe corto de «señal» (barrido); el registro se escribe línea a línea como un teletipo. Solo
  decoración: el texto está entero en el DOM desde el principio.

## Layout

- **Escritorio ancho (≥ 1280 px, lg, como el Crew file):** pantalla completa; arriba el título y la ficha; abajo, el
  manifiesto a la izquierda (3 × 2) y el registro a la derecha.
- **Móvil y tableta (hasta 1279 px):** todo en una columna: título, ficha, manifiesto (2 × 3), registro. «Skip»
  arriba, a 44 px. Entre 900 y 1279 px, el manifiesto en 3 columnas dentro de 5/12 del cuerpo dejaba ~9 letras por
  caja y partía «TypeScript».

## Accesibilidad y movimiento reducido

- Sección con `aria-labelledby`; el manifiesto y el registro son listas reales; los números enlazan visualmente
  pieza ↔ entrada y también van en el texto.
- El barrido, el brillo y el cursor son decoración (`aria-hidden` donde toque). Con movimiento reducido: sin barrido,
  sin teletipo (texto completo) y sin cursor parpadeante.
- Contraste del canal medido (AA) sobre lo que se pinta de verdad: su velo encima de una escena blanca
  (`styles.test.ts`).
- Cambiar de idioma leyéndolo deja en él (`/es#mission-log`), no en About.

## Raíl y misión rápida

- Rombo propio en el raíl entre About y Skills («Mission log · transmission»), activo desde que empieza la llegada del
  satélite, mientras se lee la pantalla, en la salida y en la primera mitad de la cola; ancla `#mission-log`, en la
  sección: aterriza al final de la llegada.
- En la misión rápida, la sección «Experience» va tras Projects (los proyectos siguen en la primera pantalla a
  390 px): puesto, empresa, lugar, fechas y las seis entradas.
- En Contacto (y en la misión rápida), la disponibilidad suma «Available immediately» y el permiso de trabajo.

## Aceptación

- Se lee entero sin WebGL, con lector de pantalla y con movimiento reducido.
- Los datos coinciden con el CV (puesto «Intern», fechas, empresa, lugar).
- «Skip» funciona con teclado y deja el foco en el capítulo siguiente.
