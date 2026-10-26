# Git, CI y despliegue

## Repositorio

- GitHub: `Tortoise-code-Z/Portfolio---Cosmos`, **público** (el código también es escaparate).
- Licencia: MIT para el código; textos, imágenes y CV con todos los derechos reservados (indicado en el README).
- README en inglés: qué es, capturas, stack, arquitectura resumida, cómo ejecutarlo, enlace a `docs/`.

## Ramas y commits

- `main` siempre desplegable y protegida: solo entra por PR con CI en verde.
- Protección de `main` (regla clásica en Settings → Branches): PR obligatorio sin aprobaciones (trabajo en
  solitario), rama al día y checks obligatorios `Typecheck · lint · format · tests`, `Build` y
  `E2E (Chromium · Firefox · WebKit)`. El admin puede saltársela en una emergencia. ⚠ Los checks se identifican
  por el `name` del job: si se renombra un job en `ci.yml`, hay que actualizar la regla o los PR se quedan
  esperando un check que ya no existe.
- Ajustes de PR: solo «squash merging» (mensaje por defecto: título del PR), «Always suggest updating pull
  request branches» y borrado automático de la rama remota al fusionar.
- Ramas cortas por tarea: `feat/…`, `fix/…`, `chore/…`, `docs/…`, `test/…`, `refactor/…`.
- **Conventional Commits** (`feat(scene): add turtle shape generator`), en inglés, pequeños y atómicos.
- Fusión **squash** (un commit por PR en `main`); el título del PR sigue el formato convencional.
- Etiquetas por versión: `v0.1.0` (F2, el sitio sin escena)… `v1.0.0` (lanzamiento); la de cada fase, en
  `docs/06-roadmap/roadmap.md`. La etiqueta va sobre el commit de `main` que sube `version` en `package.json`.
- Nunca se commitean `.env`, `node_modules`, `build/`, informes de cobertura ni capturas temporales.

## Hooks locales (Husky + lint-staged)

- `pre-commit`: `react-router typegen` y después `lint-staged` (ESLint `--fix` y Prettier sobre lo que está en el
  *stage*). Sin los tipos de las rutas, ESLint rechaza las rutas nuevas.
- `pre-push`: `npm run typecheck && npm test`.
- Funcionan en Windows con Git for Windows (Husky 9 no necesita configuración extra).

## Archivos de base desde el primer commit

- `.gitattributes`: `* text=auto eol=lf` (y binarios marcados) → sin conflictos CRLF en Windows.
- `.gitignore`: `node_modules/`, `build/`, `.react-router/`, `coverage/`, `playwright-report/`, `test-results/`,
  `.lighthouseci/`, `.env`, `*.local`.
- `.nvmrc`: `24.22.0` (fuente de la versión exacta en local y CI) · `engines.node` en `package.json`: `"24.x"`
  (Vercel solo fija la mayor; ADR-013) · `.npmrc`: `engine-strict=true` y `save-exact=true`.

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

- El job `Build` guarda la caché de `vite-imagetools` (`node_modules/.cache/imagetools`, `actions/cache@v6`) con
  una clave de las capturas, `vite.config.ts` y el lockfile: sin ella, generar las variantes de las imágenes cuesta
  alrededor de un minuto más (ADR-023). Vercel no la tiene: cada despliegue las genera.
- Los informes de Playwright y Lighthouse se suben como artefactos cuando algo falla.
- Cada job lleva `timeout-minutes: 15`: un cuelgue (como la descarga de navegadores de Playwright) falla en
  15 min en lugar de esperar las 6 h por defecto de GitHub.
- Dependabot solo para seguridad: *alerts*, *security updates* y *grouped security updates* activados;
  *version updates* desactivado, porque las subidas de versión siguen la política de `stack.md`.

## Despliegue (Vercel)

- Proyecto de Vercel conectado al repo: **preview por PR** y producción al fusionar en `main`.
- Salida estática del pre-renderizado (`build/client`). `VITE_SITE_URL` configurada en Vercel por entorno.
- Cabeceras: caché larga e inmutable para `/assets/*`; `Content-Security-Policy` sin `unsafe-eval`;
  `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy` restrictiva.
- 404 por idioma: el build deja `404.html` (EN, la que Vercel sirve para cualquier ruta sin archivo) y
  `es/404/index.html` (ES). En F7: que `/es/*` reciba la ES y que las dos salgan con estado 404 real (⚠
  verificar la configuración exacta de Vercel; si no se puede, plan B: una sola 404 EN también en cliente).
- `robots.txt` y `sitemap.xml` los genera el build con `VITE_SITE_URL`: no hay copia estática en `public/`. Las
  previews de Vercel suelen llevar `X-Robots-Tag: noindex` automático (⚠ comprobar con `curl -I`).
- Variables en Vercel: `VITE_SITE_URL` en **Production, Preview y Development**, con «Sensitive» **apagado**
  (las variables `VITE_` acaban en el cliente y Vercel no deja marcarlas como secretas). Sin ella en Preview, el
  build de los PR falla a propósito.
- Dominio: `https://cosmos-portfolio-two.vercel.app` (subdominio de Vercel; `cosmos-portfolio` ya estaba cogido)
  hasta resolver D2 (dominio propio).

## Seguridad

- Sin secretos en la v1. Si aparecen (por ejemplo, una API key de la NASA en el futuro), solo en variables de
  entorno de Vercel, nunca en el cliente si son privadas.
- `npm audit` en CI (aviso) y antes de cada versión (bloqueante si hay vulnerabilidades altas en producción).
- Enlaces externos con `rel="noopener noreferrer"`.
