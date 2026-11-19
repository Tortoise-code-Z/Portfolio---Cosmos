# Capítulo 5 · Crew file (epílogo) · canal verde

> Fase C, paso 6 (ADR-034). Bajo la Tierra, el último. Diseño aprobado el 2026-11-19
> (`docs/03-diseno/design-system.md` → «Transmisiones»). Textos provisionales hasta su PR.

## Propósito

Cerrar el viaje con quien lo ha construido y dejar a mano lo que un recruiter necesita: la ficha y el CV.
Metáfora: las partículas que formaron el universo se recomponen en la cara de Víctor; «all channels closed».

## Contenido

- Canal: «channel 03 · green · crew file» e «Identity verified».
- Título «CREW FILE».
- **El retrato en partículas** (sexta forma, ADR-034), con esquinas de visor y líneas guía hacia los datos.
- Ficha: Role (Frontend Developer · React + TypeScript) · Base (Killarney, Co. Kerry, Ireland) · Right to work (EU
  citizen · full right to work in Ireland) · Availability (immediate · remote, hybrid or on-site · relocation) ·
  Languages · Training (Advanced Course in Web Programming (Full-Stack), Master.D, 975 h, Distinction; React +
  TypeScript, Hola Mundo, 13 h). La formación se muda aquí desde Contacto.
- **Download CV** (el PDF de `public/`, el inglés en los dos idiomas) y el email con «Copy».
- Pie: «End of journey · 13.8 billion years + now».

## Escena (`m = 5`)

- El retrato: una foto de Víctor convertida en profundidad, cargada como dato aparte (una imagen de color, otra de
  profundidad y contornos; ~150 KB) al acercarse a la Tierra; solo el código que la carga cuenta en el chunk de la
  escena (ADR-032).
- Aspecto elegido: holograma de líneas de escáner (una fila de cada tres), luz en pocos niveles, rasgos y borde de
  la silueta encendidos, haz de barrido y fallos de señal ocasionales; en el verde del canal.
- Giro limitado (~±25°) con el puntero: de una sola foto sale un relieve, no una cabeza completa.

## Interacciones

- El retrato sigue al puntero (inclinación en móvil, si se permite); la gravedad del cursor aparta partículas.
- Download CV y Copy, como en Contacto.

## Layout

- **Escritorio:** título arriba a la izquierda; retrato en el centro; datos a los lados con líneas guía; abajo, el
  email y el botón del CV.
- **Móvil:** título, retrato, **Download CV justo debajo** (lo primero que se busca), la ficha y el email.

## Accesibilidad y movimiento reducido

- El lienzo es `aria-hidden`; el retrato tiene su alternativa en texto. Sin WebGL: una foto fija del retrato
  (ADR-029). Con movimiento reducido: quieto, sin barrido ni fallos de señal.
- La ficha es una lista de definiciones real; las líneas guía son decoración.

## Pendiente

- Mostrar o no el nivel de inglés (B1) o solo los idiomas.
- La foto original y los datos del retrato no entran al repo hasta este paso (son de Víctor).

## Aceptación

- Download CV funciona en EN y ES; los datos coinciden con el CV.
- Sin WebGL, con movimiento reducido y con lector de pantalla se lee entero.
