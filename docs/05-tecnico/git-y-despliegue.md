# Git, CI y despliegue

## Repositorio

- GitHub: `Tortoise-code-Z/Portfolio---Cosmos`, **público** (el código también es escaparate).
- Licencia: MIT para el código; textos, imágenes y CV con todos los derechos reservados (indicado en el README).
- README en inglés: qué es, capturas, stack, arquitectura resumida, cómo ejecutarlo, enlace a `docs/`.

## Ramas y commits

- `main` siempre desplegable y protegida: solo entra por PR con CI en verde, **salvo los commits de solo
  documentación** (ADR-033, abajo).
- Protección de `main` (regla clásica en Settings → Branches): PR obligatorio sin aprobaciones (trabajo en
  solitario), rama al día y checks obligatorios `Typecheck · lint · format · tests`, `Build` y
  `E2E (Chromium · Firefox · WebKit)` (el job que resume los tres navegadores; ADR-024) y, desde F3.6,
  `Visual regression` (las capturas de `calidad.md` → «Regresión visual»). Los cuatro, marcados en la regla desde
  la sesión 24 (antes la regla no tenía ninguno marcado). Un job nuevo solo aparece en el buscador de la regla
  tras ejecutarse una vez: se marca cuando su primer PR lo muestra en verde, antes de fusionar. El admin puede
  saltársela en una emergencia. ⚠ Los checks se identifican
  por el `name` del job: si se renombra un job en `ci.yml`, hay que actualizar la regla o los PR se quedan
  esperando un check que ya no existe.
- Ajustes de PR: solo «squash merging» (mensaje por defecto: título del PR), «Always suggest updating pull
  request branches» y borrado automático de la rama remota al fusionar.
- Ramas cortas por tarea: `feat/…`, `fix/…`, `chore/…`, `docs/…`, `test/…`, `refactor/…`.
- **Conventional Commits** (`feat(scene): add turtle shape generator`), en inglés, pequeños y atómicos.
- Fusión **squash** (un commit por PR en `main`); el título del PR sigue el formato convencional.
- **Commits de solo documentación, directos a `main` (ADR-033).** Un commit que solo toca archivos `.md` fuera de
  `src/`, `tests/` y `public/` (`STATE.md`, `DECISIONS.md`, las reglas, `CLAUDE.md`, `docs/**`) se sube con
  `git push` a `main`, sin rama ni PR. Si lleva cualquier otra cosa, va por PR.
  - Uno por push, con mensaje `docs: …`, después de `npm run check` (los tests leen los docs:
    `src/code-references.test.ts`).
  - Antes del push, `git pull --rebase`: un merge en el push lo para el guardián.
  - Solo desde el equipo de Víctor, con los hooks instalados (`npm ci`). **Nunca** `git push --no-verify` ni
    `HUSKY=0`, ni el editor web de GitHub: sin el pre-push no hay guardián.
  - La regla de `main` deja pasar el push porque Víctor es admin (GitHub lo avisa como una regla saltada).
  - Cada push a `main` deja desactualizados los PR abiertos: con «rama al día», hay que actualizarlos y su CI vuelve
    a correr.
  - El criterio es uno, `scripts/docsOnly.ts`, y se prueba a mano con `node scripts/docs-only.ts <base> <head>`
    (el árbol final, como el CI y Vercel) o con `--each` (cada commit, como el pre-push): sale con 0 si son solo
    docs y dice el motivo.
- Etiquetas por versión: `v0.1.0` (F2, el sitio sin escena)… `v1.0.0` (lanzamiento); la de cada fase (si la lleva:
  la fase C no, ADR-034), en `docs/06-roadmap/roadmap.md`. Al cerrar una fase con versión: un PR sube `version` en
  `package.json`, después la auditoría
  de cierre de fase y sus correcciones, y la etiqueta va sobre el último commit de ese cierre en `main` (desde
  F3: así la versión etiquetada ya está auditada; `v0.1.0` se etiquetó antes y sus correcciones fueron `v0.1.1`).
- Nunca se commitean `.env`, `node_modules`, `build/`, informes de cobertura ni capturas temporales.

## Hooks locales (Husky + lint-staged)

- `pre-commit`: `react-router typegen` y después `lint-staged` (ESLint `--fix` y Prettier sobre lo que está en el
  *stage*). Sin los tipos de las rutas, ESLint rechaza las rutas nuevas.
- `pre-push`: primero el guardián de `main` (ADR-033): si el push va a `main`, `node scripts/docs-only.ts --each`
  con el hash remoto y el local; lo para si algún commit toca algo que no sea doc, si hay un merge o si el remoto no
  es antecesor del local (historia reescrita, o `main` avanzó en GitHub: `git pull --rebase`). Después,
  `npm run typecheck && npm test`.
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
changes  (¿push a main de solo docs? → code=false; en los PR, siempre code=true)
install (npm ci)
  ├─ typecheck
  ├─ lint + format:check
  ├─ test:coverage  (umbrales de calidad.md)
  ├─ npm audit --omit=dev --audit-level=high  (aviso: no para el CI)
  └─ build ─┬─ e2e · chromium ─┐  (build, e2e y visual: solo con code≠false)  (contenedor mcr.microsoft.com/playwright:v1.64.0-noble;
            ├─ e2e · firefox  ─┼─ E2E (Chromium · Firefox · WebKit)   un job por navegador, ADR-024)
            ├─ e2e · webkit   ─┘
            ├─ visual         ─── Visual regression  (el mismo contenedor)
            └─ lhci (presupuestos, F6)
```

- El job `Build` guarda la caché de `vite-imagetools` (`node_modules/.cache/imagetools`, `actions/cache@v6`) con
  una clave de las capturas, `vite.config.ts` y el lockfile: sin ella, generar las variantes de las imágenes cuesta
  alrededor de un minuto más (ADR-023). Vercel no la tiene: cada despliegue las genera.
- **Push de solo docs (ADR-033):** el job `Changes` compara `before` con `after` (`node scripts/docs-only.ts`). Si
  solo cambian docs, Build, E2E y Visual se saltan y `quality` corre igual (los tests leen los docs). Si no puede
  comparar, cuenta como código; si el propio job falla, Build corre (`!cancelled()`) y E2E y Visual también, con
  Build en verde. En los PR no se mira: corre todo.
- **Concurrencia:** en los PR, un push nuevo cancela el run anterior de la rama; en `main`, un grupo por commit y
  ningún run se cancela (un push de docs no puede sustituir al run completo del merge de antes).
- Los e2e corren en la imagen oficial de Playwright, que ya trae los navegadores, un job por navegador en
  paralelo (`fail-fast: false`); el job `E2E (Chromium · Firefox · WebKit)` solo comprueba que los tres
  pasaron, o que se saltaron en un push de solo docs (`code=false`; saltados por cualquier otra cosa, sale en
  rojo). En el CI, Playwright hace un reintento y corta a los 10 min (`globalTimeout`) para que el informe
  se suba antes del `timeout-minutes` del job (ADR-024).
- Los informes de Playwright (uno por navegador: `playwright-report-<navegador>`; el de las capturas,
  `playwright-report-visual`, con la referencia, la captura y la diferencia) y Lighthouse se suben como
  artefactos cuando algo falla.
- Cada job lleva `timeout-minutes: 15` (el que resume los e2e y `Changes`, 5): un cuelgue falla en 15 min en lugar de
  esperar las 6 h por defecto de GitHub.
- Dependabot solo para seguridad: *alerts*, *security updates* y *grouped security updates* activados;
  *version updates* desactivado, porque las subidas de versión siguen la política de `stack.md`.

## Despliegue (Vercel)

- Proyecto de Vercel conectado al repo: **preview por PR** y producción al fusionar en `main`. Salvo con solo docs
  (ADR-033): el `ignoreCommand` de `vercel.json` compara el último despliegue correcto de esa rama
  (`VERCEL_GIT_PREVIOUS_SHA`) con `HEAD` y, si solo cambian docs, no despliega (tampoco la preview de un PR). Si no
  puede comparar (primer despliegue de una rama, un despliegue anterior más allá de los 10 commits del clon de
  Vercel), despliega. El registro del despliegue dice el motivo (`[docs-only] …`). `DECISIONS.md` sí entra en el
  build (cuenta sus ADR para Mission control, ADR-035), pero sigue siendo doc: un ADR que llega en un commit de solo
  docs se ve en el sitio con el siguiente despliegue de código.
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
- Dominio: **`https://tortoisecode.dev`** (comprado en Vercel; ADR-025). El apex es el canónico:
  `www.tortoisecode.dev` y el subdominio de Vercel del proyecto (`cosmos-portfolio-two.vercel.app`) redirigen a
  él con 308. `VITE_SITE_URL` vale `https://tortoisecode.dev` en Production y en Preview (las previews apuntan su
  canónica al sitio real; su `noindex` se comprueba en F7).
- Cambiar de dominio, en este orden: (1) `VITE_SITE_URL` en Vercel, (2) fusionar el PR que lo cambia en el repo
  (`.env.example`, `ci.yml`, enlaces del contenido), (3) la redirección 308 del dominio viejo, (4) comprobar en
  producción la canónica, `sitemap.xml` y `robots.txt`. Si se fusiona antes de cambiar la variable, producción
  sale con las canónicas al dominio viejo.
- Vercel aplica un cambio de variable **solo a los despliegues nuevos**: si se guarda cuando el build del merge
  ya ha empezado (pasó con `tortoisecode.dev`), hay que hacer **Redeploy** del último despliegue de producción,
  sin la caché del build, y volver a comprobar. El redeploy también pasa por el `ignoreCommand`: el del último
  despliegue *Ready* construye (compara un commit consigo mismo: «nothing changed» cuenta como código); el de un
  push de docs cancelado se vuelve a cancelar, así que para ese hay que desmarcar *Use project's Ignore Build Step*.

## Seguridad

- Sin secretos en la v1. Si aparecen (por ejemplo, una API key de la NASA en el futuro), solo en variables de
  entorno de Vercel, nunca en el cliente si son privadas.
- `npm audit` en CI (aviso: `npm audit --omit=dev --audit-level=high` con `continue-on-error`, en el job `quality`)
  y antes de cada versión (bloqueante si hay vulnerabilidades altas en producción).
- Enlaces externos con `rel="noopener noreferrer"`.
