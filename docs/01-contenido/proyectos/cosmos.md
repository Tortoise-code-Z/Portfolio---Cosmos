# Proyecto · Cosmos (este portfolio)

> Lo marcado con ⏳ se completa con datos reales a medida que se construye (proceso, retos resueltos, capturas). No
> se publica nada que no esté hecho: la escena 3D entró en el resumen, las funcionalidades y el stack en F3.7; las
> constelaciones y placas entran con F4. Lo que espera se guarda aquí, marcado con ⏳.

## Ficha

| Campo | Valor |
|---|---|
| slug | `cosmos` |
| order | 3 |
| featured | `false` |
| name | Cosmos |
| year | 2026 |
| role | `frontend` |
| context | `personal` |
| links.code | https://github.com/Tortoise-code-Z/Portfolio---Cosmos |
| links.demo | https://tortoisecode.dev |
| links.readme | https://github.com/Tortoise-code-Z/Portfolio---Cosmos#readme ⏳ (README en F6) |

## Tagline

- EN: This portfolio: a scroll journey from the Big Bang to Earth.
- ES: Este portfolio: un viaje por scroll del Big Bang a la Tierra.

## Summary

Con la escena (desde F3.7):

- EN: The site you are on. Tens of thousands of particles morph from a singularity into a nebula, a galaxy, a
  cosmic turtle and Earth as you scroll. Built with React, TypeScript and WebGL, and still readable without any
  of it.
- ES: La web en la que estás. Decenas de miles de partículas pasan de una singularidad a una nebulosa, una
  galaxia, una tortuga cósmica y la Tierra mientras haces scroll. Hecha con React, TypeScript y WebGL, y
  legible sin nada de eso.

## About

**EN**
1. Cosmos is my personal portfolio, designed as a story: scrolling moves time forward from the Big Bang to the
   present day, and each stage of the universe is a section of the site.
2. The goal was a site that is visually striking and still easy to follow: all the content lives in the HTML, and
   a quick-mission mode shows everything on one page.

**ES**
1. Cosmos es mi portfolio personal, pensado como una historia: el scroll hace avanzar el tiempo desde el Big Bang
   hasta hoy, y cada etapa del universo es una sección de la web.
2. El objetivo era una web visualmente brutal y a la vez fácil de seguir: todo el contenido vive en el HTML, y un
   modo misión rápida lo muestra todo en una página.

## Features

En el contenido, en este orden; las marcadas con ⏳ entran cuando estén hechas (en su sitio de la tabla).

| EN | ES | Desde |
|---|---|---|
| Scroll-driven particle morphing across five scenes | Morph de partículas guiado por el scroll en cinco escenas | F3 |
| ⏳ Interactive constellations and project plates | Constelaciones y placas de proyecto interactivas | F4 (pasos 3 y 4) |
| Bilingual site (English / Spanish) | Web bilingüe (inglés / español) | F2 |
| Quick-mission mode with all the content on one page | Modo misión rápida con todo el contenido en una página | F2 |
| Works without WebGL and with reduced motion | Funciona sin WebGL y con movimiento reducido | F3 |
| A page per project, pre-rendered for search engines | Una página por proyecto, pre-renderizada para buscadores | F2 |

Con la escena (F3.7), «Works without WebGL and with reduced motion» sustituye a la de F2, «Readable without
JavaScript and with reduced motion» (ES: «Legible sin JavaScript y con movimiento reducido»).

## Stack

Selección de `docs/05-tecnico/stack.md`, sin versiones: lo que reconoce quien revisa un CV de frontend (no salen
piezas internas como Testing Library, Husky, vite-imagetools, Docker o Lighthouse CI).

- core: React, TypeScript, Three.js, React Three Fiber, GLSL (los tres últimos, con la escena: F3.7)
- libraries: React Router, Zustand
- design: CSS Modules, responsive design (EN: Responsive design · ES: Diseño responsive)
- tooling: Vite, Vitest, Playwright, ESLint, Prettier, GitHub Actions, Vercel, Git, npm

## Process ⏳

Vacío en el contenido (`{ en: [], es: [] }`) hasta F6: la sección no se pinta. Borrador de los temas a contar
cuando estén hechos (2–3 párrafos, EN y ES):
- Prototipo en HTML para validar la idea → documentación por capítulos → construcción por fases.
- Un único sistema de partículas que pasa de una forma a otra en el shader de vértices.
- Separación entre contenido, lógica del scroll, escena 3D e interfaz DOM.

## Highlights ⏳

Vacío en el contenido (`[]`) hasta F6. Candidatos (se confirman con medidas reales):
- Morph de decenas de miles de partículas a 60 fps en un portátil medio.
- Contenido accesible e indexable con la escena como capa decorativa.
- Presupuesto de rendimiento adaptado a cada dispositivo.

## Notes

Hoy (sin README):

- `info` · EN: The source code is public on GitHub. · ES: El código es público en GitHub.

⏳ Final (con el README del repo, F6):

- `info` · EN: The source code is public; the README explains the architecture. · ES: El código es público; el
  README explica la arquitectura.

## Try it

`null`: la web ya es la demo.

## Imágenes ⏳

`cover: null` y `gallery: []` en el contenido hasta tenerlas.

Capturas de cada capítulo (EN) en escritorio y móvil, generadas al final de la fase de pulido.
Sin entrada en `media.ts` hasta F6; su `og:image` será la del sitio (`pagina-proyecto.md` → SEO).
