# Experiencia · visión general

> Cómo se vive el sitio: estructura, scroll, navegación, estados y criterios de aceptación.
> Lo visual (tokens, componentes) está en `docs/03-diseno/`; el motor 3D, en `docs/04-escena/`.
> Referencia de comportamiento: `docs/referencia/prototipo-v0.1.html`.

## Archivos

| Archivo | Qué define |
|---|---|
| `scroll-y-escena.md` | Cómo el scroll mueve el tiempo: capítulos, valor de morph `m`, suavizado, alturas |
| `navegacion.md` | Rutas, URLs, idiomas, barra superior, raíl, HUD, modo misión rápida, foco y teclado |
| `capitulos/00-singularidad.md` … `04-tierra.md` | Un archivo por capítulo: contenido, escena, interacción, móvil y aceptación |
| `pagina-proyecto.md` | La página propia de cada proyecto y la transición desde la tortuga |
| `estados-y-accesibilidad.md` | Carga, sin WebGL, movimiento reducido, táctil, niveles de rendimiento, 404 |

## Mapa del sitio

```
/                     Viaje completo (EN) · capítulos con anclas #about #skills #projects #contact
/projects/:slug       Página de proyecto (EN)
/es                   Viaje completo (ES)
/es/projects/:slug    Página de proyecto (ES)
*                     404 «Lost in space»
```

El segmento `projects` es igual en los dos idiomas (`/es/projects/:slug`), decidido en
`docs/05-tecnico/arquitectura.md` → «Rutas e idiomas».

## Las tres capas de la pantalla

```
┌─────────────────────────────────────────────┐
│ 3 · Interfaz fija: barra superior, raíl, HUD │  ← siempre encima, siempre usable
│ 2 · Contenido DOM: capítulos y paneles       │  ← la información (accesible, indexable)
│ 1 · Escena WebGL (decorativa, aria-hidden)   │  ← el espectáculo
└─────────────────────────────────────────────┘
```

Regla de oro (principio P1 del brief): **si se elimina la capa 1, el sitio sigue completo.**

## Recorrido tipo de cada público

- **Recruiter con prisa:** llega al hero → pulsa «Projects» en la barra o «Quick mission» → lee proyectos y
  contacto. Objetivo: ≤ 10 s y ≤ 2 interacciones.
- **Tech lead:** hace el viaje entero → abre una página de proyecto → va al repo desde el pie.
- **Curioso:** mantiene pulsado para detonar, juega con el cursor, comparte el enlace.

## Criterios globales de aceptación

1. Todo el contenido es legible y navegable con la escena desactivada.
2. Cada capítulo es alcanzable desde el raíl, con teclado y con un enlace directo (`/#projects`).
3. Ningún efecto bloquea la lectura: los paneles nunca quedan ocultos tras una animación.
4. El sitio respeta `prefers-reduced-motion` y funciona con ratón, teclado y pantalla táctil.
5. Cambiar de idioma conserva el capítulo o el proyecto en el que estás.
