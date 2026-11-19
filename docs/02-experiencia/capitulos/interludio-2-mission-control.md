# Interludio 2 · Mission control (cómo trabajo) · canal azul

> Fase C, paso 4 (ADR-034). Va entre el capítulo 3 (Tortuga) y el 4 (Tierra). Diseño aprobado el 2026-11-19
> (`docs/03-diseno/design-system.md` → «Transmisiones»). Textos provisionales hasta su PR.

## Propósito

Responder a la duda de un tech lead con un junior que usa IA: hay un método, y la IA es un acelerador. Va justo
después de los proyectos: primero lo que construí, después cómo lo construyo. Metáfora: la secuencia de
lanzamiento; su «T-0» desemboca en la Tierra («Touchdown»).

## Contenido

- Canal: «channel 02 · blue» y «Skip transmission ↓».
- Un «T-0» enorme (decorativo; el título real, «How I work», para el lector de pantalla) y una frase: cada cambio
  del sitio pasó por la misma cuenta atrás; la IA acelera y cada cambio se lee y se entiende antes de entrar.
- **Telemetría** del propio repo: tests unitarios (Vitest), e2e (Playwright), navegadores en el CI y decisiones
  registradas (ADR). Las cifras salen del repo al construir el sitio (o se redondean): nunca a mano.
- **Secuencia de lanzamiento** como esquema: T-4 Plan (pasos, archivos, riesgos; sin código) → T-3 Green light (el
  plan se aprueba antes de construir) → T-2 Build (pasos pequeños, una rama y un PR por tarea, TypeScript estricto)
  → T-1 Audit (revisión con mirada fresca en otra sesión) → T-0 Launch (CI en verde en Chromium, Firefox y WebKit).
  Un bucle discontinuo «fixes from the audit» vuelve de Audit a Build; una cota «no code yet» sobre Plan y Green
  light.
- «Co-pilot: Claude Code with skills I wrote» y el enlace «T-0 → Touchdown · Contact ↓».

## Escena

- La tortuga se queda quieta y atenuada detrás; el cambio a la Tierra, al salir. Reloj parado; placas sin puntero.

## Interacciones

- Al hacer scroll, cada paso de la cuenta atrás puede ocupar la pantalla (T-4 → T-0) antes de mostrar el esquema
  entero; con movimiento reducido, el esquema entero sin más.
- «Skip transmission» y «Touchdown» llevan a Contacto.

## Layout

- **Escritorio:** arriba, «T-0» a la izquierda y la telemetría a la derecha; abajo, el esquema horizontal.
- **Móvil:** «T-0», la frase, el esquema en vertical (flechas ▼) y la telemetría en 2 × 2.

## Accesibilidad y movimiento reducido

- La secuencia es una lista ordenada real; las flechas y el bucle son decoración con su texto en la lista.
- Sin barrido ni cursor con movimiento reducido. Contraste del canal azul medido (AA).

## Pendiente

- Redacción final EN/ES (cada frase, algo que Víctor pueda contar en una entrevista).
- Cómo se sacan las cifras del repo en el build (o el redondeo).

## Aceptación

- Se entiende el método sin la animación, con lector de pantalla y sin WebGL.
- Las cifras coinciden con el repo del despliegue.
