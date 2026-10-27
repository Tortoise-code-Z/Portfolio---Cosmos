# Calidad: tipado, lint, tests y presupuestos

## TypeScript

- `strict: true` + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
  `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `isolatedModules`.
- Tipos de retorno explícitos en funciones exportadas. Sin `any`; `unknown` + estrechamiento en los bordes.
- Tipos generados de rutas con `react-router typegen` (forma parte de `npm run typecheck`).
- Declaraciones para `*.glsl?raw` y para las importaciones de imagen con los presets de `vite-imagetools`
  (`*?project`, `*?share` en `src/env.d.ts`). En Vitest, un sustituto (`vitest.config.ts`) devuelve la misma forma
  con las medidas reales del PNG, sin generar variantes.

## ESLint (config plana) + Prettier

- `@eslint/js` recomendado + `typescript-eslint` `strictTypeChecked` y `stylisticTypeChecked`.
- `react-hooks` (recomendado), `jsx-a11y-x` (strict; fork mantenido de `jsx-a11y`, ADR-014).
- `no-restricted-imports` por carpeta (reglas de capas de `arquitectura.md`) y `no-restricted-syntax` para los
  `import()`: la escena y Three.js solo en diferido desde `features/scene-mount/SceneMount`, y ningún `import()`
  con una ruta que no sea una cadena fija (`arquitectura.md` → «Carga de la escena»).
- `no-console` permitido solo `error` y `warn`.
- `eslint-config-prettier` al final. Prettier: `printWidth 100`, comillas simples, `trailingComma all`,
  `endOfLine lf`.

## Scripts de `package.json`

| Script | Qué hace |
|---|---|
| `dev` | Servidor de desarrollo |
| `build` | Build + pre-renderizado + sitemap |
| `preview` | Sirve el build localmente |
| `typecheck` | `react-router typegen && tsc --noEmit` |
| `lint` / `lint:fix` | ESLint |
| `format` / `format:check` | Prettier |
| `test` / `test:watch` / `test:coverage` | Vitest |
| `e2e` | Playwright (recorridos) en los tres navegadores |
| `e2e:chromium` | Los mismos recorridos solo en Chromium: el que se lanza en local al tocar interfaz (ADR-024) |
| `visual` / `visual:update` | Capturas de regresión dentro del contenedor Docker de Playwright |
| `lhci` | Lighthouse CI sobre `preview` |
| `check` | `typecheck` + `lint` + `format:check` + `test` (lo mínimo antes de cada commit) |

## Pirámide de tests

| Nivel | Qué | Ejemplos |
|---|---|---|
| Unitarios (Vitest) | Toda la lógica pura | `mapM`, suavizado (`lib/math/damp`), pausa de la escena (`scene/pause`: pestaña oculta y misión rápida), cámara (`scene/math/camera`: pose por `m` en los keyframes, encuadre de escritorio, campo de visión de móvil con tope, paralaje y la media query igual a la de los paneles), el ratón de la escena (`scene/pointer`, solo `mouse`), `watchMediaQuery`, proyección, generadores de formas y estrellas, geometría y uniforms de las partículas, cabecera GLSL (etiquetas y colores desde TS, ningún nombre sin definir, ninguno en los fragment shaders, ni etiquetas ni colores escritos a mano), shaders sin comentarios (con sus líneas en su sitio), paleta de la escena contra la tabla del design system (cada color en su papel), color de fondo del lienzo (`scene/voidColour`), bucle de frames (también su pausa) y reloj de la escena, elección de nivel, formato del HUD, `i18n`, builders de SEO, asignación de placas; invariantes de estilos (`src/styles/styles.test.ts`: tokens definidos, sin colores, duraciones ni familias literales, fundidos con `--dur-fade-*`, contraste AA, `--color-void` en `#rrggbb`); invariante de estructura (`src/structure.test.ts`: archivos con el mismo nombre, en su carpeta, ADR-018); invariante de citas (`src/code-references.test.ts`: el código no cita notas de fuera del repo, también claves sin opción como las de una pregunta suelta; las imágenes y fuentes no se leen); `sizes` de la ficha (`features/project/imageSizes`: sus medidas son las de `tokens.css` y de los CSS de la página) |
| Contenido (Vitest) | Invariantes del contenido | Reglas de `docs/01-contenido/modelo-de-datos.md`; paridad de claves EN/ES; portada y galería de cada ficha (textos, archivos y orden, lista escrita a mano); skills ↔ posiciones de constelación |
| Componentes (Vitest + Testing Library) | Comportamiento visible | `HoldButton` (teclado y puntero), `CopyButton` (éxito y fallo), `ChapterRail` (`aria-current`), `QuickMissionDialog` (foco y Esc), `LanguageSwitch` (conserva el capítulo activo), `SceneMount` (nivel elegido, sin WebGL2, escena que lanza o se rinde → sin WebGL con su aviso, turno con la sugerencia de idioma), `SceneRoot` (con el `<Canvas>` simulado: DPR y estrellas por nivel, bucle de frames propio —rellena el frame y avanza; un frame que lanza para y se rinde—, color de fondo del token con sus números tal cual —y otra vez al recuperar el contexto; un token que no es `#rrggbb` se registra—, movimiento reducido —el reloj se para y sigue sin salto—, su `m` suavizada —arranca en `mTarget`, lo persigue más deprisa con movimiento reducido y el store sigue con el objetivo—, la pausa con misión rápida o pestaña oculta (`data-paused`), shader y contexto perdido, las formas de su nivel, `data-shapes` y `data-particles`, y a la cámara le da el mismo frame, con si es escritorio y el ratón hasta desmontarse), `SceneMount` también marca `scene-on` cuando la escena pinta y quita sus clases al desmontarse, `Particles` (`useParticles` con `useFrame` simulado: avisa una vez en su primer frame, rellena los uniforms y libera geometría y material), `CameraRig` (con `useFrame` simulado: pose, encuadre, campo de visión solo al cambiar el aspecto, paralaje con el tiempo real y sin él con movimiento reducido), `useSceneShapes` (formas del worker, reintento en el hilo principal a Bajo, Apagado, otro `count` → otras formas, cancelación) |
| Extremo a extremo (Playwright) | Recorridos reales en Chromium, Firefox y WebKit | Recruiter: home → Projects → página de Chessmate → código (`recruiter.spec.ts`, en EN y ES: a 1280 px, «Projects» de la barra pone los proyectos en pantalla con un clic y el segundo abre la ficha; a 390 px, la misión rápida pone los proyectos en pantalla con un toque —título de Proyectos y primer proyecto enteros— y su enlace llega tras un deslizamiento, y el raíl cae en el capítulo con la escena primero y la primera fila llega tras un deslizamiento; en la ficha, ruta y `lang` exactos y el código a un clic en una pestaña nueva, sin errores en consola; las ayudas comunes de los e2e, en `tests/e2e/support/helpers.ts`); misión rápida; cambio de idioma; detonación; WebGL desactivado; movimiento reducido; 404; el viaje sin escena (`journey.spec.ts`: capítulos y anclas EN/ES, detonación con teclado y con movimiento reducido, nombre que no tapa la singularidad y sin scroll horizontal en 1280×720, 1440×900 y 390×844, todo lo enfocable entra en pantalla con Tab sin quedar bajo la barra, las anclas caen justo bajo la barra, CLS < 0,1 con fuentes lentas, lectura sin JS); la interfaz fija (`chrome.spec.ts`: HUD que sigue el scroll; raíl con el capítulo activo, saltos con foco y sin entrada en el historial, enlaces sin JS, columna de puntos, foco y alto contraste, sin tapar el hero en móvil, y tras volver de la 404 de `/ES`; barra con Skip, Projects/Contact, idioma que conserva el capítulo y no navega en el actual, velo, texto al 200 % a 390 px (forma corta «Quick») y a 960 px (ceden el chip y la etiqueta larga), en el viaje y en las fichas, chip «Open to work» que salta a Contacto y su punto que respira, y enlaces sin JS); el modo misión rápida (`quick-mission.spec.ts`: abre a pantalla completa con el foco dentro y `#quick` en su sitio, todo el contenido, Esc y «Close quick mission» devuelven ancla, scroll y foco, `#quick` escrito en la dirección y Atrás, Tab que no sale (`:modal`), cabecera fija a 390 px, copiar el email y su alternativa a 390 px con el texto al 200 %, y 44 px de los controles nuevos); la sugerencia de idioma (`language-notice.spec.ts`: solo con el navegador en español, se recuerda la respuesta, cabe a 390 px y nada enfocado queda debajo, en el viaje y en la ficha); la página de proyecto (`project-page.spec.ts`: secciones con datos en orden, vuelta al viaje con el foco en la fila (también la última a 390 px) y Atrás con el scroll donde estaba, barra, Skip, EN / ES al mismo proyecto, misión rápida y su enlace a otro proyecto que la cierra, anterior/siguiente con el foco en el nombre y en media columna, cuentas de demo que caben a 520 y 600 px en español con el texto al 200 %, 44 px de sus controles, sin scroll lateral con el texto al 200 % (fichas y 404) y la barra entera, y la sugerencia de idioma con ese proyecto); cimientos visuales (`design-system.spec.ts`: fuentes y su precarga, eje `wdth`, foco, margen lateral, duraciones, reset); presupuestos de fuentes, imágenes, JS inicial (framework y código propio por página) y JS de la escena —con los shaders sin comentarios— sobre el build (`budgets.spec.ts`); la carga de la escena (`scene.spec.ts`: con WebGL2, llega después de la primera pintura en su chunk, sin errores, deja pasar los clics al contenido y es el mismo lienzo tras ir a una ficha y volver; el contenido de cada página (`main`) queda por encima del lienzo; las partículas se pintan (los shaders compilan) y se ven (una fracción de los píxeles junto a los paneles no es el fondo), el punto CSS del hero cede al de partículas y el halo se queda, y el viaje por los 5 capítulos llega a Contacto sin errores ni avisos de WebGL del navegador; con movimiento reducido, igual; la misión rápida la pausa (`data-paused`) y al cerrarla sigue; a 1280×720 y a 390×844, la cámara sigue el viaje y el ratón (que sale de la ventana al final) sin errores; un contexto perdido que no vuelve pasa a sin WebGL; las formas llegan del worker sin descargar los generadores (`data-shapes="worker"`) y, si el worker no llega, se generan una vez en el hilo principal y la escena sigue (`data-shapes="main"`); sin WebGL, no descarga la escena, marca `no-gl` (con el fondo estático del espacio por debajo del contenido y el punto y el halo CSS) y avisa una vez por visita en el idioma de la página y después de la sugerencia de idioma; los e2e que miden el scroll al pie de la ventana descartan antes ese aviso con `settleScene`, por si un motor del CI no tiene WebGL); las imágenes de la ficha (`project-images.spec.ts`: a densidad 1, portada del ancho de la columna con su hueco reservado, miniatura de 640 px y visor de 1920 px a 1440 px, y variante de 640 px a 390 px, en el formato que elija cada navegador; la regla 5 sobre cada `<picture>` y el `og:image` de las fichas del build; la home sin las imágenes; todo lo que ofrece la página —el número exacto— se sirve como imagen; visor con las capturas reales —abrir, ← →, Esc y «Close» con el foco de vuelta—, que a 390 px pinta la imagen entera (`contain`) dentro de la pantalla con sus controles de 44 px; y CLS < 0,1 con la portada y una miniatura lentas, que si falla dice qué elemento se movió, cuándo y cuánto); SEO sobre el HTML real (`seo.spec.ts`: canónica, `hreflang`, Open Graph y JSON-LD de cada página, `og:image` de las fichas con portada —JPEG de 1200 px servido, medidas y `alt`; la lista escrita a mano, solo con proyectos que existen— y `summary_large_image`, sitemap y robots, 404 por idioma, y la 404 hidratada con la misma única hoja de estilos que el HTML servido) |
| Regresión visual (Playwright + Docker) | Un estado por capítulo y por tamaño de referencia | Capturas en 1440×900 y 390×844, tolerancia de píxeles acordada |
| Lighthouse CI | Rendimiento, accesibilidad, SEO | Presupuestos de abajo |

**Cobertura mínima** (falla el CI por debajo): 90 % en `src/lib`, `src/content`, `src/scene/{shapes,math,config,worker}`
y la lógica de la escena que se prueba sin WebGL (`frameLoop`, `sceneClock`, `sceneMaterials`, `particleGeometry`,
`voidColour`, `pause` y `shaders/`) (fuera, la entrada del worker, `shapes.worker.ts`: solo conecta el mensaje con
`handleShapesRequest`);
70 % global de líneas.

## Presupuestos (Lighthouse CI y tamaño)

| Métrica | Límite |
|---|---|
| JS inicial (sin escena), gzip | **Framework ≤ 112 KB** (las dependencias del JS inicial, chunk `entry.client` o `framework`; 107,3 KB en F2.4; las de la escena van en su chunk diferido) + **código propio ≤ 35 KB por página** (home 17,4 · proyecto 12,6 · 404 7,0 KB en F2.4). Alarma propia, no requisito externo (mandan los Core Web Vitals y Lighthouse del brief). E2E `budgets.spec.ts` sobre el build, en **todos** los HTML del build (ADR-020) |
| CSS (hoja única), gzip | ≤ 50 KB (ADR-019: por encima, revisar si conviene volver a partirla; 4,3 KB en F2.4). E2E `budgets.spec.ts` sobre la hoja que piden las páginas |
| Chunk de la escena, gzip | ≤ 250 KB (Three.js, React Three Fiber y `SceneRoot`; 241,6 KB en F3.1 con el lienzo vacío y en F3.2 con las formas pedidas, casi todo Three.js entero; 248,2 KB en F3.3 con las partículas, sus shaders y las estrellas; 247,0 KB con los shaders sin comentarios, antes de F3.4; 247,9 KB en F3.4 con la cámara; 248,1 KB con el color de fondo sin linealizar y el reajuste de las partículas y del shader; 248,4 KB en F3.5 con el suavizado de `m` y la pausa). E2E `budgets.spec.ts`: lo sigue desde el import dinámico, exige que ningún HTML lo pida y que los shaders lleguen sin el texto de sus comentarios |
| Lo que la escena carga aparte, gzip | **Worker de las formas ≤ 10 KB** (4,4 KB en F3.2) y **generadores del reintento ≤ 10 KB** (el mismo código en su chunk; 3,8 KB). E2E `budgets.spec.ts`: clasifica cada `import()` y `new URL(…)` que sale de la escena; uno sin clasificar (o con una ruta que no se puede leer) hace fallar el test |
| Fuentes (todas, woff2 subconjunto latino) | ≤ 150 KB (e2e `budgets.spec.ts` desde F2; Lighthouse CI en F6) |
| Imágenes (cada variante que ofrecen las páginas: AVIF, WebP y JPEG para compartir) | ≤ 200 KB por archivo (148 KB la mayor en F2.8). E2E `budgets.spec.ts` sobre las que piden los HTML del build |
| LCP móvil (simulado) | < 2,5 s |
| CLS | < 0,1 |
| TBT | < 200 ms |
| Lighthouse móvil | Performance ≥ 85 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 95 |

### Mediciones

Hasta F6, Lighthouse se pasa a mano al cerrar cada fase (`npx lighthouse@<versión exacta>`, perfil móvil por
defecto, sobre `npm run build` + `npm run preview`) y se apunta aquí; en F6 lo sustituye Lighthouse CI.

**Cierre de F2 (`v0.1.0`) · Lighthouse 13.5.0 · móvil simulado · build local**

| Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 93 | 100 | 100 | 100 | 2,7 s | 0 | 50 ms |
| `/es` | 92 | 100 | 100 | 100 | 2,7 s | 0 | 0 ms |
| `/projects/chessmate` | 94 | 100 | 100 | 100 | 2,6 s | 0 | 10 ms |
| `/es/projects/astrohub` | 95 | 100 | 100 | 100 | 2,6 s | 0 | 0 ms |
| `/projects/cosmos` | 96 | 100 | 100 | 100 | 2,4 s | 0 | 0 ms |
| `/404` | 97 | 100 | 100 | 54 | 2,4 s | 0 | 0 ms |

**Cierre de F2 · PageSpeed Insights (Lighthouse 13.5.0, Moto G Power emulado, 4G lenta) · producción en Vercel ·
2026-10-26**

| Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 97 | 100 | 100 | 100 | 2,3 s | 0 | 0 ms |
| `/projects/chessmate` | 98 | 100 | 100 | 100 | 2,1 s | 0 | 0 ms |

- La 404 no puntúa en SEO a propósito: lleva `noindex` y no tiene descripción (no se indexa).
- LCP de las fichas: la portada (`fetchpriority="high"`, sin `loading="lazy"`, ya en el HTML inicial); casi todo
  el tiempo es retraso de render, no descarga. En la home, el texto de entrada del hero (~2,2 s de retraso de
  render en local). En local, la home y las fichas de Chessmate y AstroHub pasan algo del presupuesto de LCP
  (< 2,5 s); en producción (CDN de Vercel) quedan dentro. Se vigila en F6 con Lighthouse CI y en un móvil real.
- Aviso sin peso en la nota: `label-content-name-mismatch` en EN / ES (se ve «EN», el nombre es «English»,
  `componentes.md`). Se revisa con NVDA y control por voz en F6.

## Definición de «hecho» (por tarea)

1. `npm run check` en verde y build correcto. Si el cambio toca la config de Vite o los imports especiales
   (`?project`, `?share`…), abrir también las páginas afectadas con `npm run dev`, sin errores en consola: los e2e
   prueban el build y Vitest sustituye esos imports (en F2.8, la ficha caía solo en desarrollo).
2. Tests nuevos para el comportamiento añadido, incluidos los casos límite.
3. Accesibilidad revisada (teclado, foco, lector) si toca interfaz.
4. Auditoría con mirada fresca (`code-audit` o la Mesa) antes de cerrar la fase.
5. `STATE.md` y, si aplica, `DECISIONS.md` y estos docs actualizados.
