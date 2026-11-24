# Proyecto · Cosmos (este portfolio)

> No se publica nada que no esté hecho: la escena 3D entró en el resumen, las funcionalidades y el stack en F3.7;
> el proceso, los retos, las constelaciones, los interludios y la nota del README, en C.5 (textos de Claude que
> Víctor corrige en el PR). Lo que espera se marca con ⏳: las imágenes (F6).

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
| links.readme | https://github.com/Tortoise-code-Z/Portfolio---Cosmos#readme (README desde C.5) |

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

## Meta description

El `summary` pasa de 220 caracteres y los buscadores cortan hacia 155–160: la ficha lleva su `metaDescription`
(≤ 160, test de contenido; C.5).

- EN: Cosmos, the portfolio you are on: a scroll journey from the Big Bang to Earth in WebGL particles, built with
  React and TypeScript and readable without WebGL. (157)
- ES: Cosmos, el portfolio en el que estás: un viaje por scroll del Big Bang a la Tierra en partículas WebGL, hecho
  con React y TypeScript y legible sin WebGL. (153)

## About

**EN**
1. Cosmos is my personal portfolio, designed as a story: scrolling moves time forward from the Big Bang to the
   present day, and each stage of the universe is a section of the site.
2. The goal was a site that is visually striking and still easy to follow: all the content lives in the HTML, and
   a quick-mission mode shows everything on one page.
3. I built it with an AI-assisted workflow (Claude), which I used to learn Three.js and shaders as I went.

**ES**
1. Cosmos es mi portfolio personal, pensado como una historia: el scroll hace avanzar el tiempo desde el Big Bang
   hasta hoy, y cada etapa del universo es una sección de la web.
2. El objetivo era una web visualmente brutal y a la vez fácil de seguir: todo el contenido vive en el HTML, y un
   modo misión rápida lo muestra todo en una página.
3. La he hecho con un flujo de trabajo asistido por IA (Claude), con el que he aprendido Three.js y shaders sobre
   la marcha.

El párrafo 3 es la frase del CV (C.1, ADR-034): el flujo con IA se dice con naturalidad, como en el CV.

## Features

En el contenido, en este orden.

| EN | ES | Desde |
|---|---|---|
| Scroll-driven particle morphing across six scenes | Morph de partículas guiado por el scroll en seis escenas | F3 (seis desde C.6b, con el retrato) |
| Skill constellations that light up with the mouse, keyboard or touch | Constelaciones de habilidades que se encienden con el ratón, el teclado o el dedo | C.5 (hechas en F4.3 y C.3) |
| Two interludes as incoming transmissions: a mission log and how I work | Dos interludios como transmisiones entrantes: un registro de misión y cómo trabajo | C.5 (hechos en C.2 y C.4) |
| An epilogue, the Crew file: the same particles rebuild my portrait | Un epílogo, la ficha de tripulación: las mismas partículas reconstruyen mi retrato | Cierre de C (hecho en C.6a y C.6b) |
| Bilingual site (English / Spanish) | Web bilingüe (inglés / español) | F2 |
| Quick-mission mode with all the content on one page | Modo misión rápida con todo el contenido en una página | F2 |
| Works without WebGL and with reduced motion | Funciona sin WebGL y con movimiento reducido | F3 |
| A page per project, pre-rendered for search engines | Una página por proyecto, pre-renderizada para buscadores | F2 |

Con la escena (F3.7), «Works without WebGL and with reduced motion» sustituye a la de F2, «Readable without
JavaScript and with reduced motion» (ES: «Legible sin JavaScript y con movimiento reducido»). Las placas de
proyecto se encienden desde las filas y por turnos (F4.4a) y tienen sus pins (F4.4b); no salen todavía como
funcionalidad: lo harán con su interacción completa (su luz al volver de una ficha, F5).

## Stack

Selección de `docs/05-tecnico/stack.md`, sin versiones: lo que reconoce quien revisa un CV de frontend (no salen
piezas internas como Testing Library, Husky, vite-imagetools, Docker o Lighthouse CI).

- core: React, TypeScript, Three.js, React Three Fiber, GLSL (los tres últimos, con la escena: F3.7)
- libraries: React Router, Zustand
- design: CSS Modules, responsive design (EN: Responsive design · ES: Diseño responsive)
- tooling: Vite, Vitest, Playwright, ESLint, Prettier, GitHub Actions, Vercel, Git, npm

## Process

Desde C.5 (antes, vacío: la sección no se pintaba). Tres párrafos: el método, la arquitectura y el flujo con IA y
calidad. Sin cifras que se queden viejas (el número de ADR o de tests lo da Mission control).

**EN**
1. I started with an HTML prototype to test the idea and then documented the whole site before writing code:
   content, experience, design and the 3D scene, chapter by chapter. It was built in phases, each one closed with
   its tests and an audit, and every decision that shaped the architecture went into a decision log.
2. The content is typed data that lives in the HTML, pre-rendered for every page. Scrolling drives a single value
   that both the interface and the scene read. One particle system morphs between shapes in the vertex shader;
   the shapes are generated in a Web Worker with a fixed seed, so the universe is the same on every visit. The
   scene loads after the first paint, in its own chunk, and the site is complete without it.
3. I work with Claude Code: every step starts with a plan I approve, and I read and understand every change
   before it goes in. A second AI session audits each task with fresh eyes, and its fixes ship before the next
   task. CI runs the unit tests, end-to-end tests in Chromium, Firefox and WebKit, and visual regression on every
   pull request.

**ES**
1. Empecé con un prototipo en HTML para probar la idea y después documenté la web entera antes de escribir código:
   contenido, experiencia, diseño y la escena 3D, capítulo a capítulo. Se construyó por fases, cada una cerrada con
   sus tests y una auditoría, y cada decisión que daba forma a la arquitectura quedó en un registro de decisiones.
2. El contenido son datos tipados que viven en el HTML, pre-renderizado en cada página. El scroll mueve un único
   valor que leen la interfaz y la escena. Un solo sistema de partículas pasa de una forma a otra en el shader de
   vértices; las formas se generan en un Web Worker con una semilla fija, así que el universo es el mismo en cada
   visita. La escena se carga después de la primera pintura, en su propio chunk, y la web está completa sin ella.
3. Trabajo con Claude Code: cada paso empieza con un plan que apruebo, y leo y entiendo cada cambio antes de que
   entre. Una segunda sesión de IA audita cada tarea con ojos nuevos, y sus arreglos entran antes de la siguiente
   tarea. El CI pasa los tests unitarios, los e2e en Chromium, Firefox y WebKit y la regresión visual en cada pull
   request.

El párrafo 3 dice el método como Mission control (`missionControl.step.audit`): se audita cada tarea, no cada
paso.

## Highlights

Desde C.5, con medidas reales: 60 fps en Alto (`rendimiento.md` → «Presupuesto», una sola medida, en F3.6c, en un
equipo de escritorio: de ahí «in my measurements» y «up to», porque con 4 núcleos o menos se arranca en Medio),
el tope de 260 KB gzip del JavaScript de la escena, que comprueba un e2e en cada pull request (ADR-032,
`budgets.spec.ts`; el worker y el reintento tienen su propio tope), la lectura sin WebGL ni JS (`scene.spec.ts`,
`journey.spec.ts`) y la telemetría del build (ADR-035).

| EN | ES |
|---|---|
| Up to 60,000 particles, holding 60 fps on desktop in my measurements, with three quality levels that step down on the fly | Hasta 60.000 partículas, a 60 fps en escritorio en mis mediciones, con tres niveles de calidad que bajan sobre la marcha |
| The 3D scene's JavaScript, Three.js included, within a 260 KB gzip budget checked on every pull request | El JavaScript de la escena 3D, Three.js incluido, dentro de 260 KB gzip, que se comprueban en cada pull request |
| Readable without WebGL or JavaScript, with still photos of the scene when WebGL is missing | Legible sin WebGL ni JavaScript, con fotos fijas de la escena cuando falta WebGL |
| Mission control counts the repo's own tests and decisions when the site is built | Mission control cuenta los tests y las decisiones del propio repo al construir la web |

Si cambia el tope de la escena (ADR-032) o las partículas de Alto (`LEVEL_SETTINGS`), se cambia aquí y en el
contenido.

## Notes

Desde C.5, con el README del repo:

- `info` · EN: The source code is public; the README explains the architecture. · ES: El código es público; el
  README explica la arquitectura.

## Try it

`null`: la web ya es la demo.

## Imágenes ⏳

`cover: null` y `gallery: []` en el contenido hasta tenerlas.

Capturas de cada capítulo (EN) en escritorio y móvil, generadas al final de la fase de pulido.
Sin entrada en `media.ts` hasta F6; su `og:image` es la del sitio (`assets.md` → «Imagen para compartir»).
