# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** F1 terminada (etiqueta `v0.0.1`) · siguiente: ajustes de GitHub y **F2 · Cimientos sin 3D**.

_Última actualización: 2026-10-22 (**CIERRE DE SESIÓN · 1**) · F0 y F1 hechas: contexto, entorno, CI y web
publicada en Vercel con la página «hello» provisional._

**Hecho esta sesión:**
1. **F0:** espina dorsal (`CLAUDE.md` con Mapa, `STATE.md`, `DECISIONS.md` con ADR-001…012,
   `DEVELOPMENT_RULES.md`) y 7 incoherencias entre docs corregidas.
2. **F1:** andamiaje en la raíz con las versiones de `stack.md`: React Router 8 (`ssr: false`, pre-render de `/`
   y `/es`), TypeScript 6 estricto, ESLint 10 + `jsx-a11y-x` + reglas de capas, Prettier, Vitest con umbrales de
   cobertura, Playwright (3 navegadores + test sin JS), Husky + lint-staged, CI de GitHub Actions, `vercel.json`,
   validación de `VITE_SITE_URL` en el build.
3. PR #1, #2 y #3 fusionados; CI en verde en `main`; etiqueta `v0.0.1` en `ed74c69`.
4. Vercel en producción: `https://cosmos-portfolio-two.vercel.app` (comprobado: `/` en inglés, `/es` y `/es/`
   en español, favicon, 404 real con la página genérica de Vercel). Previews por PR funcionando.
5. ADR-013 (Node exacto en `.nvmrc`, `engines` 24.x) y ADR-014 (ESLint 10 + `jsx-a11y-x`; ESLint 9 sin soporte).
6. Repo `Tortoise-code-Z/Portfolio---Cosmos`: se mantiene ese nombre (el proyecto se llama `cosmos-portfolio`).
7. Regla nueva: Claude prepara siempre los PR (título + descripción) y los comandos de git.

**Incidencias y lecciones:**
- El `STATE.md` del primer commit era un borrador viejo (fallo de Claude al guardar); corregido en el PR #1.
- `cosmos-portfolio.vercel.app` era de otra persona: Vercel asignó `cosmos-portfolio-two`.
- Vercel: las variables `VITE_` no pueden ser «Sensitive» (son públicas) y deben existir también en **Preview**,
  o el build de los PR falla a propósito (`VITE_SITE_URL is missing`). Anotado en `git-y-despliegue.md`.
- Windows Defender bloqueaba Firefox y WebKit de Playwright: solución, excluir `%LOCALAPPDATA%\ms-playwright`.
  Anotado en `stack.md`.
- El E2E de CI se colgó 20 min descargando navegadores; se arregló cancelando y relanzando.
- Commit «.» en el PR #2: Claude cambió archivos después de dar los comandos de commit. Regla nueva en
  `DEVELOPMENT_RULES.md` §10.
- Los PR #1–#3 entraron como merge commit (no squash): no se reescribe la historia.

**Deuda anotada:**
- **JS inicial ~112 KB gzip** con la página «hello», frente al presupuesto de ≤ 120 KB (`calidad.md`). Vigilarlo
  desde el principio de F2; si no cabe, revisar el presupuesto con un ADR.
- CI sin límite de tiempo por trabajo (`timeout-minutes`): un cuelgue espera hasta 6 h.
- `@lhci/cli` y los scripts `visual` / `lhci` se instalan en F3/F6.
- Provisional: textos de la página «hello» y del `ErrorBoundary` raíz en las rutas (→ `src/content` en F2);
  `favicon.svg` (→ F6); 404 genérica de Vercel (→ nuestra página en F2, configuración en F7).

**Siguiente paso (próxima sesión):**
1. GitHub, Settings → General → Pull Requests: dejar **solo «Allow squash merging»** (por defecto, título del PR) y
   «Automatically delete head branches».
2. GitHub, Settings → Branches: proteger `main` (PR obligatorio sin aprobaciones, checks `Typecheck · lint ·
   format · tests`, `Build` y `E2E (Chromium · Firefox · WebKit)`, rama al día). Activar Dependabot alerts y
   security updates.
3. PR `ci/job-timeouts`: `timeout-minutes` en cada job de `ci.yml` (≈ 15).
4. **F2 · paso 1:** tokens (`src/styles/tokens.css`), `global.css` y fuentes autoalojadas
   (`docs/03-diseno/design-system.md`, `docs/05-tecnico/stack.md`), con esquema → Visto Bueno.

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7) · ¿cadena Taller/Mesa? (recomendada desde F3)
· Tareas de Víctor: confirmar curso de Hola Mundo terminado (F2), estrellas de IA como prácticas o herramientas
(F2/F4.3), script de consola en el README de Chessmate (F2), CV en PDF EN/ES.
**Limpieza manual del usuario:** ninguna. · **Bloqueos:** ninguno.
