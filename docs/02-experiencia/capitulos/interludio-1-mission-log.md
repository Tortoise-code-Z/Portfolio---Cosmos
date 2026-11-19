# Interludio 1 · Mission log (experiencia) · canal ámbar

> Fase C, paso 2 (ADR-034). Va entre el capítulo 1 (Nebulosa) y el 2 (Galaxia). Diseño aprobado el 2026-11-19:
> «transmisiones» a pantalla completa, cada una en su canal de color (`docs/03-diseno/design-system.md` →
> «Transmisiones»). Los textos son provisionales hasta su PR.

## Propósito

Enseñar la experiencia real (las prácticas) donde un recruiter la busca: pronto en el viaje y con hechos concretos.
Metáfora: en mitad del viaje llega una transmisión, el registro de la primera misión.

## Contenido

- Canal: «channel 01 · amber», indicador de señal y «Skip transmission ↓».
- Cabecera: «▸ Incoming transmission · source located» y el título «MISSION 01».
- Ficha de misión: Source **Studios Demanzon** · Role **Software Developer Intern** · Position **Remote · Tenerife,
  Spain** · Window **Jul 2026 – Oct 2026** · Status **Mission complete**. Los mismos datos que el CV.
- **Payload manifest:** seis módulos (las herramientas y para qué se usaron), cada uno con los números de las
  entradas del registro que le tocan: Next.js · React · TS (interfaces de las dos apps) · Electron (app de
  escritorio) · Estado y renderizado (bugs encontrados y arreglados) · NestJS (servicios) · Docker (imágenes y
  volúmenes) · n8n (flujos de traducción).
- **Flight log:** las seis viñetas aprobadas del CV, numeradas y con su etiqueta (BUILT, ADDED, FIXED, AUTO,
  BACKEND), y al final «END OF TRANSMISSION» con cursor.
- Pie: la onda de señal y «t ≈ 200 million years · cosmic clock paused».
- **No se muestra cómo está construido el producto del cliente** (arquitectura, conexiones entre sus partes): es
  información privada de la empresa. Solo lo que ya dice el CV.
- Si el CTO da permiso expreso, una frase corta de su carta; si no, «Reference available on request».

## Escena

- La forma del capítulo anterior (la nebulosa) se queda quieta y atenuada detrás; la pantalla del canal la cubre
  casi entera. El cambio a la galaxia ocurre al salir del interludio.
- El reloj del HUD se para mientras dura. Estrellas y placas no reciben el puntero.

## Interacciones

- «Skip transmission» lleva al capítulo siguiente (ancla), con foco en su título.
- Entrada: un golpe corto de «señal» (barrido); el registro se escribe línea a línea como un teletipo. Solo
  decoración: el texto está entero en el DOM desde el principio.

## Layout

- **Escritorio:** pantalla completa; arriba el título y la ficha; abajo, el manifiesto a la izquierda (3 × 2) y el
  registro a la derecha.
- **Móvil:** todo en una columna: título, ficha, manifiesto (2 × 3), registro. «Skip» arriba, a 44 px.

## Accesibilidad y movimiento reducido

- Sección con `aria-labelledby`; el manifiesto y el registro son listas reales; los números enlazan visualmente
  pieza ↔ entrada y también van en el texto.
- El barrido, el brillo y el cursor son decoración (`aria-hidden` donde toque). Con movimiento reducido: sin barrido,
  sin teletipo (texto completo) y sin cursor parpadeante.
- Contraste del canal medido sobre su fondo (AA) antes de dar el paso por hecho.

## Pendiente (antes o durante su PR)

- Redacción final EN y traducción fiel ES; las viñetas acortadas del registro, revisadas contra el CV.
- Permiso del CTO para la frase de su carta.
- Plan B: si el interludio no está el 24 nov, la experiencia entra provisional en About y en la misión rápida.

## Aceptación

- Se lee entero sin WebGL, con lector de pantalla y con movimiento reducido.
- Los datos coinciden con el CV (puesto «Intern», fechas, empresa, lugar).
- «Skip» funciona con teclado y deja el foco en el capítulo siguiente.
