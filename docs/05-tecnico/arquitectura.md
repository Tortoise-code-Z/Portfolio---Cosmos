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
│  ├─ root.tsx                  ← documento HTML, <html lang>, fuentes, meta comunes, ErrorBoundary raíz
│  ├─ entry.client.tsx          ← (si hace falta personalizar la hidratación)
│  ├─ routes.ts                 ← configuración de rutas EN/ES
│  ├─ routes/
│  │  ├─ journey.tsx            ← el viaje (home): monta los 5 capítulos
│  │  ├─ project.tsx            ← /projects/:slug
│  │  └─ not-found.tsx
│  ├─ content/                  ← datos tipados (docs/01-contenido)
│  ├─ features/                 ← piezas de interfaz con lógica propia
│  │  ├─ journey/               ← Hero, ChapterSection, ChapterPanel, About, Skills, Projects, Contact
│  │  ├─ navigation/            ← TopBar, ChapterRail, LanguageSwitch, QuickMissionDialog, SkipLink
│  │  ├─ hud/                   ← CosmicHud
│  │  └─ project/               ← ProjectHeader, FeatureGrid, StackGroups, Gallery, Lightbox, TryIt
│  ├─ scene/                    ← motor 3D (docs/04-escena), cargado en diferido
│  ├─ ui/                       ← componentes genéricos sin dominio: ButtonOutline, HoldButton, ActionLink,
│  │                              CopyButton, Notice, Icon, VisuallyHidden
│  ├─ lib/                      ← funciones puras y hooks transversales
│  │  ├─ i18n/                  ← tipos, useLocale, useT, formateadores Intl, rutas localizadas
│  │  ├─ scroll/                ← mapM (puro), useChapterLayout, useScrollTarget
│  │  ├─ seo/                   ← builders puros: URL canónicas, lista de páginas, meta, hreflang, JSON-LD,
│  │  │                           sitemap y robots (reciben origen y datos por parámetro, ADR-017)
│  │  ├─ device/                ← señales para el nivel de rendimiento, useReducedMotion, usePointerType
│  │  └─ math/                  ← smoothstep, lerp, clamp, easing
│  ├─ stores/                   ← uiStore (React) · sceneStore (mutable, sin re-render)
│  ├─ styles/                   ← tokens.css, global.css, fonts.css
│  └─ assets/projects/<slug>/   ← capturas originales (vite-imagetools genera las variantes)
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

## Capas y reglas de dependencia

```
content  ◄── lib ◄── stores ◄── ui ◄── features ◄── routes
                         ▲                 │
                         └──── scene ◄─────┘ (solo a través de un import dinámico)
```

| Capa | Puede importar | No puede importar |
|---|---|---|
| `content` | nada (solo sus tipos) | React, Three, cualquier otra capa |
| `lib` | `content/types` (tipos y constantes de idioma) y `content/texts` (para `useT`) (ADR-017) | Los datos de `content` (perfil, proyectos, skills: le llegan por parámetro), React DOM de features, Three |
| `stores` | `lib`, `content` | `features`, `scene` |
| `ui` | `lib` | `features`, `scene`, `content` (recibe datos por props) |
| `features` | `ui`, `lib`, `stores`, `content` | `three`, `@react-three/*`, `scene` (salvo el punto de montaje diferido) |
| `scene` | `lib`, `stores`, `content` (solo ids y orden) | `features`, `ui` |
| `routes` | todo lo anterior | — |

Se hacen cumplir con `no-restricted-imports` de ESLint por carpeta: un import prohibido rompe el lint.

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
- Una sola lista de páginas, `sitePages(projects)` (`lib/seo/pages.ts`): de ella salen el `prerender`, el sitemap
  y el `hreflang`. Se pre-renderizan 2 idiomas × (1 + nº de proyectos) páginas y la 404 de cada idioma
  (`/404` y `/es/404`, servidas por la ruta `*`).
- Slug desconocido (también en mayúsculas: `/projects/Chessmate`): la ruta de proyecto pinta la **misma página
  404** (`NotFoundPage`) y su `meta` es la de la 404; no lanza error. Así el HTML coincide con el `404.html` y
  hidrata sin errores de consola. Son 404 sin redirección: slug desconocido, `/projects` sin slug, `/en/…`.
- `react-router.config.ts` **no** resuelve el alias `~/`: lo que importa (contenido, `lib/seo/{pages,urls,sitemap}`,
  `lib/i18n/paths`, `lib/env/siteUrl`) usa imports relativos. Si alguien lo cambia, el build falla al cargar la
  config. Su `buildEnd` escribe `sitemap.xml`, `robots.txt` y `404.html` (copia de la 404 EN) en `build/client`.
- Segmento `projects` igual en ambos idiomas (decisión: URLs estables y sin mapa de traducción de rutas).
- `meta` de cada ruta (`lib/seo/meta.ts`): título, descripción (en proyectos, el `summary`), canónica propia de
  cada idioma, `hreflang` en/es/x-default (= EN), Open Graph (`og:locale` `en_US`/`es_ES` con su alternativa,
  `og:type` `website` o `article`, sin `og:image` hasta que haya imágenes: entonces `cover` o, si es `null`, la
  del sitio de su idioma), `twitter:card` y JSON-LD (`Person` en la home, sin email; `SoftwareSourceCode` en cada
  proyecto, con el autor embebido). URL base desde `VITE_SITE_URL`.
- Forma única de las URL absolutas (`absoluteUrl`): origen + ruta, sin barra final salvo la home EN
  (`https://…/`, `https://…/es`, `https://…/projects/chessmate`), sin `?` ni `#`. Un test comprueba que
  canónicas, `hreflang`, `og:url` y sitemap son el mismo conjunto.
- 404: `noindex`, sin canónica, `hreflang` ni JSON-LD, fuera del sitemap.
- `sitemap.xml` (solo `<loc>`) y `robots.txt` (`Allow: /` + `Sitemap:` absoluto) generados en el build.

## Estado

| Store | Qué guarda | Quién lo lee |
|---|---|---|
| `uiStore` (Zustand) | modo misión rápida abierto, grupo de skills activo, proyecto activo, aviso de idioma descartado, nivel de rendimiento, escena disponible | Componentes React (selectores finos) |
| `sceneStore` (Zustand *vanilla*, mutable) | `mTarget`, `m`, carga, puntero, peso de capítulos, flags de pausa | `useFrame` y el HUD por `getState()`/suscripción, **sin re-render** |

Regla: nada que cambie en cada frame pasa por estado de React.

## Puente scroll → escena

1. `useChapterLayout` mide `offsetTop`/`offsetHeight` de los capítulos (ResizeObserver + `document.fonts.ready`).
2. Un único listener de scroll pasivo calcula `mTarget = mapM(scrollY, layout)` y lo escribe en `sceneStore`.
3. `useFrame` suaviza `m`, actualiza uniforms, cámara y etiquetas.
4. El HUD y el raíl se suscriben a cambios de `round(m)` y del texto del reloj (cambios discretos, no por frame).

## Carga de la escena

- `root.tsx` renderiza **una sola vez** `<SceneMount />` (fuera de `<Outlet />`), que en cliente hace
  `lazy(() => import('~/scene/SceneRoot'))` tras la hidratación y cuando el navegador está libre.
  Las rutas **no** montan la escena: así el lienzo no se recrea al navegar.
- `SceneRoot` comprueba WebGL2, elige nivel, lanza el worker y monta el `<Canvas>`. Envuelto en un
  `ErrorBoundary` que, ante cualquier fallo, marca `no-gl` y desmonta.
- El lienzo vive en `root.tsx` (persistente entre rutas); `routes/journey.tsx` y `routes/project.tsx` le
  comunican su estado (viaje, proyecto activo, atenuación) vía `sceneStore`.

## Configuración y entorno

| Variable | Ejemplo | Uso |
|---|---|---|
| `VITE_SITE_URL` | `https://cosmos-portfolio-two.vercel.app` | URLs absolutas de canónica, hreflang, OG y sitemap |

- `.env.example` en el repo; `.env` fuera de git. No hay secretos en la v1.
- Validación al arrancar el build, el servidor de desarrollo y el preview (`vite.config.ts`): si `VITE_SITE_URL`
  falta o no es `https://`, falla con un mensaje claro. El cliente la lee en un solo sitio (`lib/env/site.ts`,
  `SITE_ORIGIN`); los tests fijan `https://cosmos.test` en `tests/setup.ts`.

## Gestión de errores

- `ErrorBoundary` raíz con página de error en el idioma activo (`error.*`, o `notFound.*` si es un 404), su título
  por la `meta` de `root.tsx` y enlace al inicio.
- `ErrorBoundary` propio de la escena (aislado: un fallo 3D nunca tumba la página).
- `CopyButton` y similares: siempre con alternativa (seleccionar texto) y mensaje.
- Nada de `catch` vacíos: todo error capturado se registra con contexto (`console.error` en desarrollo y
  producción; sin datos personales) o se muestra al usuario si le afecta.
