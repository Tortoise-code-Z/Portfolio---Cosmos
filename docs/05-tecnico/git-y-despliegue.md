# Git, CI y despliegue

## Repositorio

- GitHub: `Tortoise-code-Z/cosmos-portfolio`, **público** (el código también es escaparate).
- Licencia: MIT para el código; textos, imágenes y CV con todos los derechos reservados (indicado en el README).
- README en inglés: qué es, capturas, stack, arquitectura resumida, cómo ejecutarlo, enlace a `docs/`.

## Ramas y commits

- `main` siempre desplegable y protegida: solo entra por PR con CI en verde.
- Ramas cortas por tarea: `feat/…`, `fix/…`, `chore/…`, `docs/…`, `test/…`, `refactor/…`.
- **Conventional Commits** (`feat(scene): add turtle shape generator`), en inglés, pequeños y atómicos.
- Fusión **squash** (un commit por PR en `main`); el título del PR sigue el formato convencional.
- Etiquetas por versión: `v0.1.0` (fase 1)… `v1.0.0` (lanzamiento).
- Nunca se commitean `.env`, `node_modules`, `build/`, informes de cobertura ni capturas temporales.

## Hooks locales (Husky + lint-staged)

- `pre-commit`: `lint-staged` (ESLint `--fix` y Prettier sobre lo que está en el *stage*).
- `pre-push`: `npm run typecheck && npm test`.
- Funcionan en Windows con Git for Windows (Husky 9 no necesita configuración extra).

## Archivos de base desde el primer commit

- `.gitattributes`: `* text=auto eol=lf` (y binarios marcados) → sin conflictos CRLF en Windows.
- `.gitignore`: `node_modules/`, `build/`, `.react-router/`, `coverage/`, `playwright-report/`, `test-results/`,
  `.lighthouseci/`, `.env`, `*.local`.
- `.nvmrc`: `24.22.0` · `engines.node` en `package.json`: `"24.22.0"` con `engine-strict=true` en `.npmrc`.

## CI (GitHub Actions · `.github/workflows/ci.yml`)

En cada PR y push a `main`, en `ubuntu-latest` con Node de `.nvmrc` y caché de npm:

```
install (npm ci)
  ├─ typecheck
  ├─ lint + format:check
  ├─ test:coverage  (umbrales de calidad.md)
  └─ build ─┬─ e2e (Playwright: chromium, firefox, webkit)
            ├─ visual (contenedor mcr.microsoft.com/playwright:v1.64.0-noble)
            └─ lhci (presupuestos)
```

- Los informes de Playwright y Lighthouse se suben como artefactos cuando algo falla.
- Dependabot semanal solo para avisos de seguridad (las subidas de versión siguen la política de `stack.md`).

## Despliegue (Vercel)

- Proyecto de Vercel conectado al repo: **preview por PR** y producción al fusionar en `main`.
- Salida estática del pre-renderizado (`build/client`). `VITE_SITE_URL` configurada en Vercel por entorno.
- Cabeceras: caché larga e inmutable para `/assets/*`; `Content-Security-Policy` sin `unsafe-eval`;
  `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy` restrictiva.
- 404 real: la página `not-found` pre-renderizada se sirve con estado 404 (⚠ verificar la configuración exacta
  al preparar el despliegue).
- Dominio: subdominio de Vercel hasta resolver D2 (dominio propio).

## Seguridad

- Sin secretos en la v1. Si aparecen (por ejemplo, una API key de la NASA en el futuro), solo en variables de
  entorno de Vercel, nunca en el cliente si son privadas.
- `npm audit` en CI (aviso) y antes de cada versión (bloqueante si hay vulnerabilidades altas en producción).
- Enlaces externos con `rel="noopener noreferrer"`.
