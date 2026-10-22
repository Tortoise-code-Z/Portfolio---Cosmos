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
│  │  ├─ seo/                   ← builders de meta, hreflang y JSON-LD
│  │  ├─ device/                ← señales para el nivel de rendimiento, useReducedMotion, usePointerType
│  │  └─ math/                  ← smoothstep, lerp, clamp, easing
│  ├─ stores/                   ← uiStore (React) · sceneStore (mutable, sin re-render)
│  ├─ styles/                   ← tokens.css, global.css, fonts.css
│  └─ assets/projects/<slug>/   ← capturas originales (vite-imagetools genera las variantes)
├─ public/                      ← favicon.svg, apple-touch-icon.png, robots.txt, og/, cv/
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
| `lib` | `content` (tipos) | React DOM de features, Three |
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

- El idioma se deriva de la ruta (no del navegador); `useLocale()` lo lee del `id` o del prefijo.
- `prerender` enumera todas las rutas a partir de `content/projects` (2 idiomas × (1 + nº de proyectos) + 404).
- Segmento `projects` igual en ambos idiomas (decisión: URLs estables y sin mapa de traducción de rutas).
- `meta` de cada ruta: título, descripción, canónica, `hreflang` en/es/x-default, Open Graph y JSON-LD
  (`Person` en la home, `CreativeWork` en cada proyecto). URL base desde `VITE_SITE_URL`.
- `sitemap.xml` generado en el build con las mismas rutas del `prerender`.

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
| `VITE_SITE_URL` | `https://cosmos-portfolio.vercel.app` | URLs absolutas de canónica, hreflang, OG y sitemap |

- `.env.example` en el repo; `.env` fuera de git. No hay secretos en la v1.
- Validación al arrancar el build: si `VITE_SITE_URL` falta o no es `https://`, el build falla con un mensaje claro.

## Gestión de errores

- `ErrorBoundary` raíz con página de error en el idioma activo y enlace al inicio.
- `ErrorBoundary` propio de la escena (aislado: un fallo 3D nunca tumba la página).
- `CopyButton` y similares: siempre con alternativa (seleccionar texto) y mensaje.
- Nada de `catch` vacíos: todo error capturado se registra con contexto (`console.error` en desarrollo y
  producción; sin datos personales) o se muestra al usuario si le afecta.
