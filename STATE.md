# Estado del proyecto

> Actualizado: 2026-10-22

## Fase actual
**F1 · Entorno (`env-init`)**, en curso. El andamiaje está escrito en la raíz y validado en un entorno Linux
con Node 24.22.0 (typecheck, lint, format, tests con cobertura, build y e2e en Chromium en verde). Falta la
verificación en Windows, el PR con CI y la preview de Vercel.

## Hecho
- **F0 cerrada:** documentación en `docs/`, espina dorsal (`CLAUDE.md` con Mapa, `STATE.md`, `DECISIONS.md`,
  `DEVELOPMENT_RULES.md`) y 7 incoherencias entre docs corregidas (2026-10-22):
  `SkillGroupId` con `'ai'` · `<SceneMount />` una sola vez en `root.tsx` · `sceneStore` en `src/stores/` ·
  `wdth` mínimo 50 · `hud.billionYears` ES en millones · `rel="noopener noreferrer"` · ES en `/es` con `projects`.
- **F1 paso 1:** `.gitattributes` (LF), `.gitignore`, `.nvmrc` (24.22.0), `.npmrc` (`engine-strict`, `save-exact`),
  `LICENSE` (MIT). Primer commit de docs en `main` y push a `Tortoise-code-Z/Portfolio---Cosmos` (lo ejecuta Víctor).
- **F1 pasos 2–8 (archivos listos):**
  - `package.json` con las versiones exactas de `stack.md` y `package-lock.json` generado con npm 11
    (incluye los binarios de Windows). `npm audit`: 0 vulnerabilidades.
  - React Router modo framework: `react-router.config.ts` (`appDirectory: src`, `ssr: false`,
    `prerender: ['/', '/es']`), `src/root.tsx`, `src/routes.ts`, `src/routes/journey.tsx` (página «hello»
    provisional), `public/favicon.svg` provisional.
  - `vite.config.ts`: alias `~/`, validación de `VITE_SITE_URL` en el build (`src/lib/env/siteUrl.ts`) y plugin
    de preview que sirve `/es` con `es/index.html`, como Vercel.
  - TypeScript estricto (`tsconfig.json`), ESLint plano con reglas de capas, Prettier, Vitest + Testing Library
    con umbrales de cobertura, Playwright (3 navegadores) con e2e de `/`, `/es` y sin JavaScript.
  - Husky (`pre-commit`: lint-staged · `pre-push`: typecheck + tests), CI (`.github/workflows/ci.yml`),
    `vercel.json` (estático, `build/client`), `.env.example`.
- ADR-013: `.nvmrc` exacto y `engines.node: "24.x"` (por Vercel). Docs de `05-tecnico` actualizados.
- ADR-014: ESLint 10.12.0 + `eslint-plugin-jsx-a11y-x` 0.2.0 (ESLint 9 quedó sin soporte). Docs actualizados.
- Verificado en Windows con Node 24.22.0 y ESLint 10: `npm ci`, `npm run check`, `npm run build` y `npm run e2e`
  (Chromium, Firefox y WebKit) en verde. Para Playwright hizo falta excluir `%LOCALAPPDATA%\ms-playwright` en
  Windows Defender.
- ✔ Verificado: `@fontsource-variable/anybody` → `standard.css` incluye `wdth` (`font-stretch: 50% 150%`;
  56 KB el subconjunto latino).

## Pendiente / siguiente paso
1. Víctor, en PowerShell: rama `chore/env-init`, `npm ci`, `Copy-Item .env.example .env`,
   `npx playwright install`, `npm run check`, `npm run build`, `npm run e2e`.
2. Commit, push y PR → CI en verde.
3. Vercel: importar el repo, `VITE_SITE_URL` por entorno; comprobar que la preview sirve `/` y `/es`
   (y que `/es` sin barra final muestra la página en español).
4. Fusionar (squash), proteger `main` (PR + CI obligatorios), activar avisos de seguridad de Dependabot y
   etiquetar `v0.0.1`. Con eso, F1 hecha → F2.
5. Decidir si se usa la cadena **Taller/Mesa** (recomendada a partir de F3).

## Deuda / incoherencias detectadas
- **JS inicial ya en ~112 KB gzip** con la página «hello» (React 19 + React Router 8), frente al presupuesto de
  ≤ 120 KB de `calidad.md`. Vigilarlo desde el principio de F2; si no cabe, revisar el presupuesto con un ADR.
- `@lhci/cli` y los scripts `visual` / `lhci` no se instalan hasta F3/F6 (ver `stack.md`).
- Provisional hasta F2: textos de la página «hello» y del `ErrorBoundary` raíz escritos en las rutas (no en
  `src/content`). Provisional hasta F6: `favicon.svg`.

## Bloqueos / dudas abiertas
- Cuando Vercel asigne el dominio del proyecto, poner esa URL en `VITE_SITE_URL` (Vercel, `.env.example`, CI y
  `arquitectura.md`); hoy figura `https://cosmos-portfolio.vercel.app` como provisional.
- **D2 · Dominio** propio o subdominio de Vercel (F7).
- **D5 · Analítica:** ninguna o una sin cookies (F7).
- Tareas de Víctor: confirmar curso de Hola Mundo terminado (F2) · estrellas de IA como prácticas o herramientas
  (F2/F4.3) · script de consola en el README de Chessmate (F2) · CV en PDF EN/ES.
- ⚠ Por verificar en Vercel: que `/es` (sin barra final) sirve `es/index.html` con `trailingSlash: false`.
- ⚠ Por verificar en F7: servir la 404 pre-renderizada con estado 404 real en Vercel.
