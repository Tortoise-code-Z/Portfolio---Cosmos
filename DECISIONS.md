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
- Estado: Aceptada · quién lee qué lo matizan ADR-027 y ADR-028: el ratón no va en `sceneStore` (lo escribe
  `scene/pointer` en el `SceneFrame`) y `useFrame` no lee el store (lo lee el bucle de la escena)
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
  importación de ESLint (patrón `**/ui/**`). Actualizado en F2 · paso 2 (tras su auditoría);
  idioma derivado de la ruta; EN en `/`, ES en `/es`; `hreflang` en/es/x-default. Sin redirección automática:
  sugerencia descartable en el idioma que ofrece (textos en `textos-sitio.md` → `langNotice.*`; comportamiento en
  `navegacion.md` → «Idioma»). Segmento `projects` igual en los dos idiomas.
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
  - Desde F3.6: `scripts/visual.ts` (en Node, porque en Windows npm lanza los scripts con `cmd`) toma la versión
    de la imagen de `package.json` e instala dentro con un volumen propio para `node_modules`; las referencias, sin
    el sistema en el nombre. Las capturas se hacen con movimiento reducido: la escena queda quieta sin reloj falso,
    a cambio de no vigilar lo que solo se ve en movimiento. Un check propio, `Visual regression`, obligatorio en
    `main`. Subir Playwright obliga a rehacer las capturas.
- Detalle: `docs/05-tecnico/calidad.md`, `docs/05-tecnico/git-y-despliegue.md`, `docs/05-tecnico/stack.md`.

## ADR-011 · Universo determinista (PRNG con semilla)
- Estado: Aceptada
- Fecha: 2026-10-22
- Contexto: tests de generadores y capturas de regresión necesitan resultados reproducibles.
- Decisión: todos los generadores usan `mulberry32` con una semilla fija del proyecto; prohibido `Math.random` en
  la escena.
- Alternativas descartadas: `Math.random` (tests y capturas inestables).
- Consecuencias: el universo es idéntico en cada visita; test «misma semilla → mismo resultado byte a byte».
- Nota (2026-10-26, F3.2): cada parte de la escena (`nebula`, `galaxy`, `turtle`, `earth`, `rand`) usa su
  **subsemilla** (`subSeed(SCENE_SEED, nombre)`), así que retocar una forma no mueve las demás. «Byte a byte» se
  promete **en el mismo motor de JavaScript** (Node/V8 en Vitest, Chromium en las capturas), no entre motores:
  `Math.sin` y `Math.pow` pueden diferir en el último bit. Una huella fija por matriz en los tests obliga a que
  un cambio de aspecto sea a propósito. ESLint prohíbe `Math.random` en `src/scene/**`.
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
  (cómo se declara y cómo se garantiza el contraste) y lo sustituye (lo pidió la auditoría del paso). El sitio es un único
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
- Contexto: no estaba escrito en ningún doc (lo preguntó la auditoría de F2 · paso 1), y hace falta un criterio para usar CSS
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
  Salió en la auditoría de F2 · paso 2 y en el estudio de F2 · paso 3.
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
  carpetas mezclan parejas sueltas. Víctor lo pide como regla.
- Decisión: si dos o más archivos de la misma carpeta comparten el nombre base (lo que va antes del primer punto),
  van en una carpeta con ese nombre y conservan el suyo: `lib/seo/meta/meta.ts` + `lib/seo/meta/meta.test.ts`.
  Sin `index.ts`: se importa la ruta completa (`~/lib/seo/meta/meta`). Vale para `src/` y `tests/`; un archivo
  sin pareja se queda suelto y los docs no entran. Se migró todo lo existente (18 parejas). `src/structure.test.ts`
  falla si vuelve a haber una pareja suelta y, desde el 2026-10-24, también si un archivo está solo en una carpeta
  con su nombre (va suelto). **Excepción** (añadida el 2026-10-23, al corregir la auditoría de F2 · paso 3):
  `src/root.tsx`, cuyo nombre y sitio fija React Router, lleva su test al lado (`src/root.test.tsx`); nada más
  puede formar pareja con él.
- Alternativas descartadas: `index.ts` en cada carpeta (imports más cortos, pero un archivo más por carpeta, dos
  formas de importar lo mismo y saltos de «ir a la definición» al barril); aplicarla solo a lo nuevo (dos estilos
  en el repo).
- Consecuencias: los imports repiten el nombre (`meta/meta`). Al crear el segundo archivo de un nombre, primero se
  mueve el que había a su carpeta. Las rutas de `routes.ts` apuntan a `routes/<ruta>/<ruta>.tsx`; los tipos
  `./+types/<ruta>` siguen funcionando porque `typegen` copia la estructura.
- Detalle: `docs/05-tecnico/arquitectura.md` → «Estructura del repositorio»; `DEVELOPMENT_RULES.md` §5.

## ADR-019 · Todo el CSS en un solo archivo (`build.cssCodeSplit: false`)
- Estado: Aceptada
- Fecha: 2026-10-23
- Contexto: al dar CSS propio a la ruta del viaje (F2 · paso 4), `/ES` empezó a dar el error de hidratación
  React #418. Vercel entrega para `/ES` el HTML de la 404 (una hoja de estilo), pero en el navegador React Router
  casa la ruta `journey-es` (no distingue mayúsculas) y `<Links>` añade al `<head>` la hoja de esa ruta, que no
  estaba en el HTML. Pasaría igual con `/projects/<slug-desconocido>` en cuanto la página de proyecto tenga CSS
  (era un riesgo anotado para F2.7). Víctor elige un solo CSS para todo el sitio.
- Decisión: Vite emite **un único archivo CSS** para todo el sitio (`build: { cssCodeSplit: false }` en
  `vite.config.ts`), que enlaza la raíz. Todas las páginas llevan la misma lista de hojas, así que el `<head>` del
  HTML servido coincide siempre con el que pinta el cliente, sea cual sea la ruta que case. El código no cambia:
  cada componente sigue con su CSS Module y los tokens siguen en `tokens.css` (ADR-005). El JS sigue dividido por
  ruta.
- Alternativas descartadas: no hidratar la 404 (queda estática, pero pierde la escena de nebulosa que pide
  `estados-y-accesibilidad.md` y obliga a un `entry.client.tsx`); redirigir mayúsculas a minúsculas (contradice
  «404 sin redirección» de `arquitectura.md` y no arregla el slug desconocido); importar los mismos estilos en la
  ruta de la 404 (frágil: vuelve a romperse con cada ruta nueva con CSS).
- Consecuencias: con el 4c, 9,7 KB (≈ 3 KB gzip); al final de F2 se estiman 6–8 KB gzip, de los que la home baja
  2–3 KB que no usa (≈ 15 ms en 4G lento). A cambio, una petición menos, CSS en caché para todas las páginas y
  ningún salto sin estilos al navegar. Revisar si el CSS total pasa de ~50 KB gzip. Lo vigila el e2e
  `design-system.spec.ts` (todas las páginas enlazan la misma hoja única) y el de la 404 de `/ES` (0 errores).
- Detalle: `docs/05-tecnico/arquitectura.md` → «Rutas e idiomas».

## ADR-020 · Presupuesto de JS inicial: framework y código propio por página
- Estado: Aceptada
- Fecha: 2026-10-23
- Contexto: el presupuesto único de ≤ 120 KB gzip de JS inicial ya no cabía con la home maquetada (126 KB en
  F2 · paso 4) y la página de proyecto estaba por encima desde F2.3 (~123 KB). React 19 + React Router 8 ocupan
  ~107 KB que no dependen de nosotros: el límite medía sobre todo el framework y dejaba ~10 KB para el sitio.
  Víctor elige un ADR que separe las dos partes en vez de un `loader` en el build.
- Decisión: dos límites, medidos por `tests/e2e/budgets.spec.ts` sobre el build en todas sus páginas HTML (los
  dos idiomas): **framework ≤ 112 KB** (las dependencias del JS inicial, que el grupo `framework` de
  `vite.config.ts` junta en un chunk; medido 107,3 KB) y **código propio ≤ 35 KB por página** (todo lo demás que
  pide su HTML; medido home 17,4 KB, proyecto 12,6 KB, 404 7,0 KB). Las dependencias de la escena (Three.js, R3F)
  no son del JS inicial: van en su chunk diferido (ADR-002). El chunk se llama `entry.client-*` porque la entrada
  por defecto de React Router vive en `node_modules` y el grupo la absorbe; con una entrada propia en `src/` se
  llamaría `framework-*`, y el test acepta los dos nombres.
- Alternativas descartadas: `loader` en el build para sacar los datos del JS (los bytes llegarían igual, como
  datos, y las features dejarían de importar el contenido: cambia la tabla de capas, `arquitectura.md` → «Capas
  y reglas de dependencia»); subir el límite
  único a 130 KB (seguiría midiendo sobre todo el framework y avisaría tarde de lo nuestro).
- Consecuencias: el límite del framework salta con una subida de versión que lo engorde (se revisa entonces, con
  `stack.md`); el del código propio, con lo que añadamos. El margen de la home cubre lo que falta de F2
  (navegación, misión rápida). Si una dependencia nueva sale del chunk `entry.client`, el test lo nota (exige un
  único chunk de framework y su peso cuenta como código propio). Los dos diccionarios de textos (EN y ES) siguen
  en el JS inicial (ADR-017): si el código propio aprieta, es lo primero que se puede partir por idioma. **Trampa
  para F3.1:** hoy el `test` del grupo es todo `node_modules`; cuando la escena importe `three` y
  `@react-three/*` en diferido, el grupo los arrastraría al chunk inicial. En F3.1 el `test` debe excluirlos
  (`/node_modules[\\/](?!three[\\/]|@react-three[\\/])/`); el presupuesto saltaría si no, pero mejor no llegar ahí.
  **Hecho en F3.1, de otra forma:** el grupo `framework` captura solo las dependencias que una entrada importa
  de forma estática (`tags: ['$initial']` de Rolldown) y un grupo `scene` recoge las demás. La regex habría
  dejado fuera Three.js y React Three Fiber, pero no lo que estos arrastran (`react-reconciler`, `its-fine`,
  `suspend-react`…), que habría acabado en el JS inicial. El framework se quedó en 108,9 KB; el JS de la
  escena (241,6 KB) tiene su propio presupuesto y su test. El grupo `scene` es el **resto de dependencias
  diferidas**, no solo la escena: un `import()` nuevo de otra librería necesita su propio grupo, o esa
  librería acabaría junto a Three.js y quien la cargara descargaría la escena (también sin WebGL2). Lo vigila
  `budgets.spec.ts`: solo `SceneRoot` puede importar el chunk `scene`.
- Detalle: `docs/05-tecnico/calidad.md` → «Presupuestos».

## ADR-021 · Interfaz fija sin escena: `m` sin suavizar y lectura bajo una barra de altura fija
- Estado: Aceptada · la consecuencia «la escena dejará de escribir `m`» la sustituye ADR-028
- Fecha: 2026-10-23
- Contexto: F2 · paso 5 conecta el scroll con el raíl, el HUD y la barra superior antes de que exista la escena
  (F3), que es quien suaviza `m` por frame. La barra es fija y tapa la parte de arriba de la ventana: un ancla
  (`/#projects`) dejaba el capítulo debajo de ella, y si `m` se midiera desde el borde de la ventana más la
  barra, arriba del todo ya no sería 0 (el reloj saldría de la singularidad sin hacer scroll).
- Decisión: (1) sin escena, `sceneStore` guarda `m = mTarget` tal cual: los únicos que lo leen (raíl, HUD,
  idioma) cambian a saltos. (2) La barra tiene **altura fija** (`--topbar-h`, 64 px) en vez de medirse con JS; el
  documento la deja libre arriba con `scroll-padding-block-start`, así anclas y foco nunca quedan debajo.
  (3) `mapM` compara `scrollY` con los capítulos pasados a posiciones de scroll (`toScrollLayout`: cada uno empieza
  en `max(0, inicio − barra)`): un ancla da el índice exacto de su capítulo y la parte de arriba sigue siendo
  `m = 0`. (4) El selector de idioma conserva el capítulo **activo según el scroll**, no el ancla de la URL, porque
  la URL no cambia al hacer scroll. Víctor elige estas opciones al aprobar el paso.
- Alternativas descartadas: suavizar ya en un bucle `requestAnimationFrame` propio (se tiraría en F3 y gastaría
  batería sin nada que animar); medir la barra con un ResizeObserver (posible salto al cargar y otra pieza que
  coordinar; la barra es una sola fila); medir desde el borde de la ventana más la barra (adelanta la explosión);
  conservar solo el ancla de la URL (quien llega con scroll perdería su sitio al cambiar de idioma).
- Consecuencias: la escena de F3 tendrá que dejar de escribir `m` en `setScrollTarget` y suavizarlo ella (sin
  WebGL se queda como hoy). Si la barra cambia de alto (dos filas en algún ancho), hay que cambiar el token. Lo
  vigilan los e2e de `tests/e2e/chrome.spec.ts` (anclas bajo la barra, HUD a 0 arriba, EN → ES en el mismo
  capítulo) y el recorrido con Tab de `journey.spec.ts` (nada enfocado debajo de la barra).
- Detalle: `docs/02-experiencia/scroll-y-escena.md`, `docs/02-experiencia/navegacion.md` y
  `docs/05-tecnico/arquitectura.md` → «Puente scroll → escena».

## ADR-022 · Entre features, solo contratos sin React en un módulo propio
- Estado: Aceptada
- Fecha: 2026-10-24
- Contexto: la navegación (`features/navigation`: raíl, barra, «Skip to content») necesita saber cómo se
  encuentran los capítulos del viaje en el DOM y el id del nombre, que define `features/journey`. Los importaba de
  los componentes `ChapterSection` y `Hero`: el primer import entre features, que la tabla de capas no regulaba, y
  `SkipLink` arrastraba el módulo entero del Hero.
- Decisión: una feature no importa componentes de otra. Lo que comparten es un contrato (constantes y funciones
  sin React) que vive en un módulo aparte de la feature que lo define y que la otra importa en un solo sentido,
  sin ciclos. Hoy, `features/journey/chapterDom` (`CHAPTER_SELECTOR`, `findChapter`, `HERO_TITLE_ID`), que leen
  `features/navigation` y la ruta del viaje. Víctor lo elige frente a solo escribir la regla en la tabla.
- Alternativas descartadas: permitir importar de otra feature cualquier cosa que no sea un componente (deja el
  contrato repartido entre componentes); llevarlo a `content/chapters.ts` (`content` no toca el DOM).
- Consecuencias: un contrato nuevo entre features se añade a ese módulo (o a uno igual) y a la frase de
  `arquitectura.md`. ESLint no lo vigila todavía: se revisa en las auditorías.
- Detalle: `docs/05-tecnico/arquitectura.md` → «Capas y reglas de dependencia» (párrafo «Entre features»).

## ADR-023 · Imágenes de proyectos: presets de `vite-imagetools` y contenido sin imágenes aparte
- Estado: Aceptada
- Fecha: 2026-10-25
- Contexto: F2.8 trae las 21 capturas de Chessmate y AstroHub (PNG de 1920 px, de 50 KB a 2,4 MB). Hay que
  servirlas ligeras y sin saltos de layout, y la ficha necesita una imagen para compartir. Pero la config de
  React Router (`prerender`, sitemap) y los e2e cargan `src/content/` sin Vite y no entienden un import de imagen.
  Las portadas del repo antiguo no valen: una es una foto de stock sin licencia clara y la otra, un recorte de
  otra página.
- Decisión:
  - Dos presets en `vite.config.ts`: `?project` da AVIF y WebP a 640, 1280 y 1920 px con la forma
    `ResponsiveImage` (`{ src, width, height, sources }`), y `?share` da un JPEG de 1200 px (`ImageFile`) para
    `og:image`. Los anchos viven en `src/content/imageWidths.ts`, que leen las dos configs y los tests. Se
    pintan con `ui/Picture` (`<picture>` con el `sizes` de cada sitio). Vitest los sustituye por la misma forma
    con las medidas reales del PNG; la regla 5 se comprueba también sobre las páginas del build.
  - Los textos de cada proyecto (`ProjectEntry`) van aparte de sus imágenes (`ProjectMedia`, `projects/media.ts`).
    `projectEntries` (sin imágenes) alimenta la config, los e2e, el viaje y la misión rápida; `projects` (los
    dos unidos) es lo que pinta la ficha.
  - La portada es la captura de Inicio, la misma que abre la galería. Un proyecto con galería tiene portada.
  - Víctor elige guardar los PNG originales en git tal cual (~13,2 MB), `og:image` ya en F2.8 y un presupuesto
    de 200 KB por variante.
- Alternativas descartadas: generar las variantes a mano con un script y guardarlas en `public/` (más archivos
  en git y medidas escritas a mano); un cargador de Node para los e2e (frágil, y distinto en Windows); dejar las
  imágenes dentro de cada `projects/<slug>.ts` (los e2e y la config no podrían importar el contenido); usar las
  portadas antiguas.
- Consecuencias:
  - El primer build genera 128 variantes (~75 s). Después salen de la caché de imagetools, que el CI guarda
    (`actions/cache@v6`) y Vercel no.
  - En `npm run dev`, las imágenes se sirven en `/@imagetools/<hash>`, sin extensión: `assetUrl` acepta esa
    forma además de la del build (sin ella, la ficha caía con «Application Error»). Los e2e prueban el build y
    Vitest usa el sustituto, así que tras tocar la config de Vite o estos imports se abre la ficha en dev.
  - Un proyecto nuevo con imágenes añade sus imports y textos alternativos a `media.ts` y actualiza las listas
    y cuentas escritas a mano: `EXPECTED_MEDIA` y la lista de proyectos con portada de `content.test.ts`, el
    número de capturas de `budgets.spec.ts` y de `project-images.spec.ts`, y `WITH_COVER` de `seo.spec.ts`
    (que comprueba que la lista coincide con la página).
  - Cosmos sigue sin imágenes hasta F6.
- Detalle: `docs/01-contenido/assets.md` y `modelo-de-datos.md`; `docs/05-tecnico/arquitectura.md` («Capas y
  reglas de dependencia» y «Rutas e idiomas»).

## ADR-024 · E2E del CI en la imagen de Playwright, un job por navegador
- Estado: Aceptada
- Fecha: 2026-10-26
- Contexto: el job de e2e del CI instalaba en cada ejecución Chromium, Firefox y WebKit con sus dependencias del
  sistema (`npx playwright install --with-deps`) y pasaba después los tres navegadores seguidos en una sola
  máquina, con dos reintentos. Iba lento y a menudo se quedaba colgado hasta el `timeout-minutes`, y había que
  cancelarlo y relanzarlo. Con la escena 3D (F3), Firefox y WebKit sin GPU irán aún más lentos.
- Decisión:
  - Los e2e corren dentro de la imagen oficial de Playwright (la de ADR-010, `mcr.microsoft.com/playwright`, a la
    misma versión que `@playwright/test`), que ya trae los navegadores: no se descarga nada.
  - Un job por navegador (`chromium`, `firefox`, `webkit`), en paralelo y sin cortar los demás si uno falla.
  - Un job que los resume con el nombre de siempre, `E2E (Chromium · Firefox · WebKit)`: es el check obligatorio
    de la protección de `main`, que así no cambia.
  - En el CI, un reintento y un límite para toda la ejecución (`globalTimeout`) por debajo del del job, para que
    el informe llegue a subirse.
  - Los tres navegadores siguen en cada PR. En local, `npm run e2e:chromium` se lanza a mano al tocar interfaz;
    los hooks de Git no cambian.
- Alternativas descartadas:
  - Pasar los e2e de los tres navegadores a un hook de Git en local: en Windows, Defender bloquea Firefox y
    WebKit y el WebKit de Windows no es el de Linux; cada push tardaría minutos y un hook se salta con
    `--no-verify`, así que `main` perdería la garantía.
  - Solo Chromium en los PR y Firefox y WebKit al fusionar en `main`: un fallo de Safari se vería después de
    fusionar.
  - Guardar los navegadores con `actions/cache`: las dependencias del sistema se seguían instalando con `apt`.
- Consecuencias:
  - Subir `@playwright/test` obliga a subir la imagen en `ci.yml` (ya lo pedía ADR-010 para `visual`).
  - Cada job descarga la imagen (unos 2 GB) en lugar de instalar los navegadores.
  - Si se renombra el job que resume, hay que actualizar la protección de `main`; los jobs por navegador se
    pueden renombrar sin tocarla.
- Detalle: `docs/05-tecnico/git-y-despliegue.md` («CI») y `docs/05-tecnico/stack.md` («Conflictos»).

## ADR-025 · Dominio propio: `tortoisecode.dev`
- Estado: Aceptada
- Fecha: 2026-10-26
- Contexto: el sitio vivía en el subdominio de Vercel `cosmos-portfolio-two.vercel.app` (provisional hasta
  resolver D2). Víctor compra `tortoisecode.dev` en Vercel durante F3 y lo conecta a Production; `www` ya
  redirige al apex.
- Decisión:
  - El canónico es el apex, `https://tortoisecode.dev`: `VITE_SITE_URL` vale eso en Production y en Preview, y
    en el repo (`.env.example`, `ci.yml`).
  - `www.tortoisecode.dev` y `cosmos-portfolio-two.vercel.app` redirigen al apex con 308 (permanente).
  - Orden del cambio: la variable en Vercel, después fusionar, después la redirección del dominio viejo, y
    comprobar en producción la canónica, el sitemap y `robots.txt`.
- Alternativas descartadas: `www` como canónico (más largo, sin ventaja en Vercel); quedarse en el subdominio de
  Vercel (D2 lo dejaba abierto para F7, pero el dominio propio ya está comprado y da una URL que se recuerda).
- Consecuencias: `.dev` exige HTTPS (HSTS precargado), que Vercel ya sirve. Las previews comparten la canónica de
  producción y deben ir con `noindex` (se comprueba en F7, junto a las 404 reales y `cleanUrls`). El enlace de
  la demo de Cosmos pasa al dominio nuevo.
- Detalle: `docs/05-tecnico/git-y-despliegue.md` («Despliegue»).

## ADR-026 · Formas de la escena en un worker por encargo, con un reintento en el hilo principal
- Estado: Aceptada
- Fecha: 2026-10-26
- Contexto: F3.2 genera las cuatro formas (hasta 60.000 partículas, ~0,4 s en una CPU modesta) y no puede
  congelar la página. `rendimiento.md` pedía un worker y un reintento en el hilo principal, sin decir qué es
  fallar, cuánto se espera ni qué pasa si el reintento falla. El chunk de la escena va por 241,6 de 250 KB.
- Decisión:
  - **Un worker por encargo** (`scene/worker/loadShapes`): se crea, responde y se cierra; también al vencer el
    plazo (3 s desde que se crea, incluida su descarga) o al desmontar. Las matrices vuelven transferidas.
    `loadShapes` no reintenta: devuelve las formas o el motivo, y quien llama decide.
  - **Validación a los dos lados**, a mano: el worker rechaza una petición mala; el hilo principal comprueba las
    5 matrices y sus longitudes.
  - **Reintento único** al arrancar: si el worker falla, se generan en el hilo principal con el `count` de Bajo y
    la escena entera baja a Bajo (`uiStore.lowerSceneLevel`, que solo baja). Si también falla, Apagado.
  - **El contrato va aparte de los generadores** (`scene/shapes/shapeContract`): el hilo principal valida sin
    cargarlos. Los generadores solo viajan en el worker y, para el reintento, en su propio chunk por `import()`.
  - **Presupuestos propios:** worker ≤ 10 KB y reintento ≤ 10 KB gzip, aparte de los 250 KB de la escena; el test
    clasifica cada `import()` y `new URL(…)` que sale de la escena y falla con uno sin clasificar.
  - `scene/{shapes,math,config,worker}` es código puro: ESLint le prohíbe Three, React, Zustand y `stores`.
- Alternativas descartadas: un worker para toda la visita con identificadores de mensaje (más estado que vigilar
  para como mucho 3 encargos por visita); importar los generadores de forma estática para el reintento (gastaría
  el margen de la escena en código que casi nunca se usa); confiar en los tipos a través de `postMessage`.
- Consecuencias: si el protocolo o el cliente importan los generadores, el `import()` del reintento deja de
  servir (Rolldown avisa con `INEFFECTIVE_DYNAMIC_IMPORT`). F3.6 reutiliza `loadShapes` y `lowerSceneLevel`,
  pero regenerar a media visita no debe reintentar ni apagar la escena (deuda anotada en `STATE.md`).
- Detalle: `docs/04-escena/rendimiento.md` («Worker de las formas»), `docs/04-escena/formas.md` («Contrato y
  tests»), `docs/05-tecnico/calidad.md` («Presupuestos»).

## ADR-027 · Bucle de frames propio para la escena y lienzo sin gestión de color
- Estado: Aceptada
- Fecha: 2026-10-26
- Contexto: F3.3 pinta las partículas y la escena pasa a animarse en cada frame. Lo que lanza en un `useFrame` o
  en `gl.render` corre en el `requestAnimationFrame` de React Three Fiber, fuera de React: ningún *error
  boundary* lo recoge y se repetiría 60 veces por segundo (`rendimiento.md` → «Robustez» lo dejó para el primer
  `useFrame`). Además, los colores del shader son los del prototipo, que pintaba sin gestión de color sobre un
  lienzo opaco.
- Decisión:
  - **`frameloop="never"` y un bucle propio** (`scene/frameLoop`): pide cada frame y, dentro de un único `try`,
    rellena el frame compartido (`m`, el reloj de animación, densidad de píxeles, aspecto, extras del nivel) y
    llama a `advance()` de R3F (todos los `useFrame` y `gl.render`). El primer error para el bucle, se registra
    (`[scene] A frame failed…`) y pasa a sin WebGL (`frame-error`). La pausa de F3.5 será no pedir el frame
    siguiente.
  - **Un solo objeto de frame** para toda la visita (`SceneFrame`): las piezas lo leen en su `useFrame`, sin
    crear objetos por frame (ADR-004).
  - **Reloj de animación propio** (`scene/sceneClock`): se congela con movimiento reducido y no salta más de
    0,1 s entre frames (una pestaña que vuelve).
  - **Lienzo opaco, sin gestión de color ni mapeo de tonos** (`alpha: false`, `linear`, `flat`), limpiado con
    `--color-void` leído del token: los shaders suman la luz tal cual, como el prototipo. El fondo lleva los
    números del hex tal cual (`scene/voidColour`: `hexToRgb` + `Color.setRGB`), como la paleta de los shaders;
    `new Color('#…')` los linealizaría y, con la salida lineal, el espacio saldría casi negro.
- Alternativas descartadas: envolver cada `useFrame` en su propio `try` (no cubre `gl.render`, y cada pieza
  nueva tendría que acordarse); seguir pintando bajo demanda (la escena se anima de forma continua); lienzo
  transparente (la mezcla aditiva deja un alfa que el navegador compone de forma distinta según el motor).
- Consecuencias: la escena pinta siempre que está montada, también sin cambios en pantalla, hasta la pausa de
  F3.5; R3F ya no pide frames por su cuenta, así que tras recuperar el contexto basta con el frame siguiente del
  bucle y volver a poner el color de fondo (Three rehace su fondo en negro; `SceneRoot` lo repone escuchando
  `webglcontextrestored` después de Three). Una pieza nueva solo necesita su `useFrame`: queda dentro del `try`.
  - El primer error de un frame apaga la escena el resto de la visita (no hay reintento).
  - El `delta` que R3F pasa a cada `useFrame` no tiene tope (`timestamp − clock.elapsedTime`): las piezas leen el
    tiempo del frame compartido (`SceneFrame.time` y `SceneFrame.delta`, del reloj de la escena), nunca ese
    `delta`. La media de fps de la degradación en caliente (F3.6) se mide en el `step` del bucle.
  - Pintar sin parar cuesta en los e2e de Chromium (SwiftShader): de ~4,5 a ~6,7 min desde F3.3.
- Detalle: `docs/04-escena/rendimiento.md` («Robustez»), `docs/04-escena/particulas-y-shaders.md` («Colores»,
  «Etiquetas y colores»).

## ADR-028 · La escena suaviza su propia `m`; la interfaz fija sigue el scroll a saltos
- Estado: Aceptada
- Fecha: 2026-10-27
- Contexto: F3.5 conecta el scroll con la escena: `m` tiene que perseguir a `mTarget` con inercia
  (`scroll-y-escena.md` → «Suavizado»). ADR-021 dejó el raíl, el HUD y el idioma leyendo `m = mTarget` a saltos y
  preveía que la escena pasara a escribir su `m` suavizada en `sceneStore`. Eso haría que la interfaz dependiera
  de si hay escena (P1), escribiría el store en cada frame mientras converge (un objeto nuevo por frame, ADR-004)
  y obligaría a devolver `m = mTarget` al pausar o apagar la escena.
- Decisión: la escena suaviza **su propia copia** de `m` (`SceneFrame.m`), que leen todas sus piezas: en cada
  frame, el bucle hace `m = damp(m, mTarget, dt, k)` (`lib/math/damp`: `min(1, dt · k)`, `k` = 3,4 y 12 con
  movimiento reducido, llega por debajo de 1e-4; `M_SMOOTHING` en `sceneConfig`) con el tiempo real del frame
  (`sceneClock.delta`, tope 0,1 s), y en su primer frame arranca en `mTarget` (quien llega a mitad del viaje no ve
  otra vez la explosión). `sceneStore` sigue con `m = mTarget`: el raíl, el HUD y el idioma van a saltos, con y
  sin escena. La pausa (pestaña oculta, misión rápida abierta: `scene/pause`) no pide el frame siguiente
  (`FrameLoop.setPaused`).
- Alternativas descartadas: escribir la `m` suavizada en `sceneStore` para que el HUD y el raíl también tengan
  inercia (lo de arriba; además, el raíl cambiaría de capítulo con retraso tras un salto con ancla); suavizar en
  la interfaz con un bucle propio (el que ADR-021 ya descartó).
- Consecuencias: con escena, la escena y la interfaz pueden ir un instante desfasadas durante la inercia (la
  interfaz va por delante); es lo previsto. Todo lo nuevo de la escena (constelaciones, etiquetas, placas, F4)
  lee `SceneFrame.m`, nunca `sceneStore.m`. Al volver de una pausa, el reloj limita el salto (0,1 s) y la `m`
  sigue desde donde estaba.
- Detalle: `docs/02-experiencia/scroll-y-escena.md` («Suavizado»), `docs/05-tecnico/arquitectura.md` («Estado»,
  «Puente scroll → escena»), `docs/04-escena/rendimiento.md` («Ahorro de trabajo»).
