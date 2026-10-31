# Arquitectura

## Tipo de aplicación

**Sitio estático pre-renderizado + interactividad en cliente.** React Router en modo framework con `ssr: false` y
`prerender` genera un HTML completo por ruta e idioma en el build (SEO, LCP rápido, funciona sin JS para leer);
en el navegador, React hidrata y la escena 3D se carga después, solo en cliente.

Sin servidor ni base de datos en la v1. Hosting estático en Vercel.

## Estructura del repositorio (código en la raíz)

```
cosmos-portfolio/
├─ src/                         ← appDirectory de React Router
│  ├─ root.tsx                  ← documento HTML, <html lang>, fuentes, meta de reserva, ErrorBoundary y
│  │                               HydrateFallback raíz
│  ├─ root.test.tsx             ← meta de reserva, ErrorBoundary y HydrateFallback (excepción de ADR-018)
│  ├─ entry.client.tsx          ← (si hace falta personalizar la hidratación)
│  ├─ routes.ts                 ← configuración de rutas EN/ES
│  ├─ routes/                   ← una carpeta por ruta, con su test (ADR-018)
│  │  ├─ journey/journey.tsx    ← el viaje (home): monta los 5 capítulos
│  │  ├─ project/project.tsx    ← /projects/:slug
│  │  └─ not-found/not-found.tsx
│  ├─ content/                  ← datos tipados (docs/01-contenido); `chapters.ts` (orden, anclas y ventanas
│  │                              de morph de los capítulos) y `site.ts` (repo del sitio) incluidos; en
│  │                              `projects/`, los textos (`entries.ts`) aparte de las imágenes (`media.ts`)
│  ├─ features/                 ← piezas de interfaz con lógica propia
│  │  ├─ journey/               ← Hero, ChapterSection, ChapterPanel, Eyebrow, About, Skills, Projects,
│  │  │                           ProjectRow, Contact, `chapterDom` (el contrato con el DOM que lee la
│  │  │                           navegación), `useBigBang` y `BigBangFlash` (los efectos del Big Bang en el
│  │  │                           DOM, ADR-030) y `shared.module.css` (piezas de texto comunes)
│  │  ├─ navigation/            ← TopBar, ChapterRail, LanguageSwitch, SkipLink, goToChapter (salto con
│  │  │                           ancla en la URL), AvailabilityChip, QuickMissionDialog y
│  │  │                           QuickMissionContent, `quickMission.ts` (suelto: ancla `#quick` e id del
│  │  │                           botón que lo abre) y LanguageNotice (sugerencia de idioma)
│  │  ├─ hud/                   ← CosmicHud y cosmicClock (reloj y escala, puros)
│  │  ├─ project/               ← ProjectPage (la página), ProjectHeader, ProjectSection, ProjectStack,
│  │  │                           ProjectNote, ProjectTryIt, ProjectGallery, ProjectPager y `neighbours`
│  │  │                           (proyecto anterior y siguiente, puro)
│  │  ├─ errors/                ← NotFoundPage (la 404 del idioma; la usan las rutas y `root.tsx`)
│  │  └─ scene-mount/           ← SceneMount (monta la escena en diferido y el aviso sin WebGL; lo pinta
│  │                              `root.tsx`), SceneErrorBoundary (aísla los fallos de la escena) y
│  │                              SceneStills (las fotos fijas del modo sin WebGL, solo en el viaje; las pinta
│  │                              su ruta) con stillFrames (sus encuadres; ADR-029)
│  ├─ scene/                    ← motor 3D (docs/04-escena), cargado en diferido: SceneRoot (el `<Canvas>`),
│  │                              contextLoss (pérdida del contexto WebGL: un intento de restaurar),
│  │                              useSceneShapes (pide las formas; reintento en el hilo principal),
│  │                              fpsMeter y useHotDegradation (la degradación en caliente: fps por ventanas),
│  │                              Particles (useParticles) y BackgroundStars (useBackgroundStars; montan los Points),
│  │                              particleGeometry (atributos), sceneMaterials (uniforms, materiales y el
│  │                              `SceneFrame`), frameLoop (el bucle de frames, ADR-027), sceneClock (el reloj de
│  │                              animación), voidColour (el fondo del lienzo), CameraRig y pointer (la cámara
│  │                              y el ratón) y pause (cuándo pausar el bucle: pestaña oculta, misión rápida)
│  │  ├─ shaders/               ← los `.glsl` (particles, stars), glslHeader (etiquetas y colores desde TS) y
│  │  │                           stripGlslComments (el plugin de vite.config.ts)
│  │  ├─ math/                  ← código puro: camera (pose por `m`, campo de visión, paralaje)
│  │  ├─ config/                ← lo compartido: sceneConfig (semilla, semiejes del caparazón, cámara),
│  │  │                           plateSlots (huecos de las placas, assignPlates) y scenePalette (los colores)
│  │  ├─ shapes/                ← código puro: prng, noise, sampling, hexGrid, un generador por forma
│  │  │                           (nebula, galaxy, turtle, earth), shapeContract, generateShapes y stars
│  │  │                           (las estrellas de fondo, en el hilo principal)
│  │  └─ worker/                ← shapes.worker.ts (la entrada), handleShapesRequest, protocol y loadShapes
│  ├─ ui/                       ← componentes genéricos sin dominio: ButtonOutline, HoldButton, ActionLink,
│  │                              CopyButton, Notice, Icon, VisuallyHidden, ArrowText (las «→» del texto
│  │                              con el icono), Picture (`<picture>` AVIF/WebP) y Lightbox (visor de imágenes)
│  ├─ lib/                      ← funciones puras y hooks transversales
│  │  ├─ env/                   ← variables de entorno validadas: siteUrl (parseSiteUrl), site (SITE_ORIGIN)
│  │  ├─ i18n/                  ← tipos, useLocale, useT, formateadores Intl, rutas localizadas,
│  │  │                           idioma del navegador y sugerencia (browserLocale, languageSuggestion)
│  │  ├─ history/               ← replaceHash (cambia el ancla sin entrada nueva en el historial)
│  │  ├─ storage/               ← readStorage / writeStorage: localStorage que nunca lanza; si falla, memoria
│  │  │                           hasta recargar y un aviso por clave (solo comodidades)
│  │  ├─ scroll/                ← mapM y toScrollLayout (puros), useChapterLayout, useScrollTarget,
│  │  │                           jumpToChapter (scroll + foco al título + ancla) y smoothM (el suavizado de
│  │  │                           `m` que comparten la escena y los efectos del Big Bang, ADR-030)
│  │  ├─ seo/                   ← builders puros: URL canónicas, lista de páginas, meta, hreflang, JSON-LD,
│  │  │                           sitemap y robots (reciben origen y datos por parámetro, ADR-017)
│  │  ├─ device/                ← señales del dispositivo: mediaQuery (watchMediaQuery: una media query ahora y
│  │  │                           cada vez que cambie), reducedMotion (prefersReducedMotion, jumpBehavior,
│  │  │                           watchReducedMotion),
│  │  │                           sceneLevel (niveles de la escena, su tabla, la elección inicial, pura,
│  │  │                           nextLowerLevel e isHandheld, y readBrowserSignals / readHandheldSignals, que
│  │  │                           leen las señales en cliente) y webgl2 (detectWebGL2:
│  │  │                           con GPU, por software —por su renderer— o sin WebGL2); después usePointerType
│  │  ├─ hold/                  ← carga de «mantén pulsado»: charge (puro) y useHoldCharge (rAF + variable CSS)
│  │  ├─ bigBang/               ← cuentas de los efectos del Big Bang en el DOM (destello, temblor, nombre,
│  │  │                           halo) y sus variables CSS (puro, ADR-030)
│  │  ├─ css/                   ← cx (unir clases) y useHeightVar (altura de un elemento como variable CSS)
│  │  └─ math/                  ← clamp, smoothstep, lerp, damp (el amortiguado de `m`; después, easing)
│  ├─ stores/                   ← uiStore (React) · sceneStore (mutable, sin re-render)
│  ├─ styles/                   ← tokens.css, global.css, fonts.css
│  ├─ assets/projects/<slug>/   ← capturas originales `NN-<nombre>.png` (vite-imagetools genera las variantes
│  │                               con los presets `?project` y `?share` de vite.config.ts; ADR-023)
│  └─ assets/scene-stills/      ← fotos fijas del modo sin WebGL, `{avif,webp}/` y su huella `stills.json`
│                                  (las saca `npm run stills`; ADR-029)
├─ public/                      ← favicon.svg, apple-touch-icon.png, og/, cv/ (robots.txt y sitemap.xml
│                                  se generan en el build)
├─ tests/
│  ├─ e2e/                      ← Playwright: recorridos (support/: ayudas y el `test` de los specs, que en
│  │                              los tres motores arranca la escena en Bajo)
│  ├─ visual/                   ← Playwright: capturas por capítulo y tamaño (referencias en __screenshots__/)
│  └─ stills/                   ← Playwright: saca las fotos fijas del modo sin WebGL (`npm run stills`) y su
│                                 huella (fingerprint.ts)
├─ scripts/                     ← lo que va en Docker (calidad.md): en el equipo, visual.ts y stills.ts lanzan la
│                                 imagen (playwrightImage.ts); dentro corren prepare-in-docker.sh,
│                                 visual-in-docker.sh y stills-in-docker.sh
├─ docs/                        ← esta documentación
├─ .github/workflows/ci.yml
└─ (configs) react-router.config.ts · vite.config.ts · vitest.config.ts · playwright.config.ts · playwright.visual.config.ts · playwright.stills.config.ts ·
             eslint.config.js · .prettierrc.json · tsconfig.json · .nvmrc · .gitattributes · .env.example ·
             lighthouserc.json (F6)
```

Alias de importación: `~/` → `src/`.

**Archivos con el mismo nombre, en su carpeta (ADR-018).** Si dos o más archivos de la misma carpeta comparten el
nombre base (lo que va antes del primer punto: `meta.ts`, `meta.test.ts`, `meta.module.css`), van juntos en una
carpeta con ese nombre y conservan el suyo, sin `index.ts`: `lib/seo/meta/meta.ts` + `lib/seo/meta/meta.test.ts`
(se importa como `~/lib/seo/meta/meta`). Vale para `src/` y `tests/`; un archivo sin pareja se queda suelto.
Única excepción: `src/root.tsx` (React Router fija su nombre y su sitio) y su test, `src/root.test.tsx`.
`src/structure.test.ts` lo vigila.

**Nombres.** Cada archivo se llama como lo que exporta: los componentes en PascalCase, con su carpeta
(`ui/HoldButton/HoldButton.tsx`, `HoldButton.module.css`, `HoldButton.test.tsx`); las funciones y hooks de `lib` en
camelCase (`lib/hold/useHoldCharge/useHoldCharge.ts`); las rutas en minúsculas, como pide React Router
(`routes/not-found/not-found.tsx`).

## Capas y reglas de dependencia

```
content  ◄── lib ◄── stores ◄── ui ◄── features ◄── routes
                         ▲                 │
                         └──── scene ◄─────┘ (solo a través de un import dinámico)
```

El diagrama es orientativo; manda la tabla.

| Capa | Puede importar | No puede importar |
|---|---|---|
| `content` | nada salvo sus tipos y, en `projects/media.ts`, las capturas de `src/assets/` (ADR-023) | React, Three, cualquier otra capa |
| `lib` | `content/types` (tipos y constantes de idioma) y `content/texts` (para `useT`) (ADR-017) | Los datos de `content` (perfil, proyectos, skills: le llegan por parámetro), `stores`, `ui`, `features`, `scene`, `routes`, Three |
| `stores` | `lib`, `content` | `ui`, `features`, `scene`, `routes`, Three |
| `ui` | `lib` | `stores`, `features`, `scene`, `routes`, `content` (recibe datos por props), Three |
| `features` | `ui`, `lib`, `stores`, `content` y, solo en `scene-mount/SceneStills`, las fotos fijas de `src/assets/scene-stills/` (ADR-029) | `three`, `@react-three/*`, `scene` (salvo el punto de montaje diferido), `routes` |
| `scene` | `lib`, `stores`, `content` (solo ids y orden) | `features`, `ui`, `routes` |
| `scene/{shapes,math,config,worker}` (código puro: va en el worker) | `lib`, `content/types` (los datos, por parámetro; sus tests sí usan el contenido real) y los módulos de `scene/` fuera de `IMPURE_SCENE_MODULES` (hoy `pointer`, `frameLoop`, `sceneClock`, `fpsMeter`, `shaders`; `math/camera` y `math/gravity` usan el tipo de `scene/pointer`) | Three, React, Zustand, `stores`, `features`, `ui`, `routes`, los módulos de la escena con Three, React o un store, y `contextLoss` (`IMPURE_SCENE_MODULES` de `eslint.config.js`), los datos de `content` y cualquier `import()` |
| `routes` (y `root.tsx`) | todo lo anterior menos la escena | `scene`, `three`, `@react-three/*` (la escena solo llega por `SceneMount`) |

Se hacen cumplir con `no-restricted-imports` de ESLint por carpeta: un import prohibido rompe el lint. Los
`import()` los vigila `no-restricted-syntax` (ver «Carga de la escena»).

**Entre features.** Una feature no importa componentes de otra. Si dos comparten un contrato (constantes o
funciones sin React), vive en un módulo aparte de la feature que lo define y la otra importa solo ese módulo,
en un solo sentido y sin ciclos. Hoy, el único: `features/journey/chapterDom` (cómo se encuentran los capítulos
en el DOM e id del nombre), que leen `features/navigation` y la ruta del viaje (ADR-022).

## Rutas e idiomas

`routes.ts` declara cada ruta dos veces con `id` distinto y el mismo módulo:

| Ruta | id | Idioma |
|---|---|---|
| `/` | `journey-en` | en |
| `/projects/:slug` | `project-en` | en |
| `/es` | `journey-es` | es |
| `/es/projects/:slug` | `project-es` | es |
| `*` | `not-found` | según prefijo |

- El idioma se deriva de la ruta (no del navegador); `useLocale()` lo lee del **prefijo** (lo único que sirve
  también en la ruta `*`).
- Una sola lista de páginas, `sitePages(projectEntries)` (`lib/seo/pages/pages.ts`): de ella salen el `prerender` y el
  sitemap; el `hreflang` usa las mismas funciones de ruta y `consistency.test.ts` comprueba que es el mismo
  conjunto. Se pre-renderizan 2 idiomas × (1 + nº de proyectos) páginas y la 404 de cada idioma (`/404` y
  `/es/404`, servidas por la ruta `*`).
- Todas las rutas van en minúsculas. Slug desconocido o ruta con **mayúsculas en cualquier tramo**
  (`/projects/Chessmate`, `/PROJECTS/chessmate`, `/ES`): la ruta que case pinta la **misma página 404**
  (`NotFoundPage`) y su `meta` es la de la 404, en el idioma del prefijo en minúsculas (`/ES` → EN); no lanza
  error. Lo decide `isLowerCasePathname` (`lib/i18n/paths/`), que usan las rutas de home y de proyecto y el
  servidor de `preview` (en Windows el disco no distingue mayúsculas). Así el HTML coincide con el `404.html` y
  hidrata sin errores de consola. Son 404 sin redirección: slug desconocido, mayúsculas, `/projects` sin slug,
  `/en` y `/en/…`.
- Al hidratar ese `404.html` el cliente casa la ruta de proyecto, cuyo módulo no venía en el HTML. Mientras lo
  descarga pinta el `HydrateFallback` de `root.tsx`, que es la misma `NotFoundPage`: coincide con el HTML servido.
  Sin él, React dejaba el `<main>` del HTML y añadía otro (dos `<h1>`). En la `<head>` pasa lo mismo: mientras
  tanto se pinta la `meta` de la raíz (con `error: null`), que devuelve la de la 404. Las hojas de estilo no
  pueden diferir: todo el CSS va en **un solo archivo** que enlaza la raíz (ADR-019), así que el `<head>` del
  `404.html` coincide con el del cliente aunque case la ruta del viaje o la de proyecto. React Router 8.4 no pasa
  `caseSensitive` a las rutas del cliente, así que `/projects/Chessmate` o `/ES` también casan una ruta de página
  en el navegador.
- `react-router.config.ts` **no** resuelve el alias `~/`: lo que importa (contenido, `lib/seo/{pages,urls,sitemap}/`,
  `lib/i18n/paths/`, `lib/env/siteUrl/`) usa imports relativos. Si alguien lo cambia, el build falla al cargar la
  config. Tampoco entiende los imports de imagen: de los proyectos importa `projectEntries` (sin imágenes, ADR-023),
  igual que los e2e. Su `buildEnd` escribe `sitemap.xml`, `robots.txt` y `404.html` (copia de la 404 EN) en `build/client`.
- Segmento `projects` igual en ambos idiomas (decisión: URLs estables y sin mapa de traducción de rutas).
- `meta` de cada ruta (`lib/seo/meta/meta.ts`): título, descripción (en proyectos, el `summary`), canónica propia de
  cada idioma, `hreflang` en/es/x-default (= EN), Open Graph (`og:locale` `en_US`/`es_ES` con su alternativa,
  `og:type` `website` o `article`; en las fichas con portada, `og:image` = su JPEG de 1200 px con medidas y `alt`,
  y `twitter:card` `summary_large_image`; sin ella, sin `og:image` hasta que exista la imagen del sitio, F6, y
  `summary`), JSON-LD (`Person` en la home, sin email; `SoftwareSourceCode` en cada
  proyecto, con el autor embebido). URL base desde `VITE_SITE_URL`.
- Forma única de las URL absolutas (`absoluteUrl`): origen + ruta, sin barra final salvo la home EN
  (`https://…/`, `https://…/es`, `https://…/projects/chessmate`), sin `?` ni `#`. Un test comprueba que
  canónicas, `hreflang`, `og:url` y sitemap son el mismo conjunto. Los archivos del build (`og:image`) van con
  `assetUrl`: ruta con `/`, nombre con el hash (mayúsculas, `_` y `-`) y extensión, sin `?`, `#` ni `..`; en
  `npm run dev`, también `/@imagetools/<hash>` (vite-imagetools sirve las imágenes desde memoria, sin extensión).
- 404: `noindex`, sin canónica, `hreflang` ni JSON-LD, fuera del sitemap. Tampoco lleva `description`,
  `og:description` ni `og:url`: no se indexa y no tiene dirección propia (decidido, no es un olvido).
- `sitemap.xml` (solo `<loc>`) y `robots.txt` (`Allow: /` + `Sitemap:` absoluto) generados en el build.

## Estado

| Store | Qué guarda | Quién lo lee |
|---|---|---|
| `uiStore` (Zustand, `useUiStore`) | modo misión rápida abierto (`quickMissionOpen`, desde F2.6); último proyecto visto (`visitedProject`, desde F2.7: lo apunta la página de proyecto y el capítulo Proyectos lo recoge una vez, con `takeVisitedProject`, para dejar el foco en su fila); nivel de la escena (`sceneLevel`, desde F3.1: `null` mientras no se decide, `high`/`medium`/`low`, u `off` = sin WebGL para el resto de la visita; desde F3.2, `lowerSceneLevel` lo baja y nunca lo sube: el reintento de las formas y, desde F3.6, la degradación en caliente); sugerencia de idioma a la vista (`languageNoticeOpen`, desde F3.1: el aviso sin WebGL espera a que se conteste); después, grupo de skills activo y proyecto activo (el que se resalta por puntero o foco en su fila, o por su pin: sincroniza filas y placas, F4.4) | Componentes React (selectores finos); desde F3, la escena (pausa con el modo abierto); desde F5, la placa visitada |
| `sceneStore` (Zustand *vanilla*, mutable) | `mTarget`, `m` (desde F2.5; `m = mTarget` siempre: la escena suaviza su propia copia, ADR-028), la carga de la detonación (`charge`, desde F4.1: la escribe el bucle del botón del hero en cada frame mientras carga o se descarga, ADR-030) y, más adelante en F4, peso de capítulos (el ratón no: lo escribe `scene/pointer` en el `SceneFrame`) | el `step` del bucle de `SceneRoot` (sobre `scene/frameLoop`): lee `mTarget` y `charge` y deja su `m` suavizada y la carga en el `SceneFrame` que leen los `useFrame`; los efectos del Big Bang del hero (`useBigBang`, ADR-030) por suscripción, en su propio bucle y **sin re-render**; el HUD por `getState()`/suscripción, **sin re-render**; el raíl, el idioma y las fotos fijas del modo sin WebGL eligen `selectActiveChapter` (solo se repintan al cambiar de capítulo) |

Regla: nada que cambie en cada frame pasa por estado de React. La respuesta a la sugerencia de idioma no está en
ningún store: se guarda en `localStorage` (`lib/storage`), la lee solo `LanguageNotice` y la escriben el aviso y
el selector `EN / ES` (`rememberLanguageAnswer`).

## Puente scroll → escena

1. `useChapterLayout` mide el inicio y la altura de cada capítulo (`getBoundingClientRect` + `scrollY`) al montar,
   con un ResizeObserver sobre `<main>` y tras `document.fonts.ready`; `useScrollTarget` las pasa a posiciones de
   scroll bajo la barra fija (`toScrollLayout`).
2. Un único listener de scroll pasivo calcula `mTarget = mapM(scrollY, layout)` y lo escribe en `sceneStore`
   (`setScrollTarget`; también al montar, para una recarga a mitad del viaje). La ruta del viaje los conecta:
   `lib` no importa `stores`, así que el destino le llega por parámetro.
3. El bucle de la escena lee `mTarget` en cada frame y suaviza su propia `m` (`smoothM` de `lib/scroll`, con el tiempo
   real del frame; en su primer frame arranca en `mTarget`), que deja en el `SceneFrame` compartido; los `useFrame`
   de cada pieza (uniforms, cámara y, en F4, etiquetas) la leen de ahí (ADR-028). `sceneStore.m` sigue siendo
   `mTarget`. Con la página oculta o la misión rápida abierta, el bucle se pausa (`scene/pause`). Los efectos del
   Big Bang en el DOM (`features/journey/useBigBang`) llevan otra copia con el mismo `smoothM` y la escriben, ya
   convertida en destello, temblor, nombre y halo, como variables CSS privadas en `<html>` (`--_bang-*`); los leen el
   hero, el destello (`BigBangFlash`, en la ruta del viaje, fuera de `<main>`) y el lienzo, sin importarse entre
   capas (ADR-030).
4. El raíl, el idioma y las fotos fijas (sin WebGL) eligen `round(m)` (`selectActiveChapter`); el HUD se suscribe y
   solo toca el DOM cuando
   cambia su texto (cambios discretos, no por frame).

## Carga de la escena

- `root.tsx` renderiza **una sola vez** `<SceneMount />` (`features/scene-mount`), en `Layout`, detrás de
  `{children}`. Las rutas **no** montan la escena: así el lienzo no se recrea al navegar, ni al pasar por
  `HydrateFallback` o el `ErrorBoundary` raíz (`Layout` los envuelve también), y el HTML de cualquier página,
  la 404 incluida, lleva una sola región de aviso. En el pre-render y al hidratar no pinta nada (solo la
  región vacía del aviso). Después, cuando el navegador está libre (`requestIdleCallback` con 2 s de plazo;
  en Safari, la vuelta siguiente del bucle de eventos):
  - sin WebGL2 o pintado por software (`detectWebGL2` → `none` o `software`, ADR-029) → modo sin WebGL, **sin
    descargar** Three.js;
  - con WebGL2 en la tarjeta gráfica → elige el nivel (`chooseInitialLevel`, `uiStore.sceneLevel`)
    y hace `lazy(() => import('~/scene/SceneRoot/SceneRoot'))`, dentro de `SceneErrorBoundary`.
- `SceneErrorBoundary` recoge los errores de la escena al montar y al renderizar con React (el chunk que no llega,
  el contexto que no se crea, un hijo del lienzo que lanza), los registra y pasa a sin WebGL. Lo que lanza dentro de
  un frame (`useFrame`, `gl.render`) no le llega: corre en el bucle de la escena (`scene/frameLoop`, ADR-027), que
  se para y lo pasa a `onFail` (regla en `docs/04-escena/rendimiento.md` → «Robustez»). `SceneRoot` avisa con
  `onFail` de lo que no llega a ningún boundary: un shader que no compila (`gl.debug.onShaderError`, que registra el
  programa y cada shader) o un contexto perdido que no vuelve (`contextLoss`: un intento, 3 s con la página a la
  vista), unas formas que no llegan de ninguna manera (`shapes-failed`) o un frame que lanza (`frame-error`,
  ADR-027). Sin WebGL: clase `no-gl` en `<html>`, el lienzo se desmonta y un aviso, una vez por visita. `SceneRoot`
  marca su envoltorio con `data-ready` cuando existe el renderer, con `data-level` (su nivel), con `data-shapes`
  (`worker` | `main`) cuando tiene las formas, con `data-particles="painted"` tras su primer frame con partículas y
  con `data-paused="true"` mientras el bucle está en pausa (`scene/pause`): lo esperan los e2e. Entonces
  `SceneMount` pone `scene-on` en `<html>` (el punto CSS del hero se funde).
- `SceneRoot` monta el `<Canvas>` fijo detrás del contenido (`--z-scene`), `aria-hidden`, sin puntero (R3F pone
  `pointer-events: auto` en línea a su envoltorio: se anula) y con el DPR máximo del nivel. Pinta con su propio
  bucle (`frameloop="never"` + `scene/frameLoop`, ADR-027) las partículas (`Particles`) y las estrellas de fondo
  (`BackgroundStars`); la cámara la mueve `CameraRig` (`docs/04-escena/camara-y-encuadre.md`), con el ratón de
  `scene/pointer` y si es escritorio de `watchMediaQuery`. Al montar pide las formas al worker; si falla, las genera
  una vez en el hilo principal a nivel Bajo, y si eso también falla, Apagado (`docs/04-escena/rendimiento.md` →
  «Worker de las formas»). Si después pinta por debajo de los fps del presupuesto, baja un nivel
  (`useHotDegradation`: rendimiento.md → «Degradación en caliente»).
- `scene/{shapes,math,config,worker}` es código puro: lo que corre en el worker o se prueba sin WebGL. ESLint
  le prohíbe Three, React, Zustand, `stores`, los módulos de la escena que usan Three, React o un store, más
  `contextLoss`, que vive con el lienzo (por ruta relativa: `SceneRoot`, `CameraRig`, `Particles`,
  `BackgroundStars`, `sceneMaterials`, `particleGeometry`, `useSceneShapes`, `useHotDegradation`, `contextLoss`,
  `voidColour`, `pause`; `pointer`, `frameLoop`, `sceneClock`, `fpsMeter` y `shaders` no, son DOM o cálculo sin
  dependencias), los datos de `content` (solo sus tipos) y cualquier `import()` (un import así engordaría el
  worker sin avisar), y prohíbe `Math.random` en toda la escena, también escrito
  `globalThis.Math.random` (ADR-011: el azar con semilla de `scene/shapes/prng`). **Un módulo nuevo de `scene/`
  con Three, React o un store se añade a `IMPURE_SCENE_MODULES`** (`eslint.config.js`): la lista es a mano.
- Three.js, React Three Fiber y lo que arrastran van en el chunk `scene` (grupo de `vite.config.ts`), que
  ningún HTML pide (ADR-020). El grupo es el resto de dependencias diferidas: un `import()` nuevo de otra
  librería necesita su propio grupo (lo vigila `budgets.spec.ts`). Solo `SceneMount` importa la escena, y solo
  en diferido: las capas lo vigilan con `no-restricted-imports` (también en `routes/` y `root.tsx`), y
  `no-restricted-syntax` prohíbe fuera de ahí los `import()` de `scene/` o de Three y cualquier `import()`
  cuya ruta no sea una cadena fija (una plantilla o una variable no se pueden comprobar).
- El lienzo vive en `root.tsx` (persistente entre rutas). El viaje (`routes/journey/journey.tsx`) le escribe
  `mTarget` en `sceneStore` (`setScrollTarget`); el proyecto activo (`uiStore`, F4.4) y la atenuación de las fichas
  (F5) llegan después.

## Configuración y entorno

| Variable | Ejemplo | Uso |
|---|---|---|
| `VITE_SITE_URL` | `https://tortoisecode.dev` | URLs absolutas de canónica, hreflang, OG y sitemap |

- `.env.example` en el repo; `.env` fuera de git. No hay secretos en la v1.
- Validación al arrancar el build, el servidor de desarrollo y el preview (`vite.config.ts`): si `VITE_SITE_URL`
  falta o no es `https://`, falla con un mensaje claro. El cliente la lee en un solo sitio (`lib/env/site/site.ts`,
  `SITE_ORIGIN`); los tests fijan `https://cosmos.test` en `tests/setup.ts`.

## Gestión de errores

- `ErrorBoundary` raíz: con un 404 de ruta pinta la misma `NotFoundPage` (`features/errors/`, con su CSS en el
  archivo único de ADR-019) y la `meta` de la 404; con cualquier otro error, la página de error en el idioma
  activo (`error.*`), título `meta.error.title`, `noindex` y enlace al inicio con `<a>` (recarga completa, no
  `<Link>`). Lo prueba `src/root.test.tsx`; que la 404 hidratada no añada hojas de estilo, `seo.spec.ts`.
- Toda ruta exporta su `meta`: si no, heredaría la de reserva de `root.tsx` (la de la 404, con `noindex`).
  `src/root.test.tsx` lo comprueba para cada ruta de `routes.ts`.
- `ErrorBoundary` propio de la escena (aislado: un fallo 3D al montar o al renderizar con React nunca tumba la
  página; los del bucle de frames, `docs/04-escena/rendimiento.md` → «Robustez»).
- `CopyButton` y similares: siempre con alternativa (seleccionar texto) y mensaje.
- Nada de `catch` vacíos: todo error capturado se registra con contexto y sin datos personales (en desarrollo y
  producción) o se muestra al usuario si le afecta. `console.error` para los fallos; `console.warn` para las
  degradaciones previstas que la interfaz ya cubre (portapapeles que rechaza, `localStorage` bloqueado).
