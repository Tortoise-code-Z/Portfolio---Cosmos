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
│  │  │                           navegación) y `shared.module.css` (piezas de texto comunes)
│  │  ├─ navigation/            ← TopBar, ChapterRail, LanguageSwitch, SkipLink, goToChapter (salto con
│  │  │                           ancla en la URL), AvailabilityChip, QuickMissionDialog y
│  │  │                           QuickMissionContent, `quickMission.ts` (suelto: ancla `#quick` e id del
│  │  │                           botón que lo abre) y LanguageNotice (sugerencia de idioma)
│  │  ├─ hud/                   ← CosmicHud y cosmicClock (reloj y escala, puros)
│  │  ├─ project/               ← ProjectPage (la página), ProjectHeader, ProjectSection, ProjectStack,
│  │  │                           ProjectNote, ProjectTryIt, ProjectGallery, ProjectPager y `neighbours`
│  │  │                           (proyecto anterior y siguiente, puro)
│  │  └─ errors/                ← NotFoundPage (la 404 del idioma; la usan las rutas y `root.tsx`)
│  ├─ scene/                    ← motor 3D (docs/04-escena), cargado en diferido
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
│  │  │                           jumpToChapter (scroll + foco al título + ancla)
│  │  ├─ seo/                   ← builders puros: URL canónicas, lista de páginas, meta, hreflang, JSON-LD,
│  │  │                           sitemap y robots (reciben origen y datos por parámetro, ADR-017)
│  │  ├─ device/                ← señales del dispositivo: reducedMotion (prefersReducedMotion, jumpBehavior);
│  │  │                           después nivel de rendimiento y usePointerType
│  │  ├─ hold/                  ← carga de «mantén pulsado»: charge (puro) y useHoldCharge (rAF + variable CSS)
│  │  ├─ css/                   ← cx (unir clases) y useHeightVar (altura de un elemento como variable CSS)
│  │  └─ math/                  ← clamp, smoothstep, lerp (después, easing)
│  ├─ stores/                   ← uiStore (React) · sceneStore (mutable, sin re-render)
│  ├─ styles/                   ← tokens.css, global.css, fonts.css
│  └─ assets/projects/<slug>/   ← capturas originales `NN-<nombre>.png` (vite-imagetools genera las variantes
│                                  con los presets `?project` y `?share` de vite.config.ts; ADR-023)
├─ public/                      ← favicon.svg, apple-touch-icon.png, og/, cv/ (robots.txt y sitemap.xml
│                                  se generan en el build)
├─ tests/
│  ├─ e2e/                      ← Playwright: recorridos
│  └─ visual/                   ← Playwright: capturas por capítulo y tamaño
├─ docs/                        ← esta documentación
├─ .github/workflows/ci.yml
└─ (configs) react-router.config.ts · vite.config.ts · vitest.config.ts · playwright.config.ts ·
             eslint.config.js · .prettierrc · tsconfig.json · .nvmrc · .gitattributes · .env.example · lighthouserc.json
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

| Capa | Puede importar | No puede importar |
|---|---|---|
| `content` | nada salvo sus tipos y, en `projects/media.ts`, las capturas de `src/assets/` (ADR-023) | React, Three, cualquier otra capa |
| `lib` | `content/types` (tipos y constantes de idioma) y `content/texts` (para `useT`) (ADR-017) | Los datos de `content` (perfil, proyectos, skills: le llegan por parámetro), `stores`, `ui`, `features`, `scene`, `routes`, Three |
| `stores` | `lib`, `content` | `features`, `scene` |
| `ui` | `lib` | `features`, `scene`, `content` (recibe datos por props) |
| `features` | `ui`, `lib`, `stores`, `content` | `three`, `@react-three/*`, `scene` (salvo el punto de montaje diferido) |
| `scene` | `lib`, `stores`, `content` (solo ids y orden) | `features`, `ui` |
| `routes` | todo lo anterior | — |

Se hacen cumplir con `no-restricted-imports` de ESLint por carpeta: un import prohibido rompe el lint.

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
| `uiStore` (Zustand, `useUiStore`) | modo misión rápida abierto (`quickMissionOpen`, desde F2.6); último proyecto visto (`visitedProject`, desde F2.7: lo apunta la página de proyecto y el capítulo Proyectos lo recoge una vez, con `takeVisitedProject`, para dejar el foco en su fila); después, grupo de skills activo, proyecto activo (el que se resalta por puntero o foco en su fila, o por su pin: sincroniza filas y placas, F4.4), nivel de rendimiento, escena disponible | Componentes React (selectores finos); desde F3, la escena (pausa con el modo abierto); desde F5, la placa visitada |
| `sceneStore` (Zustand *vanilla*, mutable) | `mTarget`, `m` (desde F2.5; sin escena, `m = mTarget`), y desde F3 carga, puntero, peso de capítulos, flags de pausa | `useFrame` y el HUD por `getState()`/suscripción, **sin re-render**; el raíl y el idioma eligen `selectActiveChapter` (solo se repintan al cambiar de capítulo) |

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
3. `useFrame` suaviza `m`, actualiza uniforms, cámara y etiquetas (F3). Hasta entonces, y sin WebGL, `m = mTarget`.
4. El raíl y el idioma eligen `round(m)` (`selectActiveChapter`); el HUD se suscribe y solo toca el DOM cuando
   cambia su texto (cambios discretos, no por frame).

## Carga de la escena

- `root.tsx` renderiza **una sola vez** `<SceneMount />` (fuera de `<Outlet />`), que en cliente hace
  `lazy(() => import('~/scene/SceneRoot'))` tras la hidratación y cuando el navegador está libre.
  Las rutas **no** montan la escena: así el lienzo no se recrea al navegar.
- `SceneRoot` comprueba WebGL2, elige nivel, lanza el worker y monta el `<Canvas>`. Envuelto en un
  `ErrorBoundary` que, ante cualquier fallo, marca `no-gl` y desmonta.
- El lienzo vive en `root.tsx` (persistente entre rutas); `routes/journey/journey.tsx` y `routes/project/project.tsx` le
  comunican su estado (viaje, proyecto activo, atenuación) vía `sceneStore`.

## Configuración y entorno

| Variable | Ejemplo | Uso |
|---|---|---|
| `VITE_SITE_URL` | `https://cosmos-portfolio-two.vercel.app` | URLs absolutas de canónica, hreflang, OG y sitemap |

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
- `ErrorBoundary` propio de la escena (aislado: un fallo 3D nunca tumba la página).
- `CopyButton` y similares: siempre con alternativa (seleccionar texto) y mensaje.
- Nada de `catch` vacíos: todo error capturado se registra con contexto y sin datos personales (en desarrollo y
  producción) o se muestra al usuario si le afecta. `console.error` para los fallos; `console.warn` para las
  degradaciones previstas que la interfaz ya cubre (portapapeles que rechaza, `localStorage` bloqueado).
