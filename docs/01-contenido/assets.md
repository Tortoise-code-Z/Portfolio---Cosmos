# Assets

## Capturas de proyectos

- **Origen:** repo del portfolio antiguo (`https://github.com/Tortoise-code-Z/portfolio`), carpeta
  `src/assets/images/screenshots/<proyecto>/`. Listado y textos alternativos en cada ficha de `proyectos/`
  (sección «Imágenes»). ✔ F2.8
- **Destino:** `src/assets/projects/<slug>/NN-<nombre>.png` (PNG originales de 1920 px de ancho, tal cual), con
  `NN` = orden de la galería en la ficha. Los datos (texto alternativo EN/ES) van en `src/content/projects/media.ts`.
- **Portada:** la captura de Inicio de cada proyecto, la misma que abre su galería (sin archivo duplicado). Las
  portadas del repo antiguo no se usan: `Chessmate.webp` es una foto de stock de un tablero (sin licencia clara)
  y `Astrohub-Proyect.webp`, un recorte de Noticias.
- **Tratamiento** (`vite-imagetools` en el build, presets de `vite.config.ts`):
  - `?project` → **AVIF + WebP** a **640, 1280 y 1920 px** para el `srcset` de un `<picture>` (`ui/Picture`);
    `width`/`height` del archivo en el `<img>`, para que no haya saltos de layout (CLS). El navegador elige
    formato y ancho con el `sizes` de cada sitio: portada 696 px (la columna menos su marco), miniaturas 232 px
    con tres columnas, visor 100vw. Los anchos de los presets viven en `src/content/imageWidths.ts`, que leen
    las configs de Vite y Vitest, las reglas del contenido y los e2e.
  - `?share` → **JPEG de 1200 px** (calidad 80) para `og:image` de la ficha: no todas las redes leen WebP.
  - Presupuesto: cada variante servida ≤ 200 KB (`budgets.spec.ts`; la mayor, 148 KB en F2.8).
  - La primera generación tarda ~75 s; después sale de la caché (`node_modules/.cache/imagetools`), que el CI
    guarda entre ejecuciones (si cambia su clave, parte de la última y solo genera lo que falte).
- Las ilustraciones tipo caricatura del sitio antiguo (`*-Caricatura*.webp`) **no se usan** en la v1: la estética
  nueva es la escena de partículas. Se pueden recuperar más adelante si encajan.

## Fotos fijas de la escena

- **Para qué:** el modo sin WebGL del viaje (ADR-029; `docs/02-experiencia/estados-y-accesibilidad.md` → «Sin
  WebGL»): la forma del capítulo activo sobre el degradado del espacio. ✔ F3.9
- **Origen:** la escena real, fotografiada por `npm run stills` dentro de la imagen de Playwright (Docker, como las
  capturas; `tests/stills/stills.spec.ts`, `playwright.stills.config.ts`): entra por el ancla de cada capítulo 1–5
  con movimiento reducido y fotografía solo el lienzo, sobre negro (`--color-void` a `#000`).
- **Encuadres** (`src/features/scene-mount/stillFrames` → `STILL_FRAMES`):
  - **Escritorio:** 2160 × 900 px a densidad 2, en Alto, con `shiftX`. Ajustada al alto cubre cualquier pantalla de
    aspecto 1,25–2,4.
  - **Móvil:** 461 × 844 px a densidad 1, en Bajo (lo que pinta un móvil), en el tope del campo de visión.
- **Destino:** `src/assets/scene-stills/<formato>/scene-still-<encuadre>-<capítulo>.<formato>`, **AVIF** (calidad
  45, color sin submuestrear: los puntos no pierden el tono) y **WebP** (calidad 70), codificadas con `sharp`. Se
  commitean tal cual: el build las copia sin tocar, como archivos (`budgets.spec.ts` comprueba que ninguna acaba en
  base64 dentro del JS: Vite lo hace con lo que pesa menos de 4 KB).
- **Presupuesto:** cada archivo ≤ 200 KB (`budgets.spec.ts`; en F3.9, la mayor la WebP de la galaxia de escritorio,
  ~160 KB; las de móvil, ≤ 15 KB).
- **Cuándo se rehacen:** al cambiar las formas, los shaders, la paleta, la cámara, los niveles, las cuentas que
  comparten (`lib/math` y el suavizado de `m`), los tramos del viaje y su `m` (`content/chapters.ts`, `lib/scroll/mapM`:
  las fotos se sacan en el ancla de cada capítulo), la llegada del epílogo que lee la escena (`lib/scroll/arrival`,
  ADR-039; lo que solo pinta o mueve la página, `lib/scroll/arrivalChoreography` y `lib/scroll/stageFocus`, no), el
  mapa de formas (`lib/scroll/shapeTrack`, ADR-041), el reloj y el movimiento reducido (se sacan con el reloj parado),
  cómo se piden las formas y se monta el lienzo (`SceneRoot`), las constelaciones (sin sus etiquetas: son del DOM), el
  Sol, si es escritorio (`lib/device/mediaQuery`: el encuadre), las imágenes del retrato (`src/assets/portrait/`, byte
  a byte), los proyectos (las placas de la tortuga) o el propio script. La lista exacta es `STILLS_SOURCES`; de
  `scene/`, la da la tabla única de la escena (`scripts/sceneModules.ts`: cada pieza con `stills: true`, o el motivo
  por el que no entra).
  `stills.json` guarda la huella de todo eso (`tests/stills/fingerprint.ts`; de los proyectos, solo sus placas) y
  `budgets.spec.ts` falla si no coincide. La huella solo se escribe si en esa pasada se han rehecho las 20 fotos: `npm run stills`, mirar las fotos y commitearlas con el cambio (y `npm run visual:update` si cambia la
  captura del modo sin WebGL).

## Tipografías

| Rol | Familia | Ejes / pesos | Licencia |
|---|---|---|---|
| Display | Anybody | variable `wdth` 50–150, `wght` 100–900 | SIL Open Font License |
| Texto | Geologica | variable `wght` 300–700 (ya la usas en tu web actual) | SIL Open Font License |
| Datos / HUD | IBM Plex Mono | 400, 500 | SIL Open Font License |

- **Autoalojadas** (servidas desde el propio sitio, en `woff2` y solo con los caracteres latinos necesarios),
  sin pedirlas a Google Fonts: más rápido y sin ceder datos del visitante a terceros. Cómo se instalan se decide
  en `docs/05-tecnico/`.

## Imagen para compartir (Open Graph)

- **Estado:** hecha (adelantada de F6 en la sesión 47, antes de las candidaturas). `src/assets/og/og-en.png` y
  `og-es.png`, de 1200×630 (proporción 1,91:1 de Open Graph y LinkedIn): la foto fija de la tortuga
  (`scene-still-desktop-3`) a la derecha y, como el hero, el eyebrow del rol (`hero.kicker` del idioma) y el nombre en
  el display y en mayúsculas; abajo, el favicon y el dominio (el de `VITE_SITE_URL`, el de las canónicas). Un velo
  del color del espacio por la izquierda deja leer el texto.
- Entran al build con `?share` (JPEG de 1200 px con hash en el nombre: las redes no se quedan con una versión vieja)
  desde `src/content/shareImage.ts` (`siteShare`). Las llevan la home de cada idioma y las fichas sin portada (hoy,
  Cosmos); las fichas con portada siguen con la suya. La 404 no lleva (no tiene dirección propia).
- **El `alt`** cuenta lo que se lee en ella (no sale una foto de Víctor, sino su nombre escrito):
  - EN: “Víctor Pérez” in large type under “Tortoise_code · Frontend developer · React + TypeScript”, with
    tortoisecode.dev, beside a particle turtle swimming through space.
  - ES: «Víctor Pérez» en letra grande bajo «Tortoise_code · Desarrollador frontend · React + TypeScript», con
    tortoisecode.dev, junto a una tortuga de partículas que nada por el espacio.
- **Recorte:** apaisada en LinkedIn, X, Slack y el correo (en X, a 2:1, solo pierde ~15 px arriba y abajo). Una app
  que la recorte a un cuadrado centrado (miniaturas pequeñas de algunas mensajerías) dejaría el nombre y la tortuga a
  medias: aceptado. Se mira pegando el enlace en el inspector de LinkedIn y en un chat de WhatsApp.
- **Se generan con `npm run og`** (`scripts/og.ts`, Playwright): los textos salen del contenido y de `VITE_SITE_URL`,
  el estilo de `tokens.css` y las fuentes del sitio (`OG_FONTS` repite sus `@font-face`). Se vuelven a sacar si
  cambia algo de lo que se ve en ellas: el nombre, el rol, el dominio, el favicon, los tokens, la foto fija de la
  tortuga (tras `npm run stills`), las fuentes o el propio generador; y se commitean con `og.json`. **No hace falta
  acordarse:** `og.json` guarda la huella de todo eso (`scripts/ogInputs.ts`) y `scripts/ogInputs.test.ts` (en
  `npm run check`) falla hasta rehacerlas; el dominio va aparte en `og.json` (Vitest usa el suyo) y lo compara el e2e
  de SEO con el de las canónicas. `og.ts` falla si alguna fuente no carga, en vez de pintar con la de reserva.

## Favicon e iconos

- **Estado:** hecho (sesión 47). `public/favicon.svg` («Constelación tortuga», `design-system.md` → «Marca»),
  `public/apple-touch-icon.png` (180, a sangre: iOS redondea las esquinas), `public/icon-192.png` e
  `public/icon-512.png` (los del `manifest.webmanifest` básico: nombre, iconos, el color del espacio, `lang: "en"` e
  `id: "/"`; uno solo, en inglés: abre la home inglesa aunque se guarde desde `/es`), y `theme-color` en la cabecera.
  Los PNG los saca `npm run og` del mismo SVG (y entran en su huella).
- Un test de contenido comprueba que el favicon es **XML válido** (un comentario con dos guiones seguidos lo rompe y
  el navegador deja la pestaña sin icono: le pasó al primero), que solo pinta con los colores de los tokens, blanco o
  nada (sin `style`, y las líneas al 75 %), que los PNG miden lo que dicen el manifest y `apple-touch-icon` y que el
  color del espacio de la cabecera y del manifest es el token; un e2e, que la cabecera los enlaza, el sitio los sirve
  con su tipo y el favicon se decodifica como imagen.

## CV en PDF

- **Estado:** hecho en C.1 (ADR-034). `public/Victor_Perez_CV.pdf`, el CV en inglés (2 páginas), sirve para los
  dos idiomas; en ES el enlace avisa: «Descargar CV (PDF, en inglés)». Sale en la barra superior («CV»), en
  Contacto y en la misión rápida.
- **Es una copia:** el CV maestro vive fuera del repo (el proyecto de búsqueda de empleo de Víctor). **Cada vez que
  cambie el CV, se vuelve a copiar aquí** con el mismo nombre (un `public/` estático, sin hash: la URL no cambia).
- Un test de contenido comprueba que cada `profile.cv` apunta a un PDF que existe en `public/`, y un e2e que se
  sirve como `application/pdf`. Si algún día hay CV en español, `profile.cv.es` apunta a él y la etiqueta ES
  vuelve a «Descargar CV (PDF)».

## Prototipo de referencia

- `docs/referencia/prototipo-v0.1.html`: el prototipo validado. Referencia visual y de comportamiento,
  no código para copiar.
