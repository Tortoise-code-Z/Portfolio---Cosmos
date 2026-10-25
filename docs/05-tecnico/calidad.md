# Calidad: tipado, lint, tests y presupuestos

## TypeScript

- `strict: true` + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
  `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `isolatedModules`.
- Tipos de retorno explícitos en funciones exportadas. Sin `any`; `unknown` + estrechamiento en los bordes.
- Tipos generados de rutas con `react-router typegen` (forma parte de `npm run typecheck`).
- Declaraciones para `*.glsl?raw` y para las importaciones de imagen con parámetros de `vite-imagetools`.

## ESLint (config plana) + Prettier

- `@eslint/js` recomendado + `typescript-eslint` `strictTypeChecked` y `stylisticTypeChecked`.
- `react-hooks` (recomendado), `jsx-a11y-x` (strict; fork mantenido de `jsx-a11y`, ADR-014).
- `no-restricted-imports` por carpeta (reglas de capas de `arquitectura.md`).
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
| `e2e` | Playwright (recorridos) |
| `visual` / `visual:update` | Capturas de regresión dentro del contenedor Docker de Playwright |
| `lhci` | Lighthouse CI sobre `preview` |
| `check` | `typecheck` + `lint` + `format:check` + `test` (lo mínimo antes de cada commit) |

## Pirámide de tests

| Nivel | Qué | Ejemplos |
|---|---|---|
| Unitarios (Vitest) | Toda la lógica pura | `mapM`, suavizado, cámara, proyección, generadores de formas, elección de nivel, formato del HUD, `i18n`, builders de SEO, asignación de placas; invariantes de estilos (`src/styles/styles.test.ts`: tokens definidos, sin colores, duraciones ni familias literales, fundidos con `--dur-fade-*`, contraste AA); invariante de estructura (`src/structure.test.ts`: archivos con el mismo nombre, en su carpeta, ADR-018); invariante de citas (`src/code-references.test.ts`: el código no cita notas de fuera del repo) |
| Contenido (Vitest) | Invariantes del contenido | Reglas de `docs/01-contenido/modelo-de-datos.md`; paridad de claves EN/ES; skills ↔ posiciones de constelación |
| Componentes (Vitest + Testing Library) | Comportamiento visible | `HoldButton` (teclado y puntero), `CopyButton` (éxito y fallo), `ChapterRail` (`aria-current`), `QuickMissionDialog` (foco y Esc), `LanguageSwitch` (conserva el capítulo activo), `SceneMount` (pasa a sin WebGL ante error) |
| Extremo a extremo (Playwright) | Recorridos reales en Chromium, Firefox y WebKit | Recruiter: home → Projects → página de Chessmate → código; misión rápida; cambio de idioma; detonación; WebGL desactivado; movimiento reducido; 404; el viaje sin escena (`journey.spec.ts`: capítulos y anclas EN/ES, detonación con teclado y con movimiento reducido, nombre que no tapa la singularidad y sin scroll horizontal en 1280×720, 1440×900 y 390×844, todo lo enfocable entra en pantalla con Tab sin quedar bajo la barra, las anclas caen justo bajo la barra, CLS < 0,1 con fuentes lentas, lectura sin JS); la interfaz fija (`chrome.spec.ts`: HUD que sigue el scroll; raíl con el capítulo activo, saltos con foco y sin entrada en el historial, enlaces sin JS, columna de puntos, foco y alto contraste, sin tapar el hero en móvil, y tras volver de la 404 de `/ES`; barra con Skip, Projects/Contact, idioma que conserva el capítulo y no navega en el actual, velo, texto al 200 % a 390 px (forma corta «Quick») y a 960 px (ceden el chip y la etiqueta larga), en el viaje y en las fichas, chip «Open to work» que salta a Contacto y su punto que respira, y enlaces sin JS); el modo misión rápida (`quick-mission.spec.ts`: abre a pantalla completa con el foco dentro y `#quick` en su sitio, todo el contenido, Esc y «Close quick mission» devuelven ancla, scroll y foco, `#quick` escrito en la dirección y Atrás, Tab que no sale (`:modal`), cabecera fija a 390 px, copiar el email y su alternativa a 390 px con el texto al 200 %, y 44 px de los controles nuevos); la sugerencia de idioma (`language-notice.spec.ts`: solo con el navegador en español, se recuerda la respuesta, cabe a 390 px y nada enfocado queda debajo, en el viaje y en la ficha); la página de proyecto (`project-page.spec.ts`: secciones con datos en orden, vuelta al viaje con el foco en la fila (también la última a 390 px) y Atrás con el scroll donde estaba, barra, Skip, EN / ES al mismo proyecto, misión rápida y su enlace a otro proyecto que la cierra, anterior/siguiente con el foco en el nombre y en media columna, cuentas de demo que caben a 520 y 600 px en español con el texto al 200 %, 44 px de sus controles, sin scroll lateral con el texto al 200 % (fichas y 404) y la barra entera, y la sugerencia de idioma con ese proyecto); cimientos visuales (`design-system.spec.ts`: fuentes y su precarga, eje `wdth`, foco, margen lateral, duraciones, reset); presupuestos de fuentes y de JS inicial (framework y código propio por página) sobre el build (`budgets.spec.ts`); SEO sobre el HTML real (`seo.spec.ts`: canónica, `hreflang`, Open Graph y JSON-LD de cada página, sitemap y robots, 404 por idioma, y la 404 hidratada con la misma única hoja de estilos que el HTML servido) |
| Regresión visual (Playwright + Docker) | Un estado por capítulo y por tamaño de referencia | Capturas en 1440×900 y 390×844, tolerancia de píxeles acordada |
| Lighthouse CI | Rendimiento, accesibilidad, SEO | Presupuestos de abajo |

**Cobertura mínima** (falla el CI por debajo): 90 % en `src/lib`, `src/content` y `src/scene/{shapes,math,config}`;
70 % global de líneas.

## Presupuestos (Lighthouse CI y tamaño)

| Métrica | Límite |
|---|---|
| JS inicial (sin escena), gzip | **Framework ≤ 112 KB** (las dependencias del JS inicial, chunk `entry.client` o `framework`; 107,3 KB en F2.4; las de la escena van en su chunk diferido) + **código propio ≤ 35 KB por página** (home 17,4 · proyecto 12,6 · 404 7,0 KB en F2.4). Alarma propia, no requisito externo (mandan los Core Web Vitals y Lighthouse del brief). E2E `budgets.spec.ts` sobre el build, en **todos** los HTML del build (ADR-020) |
| CSS (hoja única), gzip | ≤ 50 KB (ADR-019: por encima, revisar si conviene volver a partirla; 4,3 KB en F2.4). E2E `budgets.spec.ts` sobre la hoja que piden las páginas |
| Chunk de la escena, gzip | ≤ 250 KB |
| Fuentes (todas, woff2 subconjunto latino) | ≤ 150 KB (e2e `budgets.spec.ts` desde F2; Lighthouse CI en F6) |
| LCP móvil (simulado) | < 2,5 s |
| CLS | < 0,1 |
| TBT | < 200 ms |
| Lighthouse móvil | Performance ≥ 85 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 95 |

## Definición de «hecho» (por tarea)

1. `npm run check` en verde y build correcto.
2. Tests nuevos para el comportamiento añadido, incluidos los casos límite.
3. Accesibilidad revisada (teclado, foco, lector) si toca interfaz.
4. Auditoría con mirada fresca (`code-audit` o la Mesa) antes de cerrar la fase.
5. `STATE.md` y, si aplica, `DECISIONS.md` y estos docs actualizados.
