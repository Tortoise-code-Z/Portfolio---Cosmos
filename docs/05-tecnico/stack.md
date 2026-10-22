# Stack tecnológico

> Versiones **exactas** verificadas en el registro de npm el **22-10-2026**. Criterio: la última versión
> estable con **al menos dos semanas publicada** (evita estrenar parches del día) y compatible con el resto.
> En `package.json` van **sin rangos** (`"react": "19.3.0"`, nunca `^19.3.0`) y se instala con `npm ci`.
> Antes de añadir o subir una dependencia: esquema → Visto Bueno → actualizar esta tabla.

## Entorno

| Pieza | Versión | Motivo | Windows 11 |
|---|---|---|---|
| Node.js | **24.22.0** (LTS «Krypton», en soporte activo) | LTS vigente hoy. Node 26 pasa a LTS el 28-10-2026: se evaluará subir tras la v1 (ADR propio) | Instalador oficial x64 o `fnm`; se fija en `.nvmrc` y en `engines` |
| npm | el incluido en Node 24.22.0 | Sin gestores extra: menos piezas | ✔ |
| Git | ≥ 2.45 (Git for Windows) | Control de versiones; Husky usa sus hooks | ✔ con `core.autocrlf=false` y `.gitattributes` |
| Docker Desktop | estable vigente | Solo para generar capturas de regresión visual idénticas a CI | ✔ con WSL 2 |

## Aplicación

| Paquete | Versión | Motivo |
|---|---|---|
| `react` · `react-dom` | 19.3.0 | Base de la interfaz |
| `react-router` | 8.4.0 | Rutas y **pre-renderizado estático** por ruta (modo framework con `ssr: false` + `prerender`) |
| `@react-router/dev` | 8.4.0 | Plugin de Vite y CLI del modo framework (build, typegen) |
| `@react-router/node` | 8.4.0 | Requerido por el build del pre-renderizado |
| `isbot` | 5.2.2 | Dependencia del entry de servidor que genera el framework |
| `three` | 0.186.1 | Motor WebGL |
| `@react-three/fiber` | 9.8.1 | Three.js declarativo en React (requiere React < 19.4) |
| `zustand` | 5.0.15 | Store de interfaz y store mutable de la escena (lectura sin re-render en `useFrame`) |
| `@fontsource-variable/anybody` | 5.3.0 | Fuente display autoalojada (usar `standard.css`, que incluye `wdth` y `wght` ⚠ verificar en env-init) |
| `@fontsource-variable/geologica` | 5.3.0 | Fuente de texto autoalojada |
| `@fontsource/ibm-plex-mono` | 5.3.0 | Fuente monoespaciada (solo 400 y 500, subconjunto latino) |

**Lo que no se usa, a propósito:** `@react-three/drei` (lo que necesitamos son ~100 líneas propias),
GSAP y Lenis (el scroll lo resuelve un hook propio), librerías de i18n (diccionarios tipados propios),
`vite-plugin-glsl` (los shaders se importan con `?raw`), Tailwind (decidido CSS Modules).

## Build y assets

| Paquete | Versión | Motivo |
|---|---|---|
| `vite` | 8.3.4 | Bundler (Rolldown) y servidor de desarrollo |
| `typescript` | **6.0.3** | Tipado estricto. **No 7.x**: `typescript-eslint` aún no lo soporta (pide `< 6.1`) |
| `vite-imagetools` | 12.0.1 | AVIF/WebP y `srcset` en build (usa `sharp`, con binarios para win32-x64) |
| `@types/react` · `@types/react-dom` | 19.3.0 | Tipos |
| `@types/three` | 0.186.0 | Tipos de Three.js |
| `@types/node` | 24.19.2 | Tipos alineados con Node 24 |

## Calidad

| Paquete | Versión | Motivo |
|---|---|---|
| `eslint` · `@eslint/js` | **9.39.5** | Linter. **No 10.x**: `eslint-plugin-jsx-a11y` aún no soporta ESLint 10 y la accesibilidad es prioritaria |
| `typescript-eslint` | 8.71.1 | Reglas de TypeScript con información de tipos |
| `eslint-plugin-react-hooks` | 7.1.1 | Reglas de hooks |
| `eslint-plugin-jsx-a11y` | 6.10.2 | Reglas de accesibilidad en JSX |
| `globals` | 17.13.0 | Globales de navegador y Node para la config plana |
| `prettier` | 3.9.9 | Formato |
| `eslint-config-prettier` | 10.1.8 | Desactiva reglas de ESLint que chocan con Prettier |
| `husky` | 9.1.7 | Hooks de git |
| `lint-staged` | 17.6.0 | Lint y formato solo de lo que se commitea |

## Tests

| Paquete | Versión | Motivo |
|---|---|---|
| `vitest` · `@vitest/coverage-v8` | 5.0.3 | Tests unitarios y de componentes, cobertura |
| `@vitejs/plugin-react` | 6.1.2 | Transformación JSX en la config de Vitest (la app usa el plugin de React Router) |
| `jsdom` | 30.1.2 | DOM para los tests de componentes |
| `@testing-library/react` | 16.3.3 | Tests centrados en el usuario |
| `@testing-library/dom` | 10.4.2 | Peer obligatorio de la anterior |
| `@testing-library/jest-dom` | 7.0.1 | Matchers de DOM |
| `@testing-library/user-event` | 14.6.7 | Interacciones realistas |
| `@playwright/test` | 1.64.0 | Extremo a extremo y regresión visual |
| `@lhci/cli` | 0.15.1 | Lighthouse CI con presupuestos |

## Conflictos conocidos y vigilancia

| Tema | Situación | Acción |
|---|---|---|
| TypeScript 7 | `typescript-eslint` 8.71 exige TS < 6.1 | Quedarse en 6.0.3; revisar en cada actualización trimestral |
| ESLint 10 | `eslint-plugin-jsx-a11y` 6.10.2 solo declara hasta ESLint 9 | Quedarse en 9.39.5 hasta que lo soporte |
| React 19.4 | `@react-three/fiber` 9.8 declara React < 19.4 | No subir React por encima de 19.3.x sin subir Fiber |
| Node 26 LTS (28-10-2026) | Todas las piezas declaran soporte para Node ≥ 22/24 | ADR de migración tras la v1 |
| `@playwright/test` ↔ imagen Docker | La imagen debe ser **la misma versión** (`mcr.microsoft.com/playwright:v1.64.0-noble`) | Subirlas siempre juntas |
| Finales de línea en Windows | Prettier usa LF; Git for Windows convierte a CRLF por defecto | `.gitattributes` con `* text=auto eol=lf` desde el primer commit |

## Política de actualización

- Revisión **trimestral** (o ante un aviso de seguridad de `npm audit`): una rama `chore/deps-AAAA-MM`, subir por
  grupos (app, build, calidad, tests), CI en verde y actualizar esta tabla.
- Nunca `npm update` a ciegas ni versiones con rango.
