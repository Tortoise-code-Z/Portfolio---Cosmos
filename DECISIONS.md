# Decisiones (ADR)

> Registro de decisiones de arquitectura. Manda sobre cualquier documento de `docs/` si chocan.
> Una decisión aceptada no se edita: si cambia, se escribe un ADR nuevo que la sustituye y se marca la antigua
> como «Sustituida por ADR-NNN».
> Origen de ADR-001 a ADR-012: tabla «Decisiones de partida» de `docs/05-tecnico/README.md`.

## Plantilla

```
## ADR-NNN · Título
- Estado: Propuesta | Aceptada | Sustituida por ADR-NNN
- Fecha: AAAA-MM-DD
- Contexto: qué problema o fuerza obliga a decidir.
- Decisión: qué se hace.
- Alternativas descartadas: cuáles y por qué.
- Consecuencias: qué se gana, qué se paga, qué hay que vigilar.
- Detalle: dónde vive la especificación.
```

---

## ADR-001 · Vite + React + TypeScript con React Router en modo framework, `ssr: false` + pre-renderizado
- Estado: Aceptada
- Fecha: 2026-10-22
- Contexto: sitio sin backend que necesita SEO, LCP rápido y una URL propia por proyecto e idioma, y que debe
  leerse sin JavaScript ni WebGL (P1).
- Decisión: React Router en modo framework con `ssr: false` y `prerender`, que genera un HTML completo por ruta
  e idioma en el build; React hidrata en cliente y la escena 3D se carga después.
- Alternativas descartadas: Next.js (más peso y un servidor que no necesitamos); SPA sin pre-renderizado (SEO y
  LCP peores).
- Consecuencias: hosting estático en Vercel y coste 0 €. Las rutas a pre-renderizar se enumeran desde
  `content/projects`. El 404 real requiere configuración del hosting (⚠ por verificar en F7).
- Detalle: `docs/05-tecnico/arquitectura.md`, `docs/05-tecnico/stack.md`.

## ADR-002 · React Three Fiber sin drei, con shaders GLSL propios
- Estado: Aceptada
- Fecha: 2026-10-22
- Contexto: la escena es un único sistema de partículas con shaders a medida; necesita convivir con React sin
  arrastrar dependencias grandes.
- Decisión: `@react-three/fiber` sobre `three`; shaders en archivos `.glsl` importados con `?raw`; las utilidades
  que daría drei se escriben a mano (~100 líneas).
- Alternativas descartadas: Three.js imperativo (peor integración con React); `@react-three/drei` (dependencia
  grande para poco uso).
- Consecuencias: control total del chunk de la escena (≤ 250 KB gzip). Restricción de versiones: Fiber 9.8
  exige React < 19.4.
- Detalle: `docs/04-escena/README.md`, `docs/04-escena/particulas-y-shaders.md`.

## ADR-003 · Un único sistema de partículas con morph en el shader
- Estado: Aceptada
- Fecha: 2026-10-22
- Contexto: cinco escenas (singularidad, nebulosa, galaxia, tortuga, Tierra) encadenadas por el scroll sin cortes.
- Decisión: un solo `THREE.Points` con todas las formas como atributos (`position`, `pGal`, `pTur`, `pEar`, `aR`);
  el shader de vértices mezcla la forma actual y la siguiente según `m`.
- Alternativas descartadas: un objeto por escena (más memoria y cortes entre escenas).
- Consecuencias: transición en GPU sin crear ni destruir objetos; ~3,8 MB para 60.000 partículas. Todas las formas
  usan el mismo `count`. Constelaciones y estrellas de fondo van aparte.
- Detalle: `docs/04-escena/particulas-y-shaders.md`, `docs/04-escena/formas.md`.

## ADR-004 · Zustand para el estado de UI y un store mutable para la escena
- Estado: Aceptada
- Fecha: 2026-10-22
- Contexto: hay estado de interfaz (React) y estado que cambia en cada frame (`m`, puntero, carga).
- Decisión: `uiStore` (Zustand con selectores finos) y `sceneStore` (Zustand *vanilla*, mutable) que `useFrame` y
  el HUD leen sin re-render. Regla: nada que cambie en cada frame pasa por estado de React.
- Alternativas descartadas: Context (re-renders); Redux (exceso).
- Consecuencias: rendimiento estable; hay que disciplinar el acceso al store mutable (lectura por `getState()` o
  suscripción, sin asignaciones por frame).
- Detalle: `docs/05-tecnico/arquitectura.md` → «Estado» y «Puente scroll → escena».

## ADR-005 · CSS Modules + tokens CSS
- Estado: Aceptada
- Fecha: 2026-10-22
- Contexto: interfaz «instrumental» con efectos a medida (corchetes, velos, ejes tipográficos variables).
- Decisión: CSS Modules por componente y tokens como variables CSS en `src/styles/tokens.css`. Ningún componente
  usa un color, tamaño o duración literal.
- Alternativas descartadas: Tailwind (los efectos a medida acabarían fuera del sistema).
- Consecuencias: cero dependencias de estilos; los tokens del design system son la única fuente.
- Detalle: `docs/03-diseno/design-system.md`.

## ADR-006 · i18n propio con diccionarios tipados; EN sin prefijo, ES en `/es`
- Estado: Aceptada
- Fecha: 2026-10-22
- Contexto: sitio bilingüe con EN como idioma principal, indexable en los dos idiomas.
- Decisión: diccionarios TypeScript `src/content/texts/en.ts` y `es.ts` (objeto `uiTexts`) con **claves planas**
  (`'project.stack.core'`) y las mismas claves y huecos `{x}` en los dos (`UiKey` sale de `en.ts`; `es` se tipa con
  él y lo comprueba además un test). La carpeta no se llama `ui/` porque chocaría con la capa `ui` en las reglas de
  importación de ESLint (patrón `**/ui/**`). Actualizado en F2 · paso 2 (AUD-F2-2-3);
  idioma derivado de la ruta; EN en `/`, ES en `/es`; `hreflang` en/es/x-default. Sin redirección automática:
  sugerencia descartable «¿Ver en español?». Segmento `projects` igual en los dos idiomas.
- Alternativas descartadas: react-i18next (dependencia innecesaria); redirección automática por idioma del
  navegador (mala para el SEO y molesta).
- Consecuencias: tipado total de las claves; cifras con `Intl` según idioma.
- Detalle: `docs/02-experiencia/navegacion.md`, `docs/05-tecnico/arquitectura.md`, `docs/01-contenido/textos-sitio.md`.

## ADR-007 · Solo tema oscuro
- Estado: Sustituida por ADR-015
- Fecha: 2026-10-22
- Contexto: el sitio es un único mundo visual (el espacio); la escena es lo único con color y brillo.
- Decisión: `color-scheme: dark` en `:root`, fondo explícito y todos los colores como tokens. Sin tema claro.
- Alternativas descartadas: tema claro (rompe el mundo visual).
- Consecuencias: un solo juego de tokens que mantener; el contraste AA se garantiza sobre el velo de los paneles.
- Detalle: `docs/03-diseno/design-system.md` → «Tema» y «Color».

## ADR-008 · TypeScript 6.0.3 y ESLint 9.39.5 en lugar de las últimas mayores
- Estado: Aceptada para TypeScript · la parte de ESLint, sustituida por ADR-014
- Fecha: 2026-10-22
- Contexto: TypeScript 7 y ESLint 10 ya existen, pero el ecosistema de lint que exige el proyecto no los soporta.
- Decisión: fijar TypeScript 6.0.3 y ESLint 9.39.5.
- Alternativas descartadas: TS 7 (`typescript-eslint` 8.71 exige TS < 6.1); ESLint 10 (`eslint-plugin-jsx-a11y`
  6.10.2 solo declara hasta ESLint 9, y la accesibilidad es prioritaria).
- Consecuencias: revisar en cada actualización trimestral; migración en el backlog posterior a la v1.
- Detalle: `docs/05-tecnico/stack.md` → «Conflictos conocidos y vigilancia».

## ADR-009 · Node 24.22.0 LTS
- Estado: Aceptada
- Fecha: 2026-10-22
- Contexto: Node 24 es la LTS activa hoy; Node 26 pasa a LTS el 28-10-2026.
- Decisión: Node 24.22.0, fijado en `.nvmrc`, `engines.node` y `engine-strict=true` en `.npmrc`.
- Alternativas descartadas: Node 26 (LTS demasiado reciente al empezar; se evalúa tras la v1).
- Consecuencias: ADR de migración a Node 26 después de la v1.
- Detalle: `docs/05-tecnico/stack.md`, `docs/05-tecnico/git-y-despliegue.md`.

## ADR-010 · Capturas de regresión visual en Docker (imagen oficial de Playwright)
- Estado: Aceptada
- Fecha: 2026-10-22
- Contexto: el render difiere entre Windows (local) y Linux (CI); las capturas deben ser comparables.
- Decisión: `npm run visual` / `visual:update` y el job de CI corren en `mcr.microsoft.com/playwright:v1.64.0-noble`.
- Alternativas descartadas: generar capturas en cada máquina (difieren entre Windows y Linux).
- Consecuencias: Docker Desktop con WSL 2 en local. `@playwright/test` y la imagen se suben siempre juntos.
- Detalle: `docs/05-tecnico/calidad.md`, `docs/05-tecnico/git-y-despliegue.md`, `docs/05-tecnico/stack.md`.

## ADR-011 · Universo determinista (PRNG con semilla)
- Estado: Aceptada
- Fecha: 2026-10-22
- Contexto: tests de generadores y capturas de regresión necesitan resultados reproducibles.
- Decisión: todos los generadores usan `mulberry32` con una semilla fija del proyecto; prohibido `Math.random` en
  la escena.
- Alternativas descartadas: `Math.random` (tests y capturas inestables).
- Consecuencias: el universo es idéntico en cada visita; test «misma semilla → mismo resultado byte a byte».
- Detalle: `docs/04-escena/formas.md`, `docs/04-escena/README.md`.

## ADR-012 · Repo público con licencia MIT para el código
- Estado: Aceptada
- Fecha: 2026-10-22
- Contexto: el código es parte del escaparate (P6): un tech lead lo va a mirar.
- Decisión: `Tortoise-code-Z/cosmos-portfolio` público; MIT para el código; textos, imágenes y CV con todos los
  derechos reservados (indicado en el README).
- Alternativas descartadas: repo privado (pierde valor de escaparate).
- Consecuencias: nada de secretos en el repo (no hay ninguno en la v1); historial y commits cuidados.
- Nota (2026-10-22): el repo se creó como `Tortoise-code-Z/Portfolio---Cosmos` y se mantiene ese nombre; el
  proyecto sigue llamándose `cosmos-portfolio`. La decisión (público + MIT) no cambia.
- Detalle: `docs/05-tecnico/git-y-despliegue.md`.

## ADR-013 · Node exacto en `.nvmrc` y `engines.node: "24.x"`
- Estado: Aceptada
- Fecha: 2026-10-22
- Contexto: `stack.md` pedía `engines.node: "24.22.0"` con `engine-strict=true`. Local y CI leen `.nvmrc`, pero
  Vercel solo deja elegir la versión mayor y decide el parche: con la versión exacta en `engines`, `npm ci`
  fallaría en cada despliegue en cuanto su parche no coincidiera.
- Decisión: `.nvmrc` = `24.22.0` es la fuente de la versión exacta (local y CI con `node-version-file`);
  `engines.node` = `24.x` con `engine-strict=true`, que sigue bloqueando Node 22 o 26 por error.
- Alternativas descartadas: `engines` exacto (rompe Vercel); quitar `engine-strict` (se pierde la protección).
- Consecuencias: Vercel puede construir con otro parche de Node 24; el riesgo es bajo dentro de una LTS.
  Si algún día importa, se revisa con la configuración de Node de Vercel.
- Detalle: `docs/05-tecnico/stack.md`, `docs/05-tecnico/git-y-despliegue.md`.

## ADR-014 · ESLint 10 con `eslint-plugin-jsx-a11y-x` (sustituye la parte de ESLint del ADR-008)
- Estado: Aceptada
- Fecha: 2026-10-22
- Contexto: al instalar en Windows, npm avisó de que ESLint 9.39.5 ya no tiene soporte (la rama 9 salió de
  mantenimiento). Seguíamos en la 9 solo por `eslint-plugin-jsx-a11y`, que no soporta ESLint 10 y no publica
  desde octubre de 2024. `DEVELOPMENT_RULES.md` prohíbe dependencias obsoletas.
- Decisión: `eslint` 10.12.0, `@eslint/js` 10.0.1 y `eslint-plugin-jsx-a11y-x` 0.2.0 (fork mantenido por
  es-tooling) con su config `strict`. TypeScript sigue en 6.0.3 (ADR-008).
- Alternativas descartadas: seguir en ESLint 9 con el aviso (herramienta sin parches); quitar las reglas de
  accesibilidad (P5 · accesible de serie).
- Consecuencias: probado antes de aplicarlo: `npm run check` en verde, `npm audit` 0 y las reglas detectan
  errores reales. El fork conserva todas las reglas salvo tres ya obsoletas (`accessible-emoji`,
  `label-has-for`, `no-onchange`). Riesgo: menos adopción que el original; se vigila en la revisión trimestral.
- Detalle: `docs/05-tecnico/stack.md`, `docs/05-tecnico/calidad.md`.

## ADR-015 · Solo tema oscuro: meta `color-scheme` y contraste por test (sustituye ADR-007)
- Estado: Aceptada
- Fecha: 2026-10-22
- Contexto: ADR-007 (F0) decidió el tema único oscuro; este ADR lo concreta al implementarlo en F2 · paso 1
  (cómo se declara y cómo se garantiza el contraste) y lo sustituye (auditoría AUD-F2-1-1). El sitio es un único
  mundo visual (el espacio): la escena es lo único con color y brillo y la interfaz es un panel de instrumento
  sobre fondo negro.
- Decisión: un solo tema oscuro. `color-scheme: dark` en `:root` y en `<meta name="color-scheme">`, fondo
  explícito `--color-void` en `:root` y `body`, y todos los colores como tokens en `src/styles/tokens.css`.
  No se lee `prefers-color-scheme`.
- Alternativas descartadas: tema claro opcional (rompe el concepto, duplica la paleta y obliga a validar el
  contraste de la escena dos veces).
- Consecuencias: un único juego de colores que mantener y probar. El contraste AA tiene dos garantías: sobre el
  fondo `--color-void`, la de los colores de texto la comprueba un test (`src/styles/styles.test.ts`); sobre el
  velo de los paneles (`--color-veil`) encima de la escena, que es el peor caso real de lectura, se comprueba
  cuando exista la escena (F3–F4). Quien prefiera tema claro ve el oscuro.
- Detalle: `docs/03-diseno/design-system.md`.

## ADR-016 · Navegadores soportados: las dos últimas versiones de cada motor
- Estado: Aceptada
- Fecha: 2026-10-22
- Contexto: no estaba escrito en ningún doc (auditoría AUD-F2-1-P2), y hace falta un criterio para usar CSS
  moderno: la sintaxis de rango de `@media (width < 520px)` (Safari ≥ 16.4), `[popover]`, `text-wrap`, `svh`.
- Decisión: se soportan las **dos últimas versiones estables** de cada motor: Chromium (Chrome, Edge), Firefox y
  WebKit (Safari en macOS e iOS). Lo que entienden esas versiones se usa sin alternativa; lo demás, solo como
  mejora progresiva. No se fijan `build.target` ni *browserslist* propios.
- Alternativas descartadas: `build.target` y *browserslist* explícitos (más configuración sin un caso que la
  pida); soportar versiones antiguas (renunciar a la sintaxis moderna por un público que no es el del sitio).
- Consecuencias: el CI ya prueba los tres motores (Playwright). Fuera de ese rango la web puede verse peor, pero
  el contenido sigue legible (HTML pre-renderizado, P1). Se revisa en la actualización trimestral de `stack.md`.
- Detalle: `docs/05-tecnico/stack.md` → «Navegadores soportados».

## ADR-017 · `lib` importa de `content` solo sus tipos y los textos; los datos le llegan por parámetro
- Estado: Aceptada
- Fecha: 2026-10-23
- Contexto: la tabla de capas decía «`lib` → `content` (tipos)», pero `useT` (en `lib/i18n`) necesita el valor
  `uiTexts` y los builders de SEO necesitan perfil y proyectos. ESLint no lo vigilaba (solo bloqueaba otras capas).
  Estudio EST-F2-3-2 y auditoría AUD-F2-2-P1.
- Decisión: `lib` puede importar de `content` **`content/types`** (tipos y las constantes `DEFAULT_LOCALE` y
  `LOCALES`) y **`content/texts`** (diccionarios de `useT`), y nada más. Los builders de `lib/seo` son funciones
  puras que reciben el origen y los datos (`profile`, `project`, `skillGroups`) por parámetro; se los pasan las
  rutas y `react-router.config.ts`. Una regla de `no-restricted-imports` en `src/lib/**` lo hace cumplir (también
  con rutas relativas). Los módulos que carga `react-router.config.ts` usan imports relativos, porque ahí no existe
  el alias `~/`.
- Alternativas descartadas: que `lib` importe cualquier dato de `content` (acopla las utilidades al contenido real
  y obliga a probarlas con él); que `lib` solo importe tipos y `root.tsx` pase el diccionario por un contexto (un
  contexto solo para esquivar la regla).
- Consecuencias: los tests de `lib/seo` usan datos de mentira (`lib/seo/fixtures.ts`) y el contenido real se
  prueba en el e2e sobre el build (`tests/e2e/seo.spec.ts`). Los dos diccionarios (EN y ES) van en el JS inicial
  (~3,4 KB gzip con `translate`).
- Detalle: `docs/05-tecnico/arquitectura.md` → «Capas y reglas de dependencia» y «Rutas e idiomas»;
  `eslint.config.js`.

## ADR-018 · Archivos con el mismo nombre, juntos en su carpeta
- Estado: Aceptada
- Fecha: 2026-10-23
- Contexto: cada módulo de `lib`, `content` y `routes` tiene su test al lado (`meta.ts` + `meta.test.ts`). Con
  los componentes llegarán más archivos por pieza (`Button.tsx`, `Button.test.tsx`, `Button.module.css`) y las
  carpetas mezclan parejas sueltas. Víctor lo pide como regla (viva S5 #8).
- Decisión: si dos o más archivos de la misma carpeta comparten el nombre base (lo que va antes del primer punto),
  van en una carpeta con ese nombre y conservan el suyo: `lib/seo/meta/meta.ts` + `lib/seo/meta/meta.test.ts`.
  Sin `index.ts`: se importa la ruta completa (`~/lib/seo/meta/meta`). Vale para `src/` y `tests/`; un archivo
  sin pareja se queda suelto y los docs no entran. Se migró todo lo existente (18 parejas). `src/structure.test.ts`
  falla si vuelve a haber una pareja suelta. **Excepción** (añadida el 2026-10-23, al corregir AUD-F2-3):
  `src/root.tsx`, cuyo nombre y sitio fija React Router, lleva su test al lado (`src/root.test.tsx`); nada más
  puede formar pareja con él.
- Alternativas descartadas: `index.ts` en cada carpeta (imports más cortos, pero un archivo más por carpeta, dos
  formas de importar lo mismo y saltos de «ir a la definición» al barril); aplicarla solo a lo nuevo (dos estilos
  en el repo).
- Consecuencias: los imports repiten el nombre (`meta/meta`). Al crear el segundo archivo de un nombre, primero se
  mueve el que había a su carpeta. Las rutas de `routes.ts` apuntan a `routes/<ruta>/<ruta>.tsx`; los tipos
  `./+types/<ruta>` siguen funcionando porque `typegen` copia la estructura.
- Detalle: `docs/05-tecnico/arquitectura.md` → «Estructura del repositorio»; `DEVELOPMENT_RULES.md` §5.
