# Calidad: tipado, lint, tests y presupuestos

## TypeScript

- `strict: true` + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
  `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `isolatedModules`.
- Tipos de retorno explícitos en funciones exportadas. Sin `any`; `unknown` + estrechamiento en los bordes.
- Tipos generados de rutas con `react-router typegen` (forma parte de `npm run typecheck`).
- Declaraciones para `*.glsl?raw` y para las importaciones de imagen con los presets de `vite-imagetools`
  (`*?project`, `*?share` en `src/env.d.ts`). En Vitest, un sustituto (`vitest.config.ts`) devuelve la misma forma
  con las medidas reales del PNG, sin generar variantes.

## ESLint (config plana) + Prettier

- `@eslint/js` recomendado + `typescript-eslint` `strictTypeChecked` y `stylisticTypeChecked`.
- `react-hooks` (recomendado), `jsx-a11y-x` (strict; fork mantenido de `jsx-a11y`, ADR-014).
- `no-restricted-imports` por carpeta (reglas de capas de `arquitectura.md`) y `no-restricted-syntax` para los
  `import()`: la escena y Three.js solo en diferido desde `features/scene-mount/SceneMount`, y ningún `import()`
  con una ruta que no sea una cadena fija (`arquitectura.md` → «Carga de la escena»).
- `no-console` permitido solo `error` y `warn`.
- `eslint-config-prettier` al final. Prettier: `printWidth 100`, comillas simples, `trailingComma all`,
  `endOfLine lf`.

## Scripts de `package.json`

| Script | Qué hace |
|---|---|
| `dev` | Servidor de desarrollo |
| `build` | Build + pre-renderizado + sitemap |
| `preview` | Sirve el build localmente |
| `typecheck` | `react-router typegen && tsc --noEmit` |
| `lint` / `lint:fix` | ESLint |
| `format` / `format:check` | Prettier |
| `test` / `test:watch` / `test:coverage` | Vitest |
| `e2e` | Playwright (recorridos) en los tres navegadores |
| `e2e:chromium` | Los mismos recorridos solo en Chromium: el que se lanza en local al tocar interfaz (ADR-024) |
| `visual` / `visual:update` | Capturas de regresión dentro del contenedor Docker de Playwright (`scripts/visual.ts`; necesita Docker Desktop abierto): comparar con las referencias / rehacerlas |
| `visual:run` | Lo que corre dentro de la imagen y en el job `visual` del CI; fuera de ellos la config se niega a arrancar (`COSMOS_VISUAL_DOCKER`) |
| `stills` | Saca las fotos fijas del modo sin WebGL de la escena real dentro del contenedor Docker de Playwright (`scripts/stills.ts`; ADR-029, `assets.md` → «Fotos fijas de la escena») |
| `stills:run` | Lo que corre dentro de la imagen; fuera, la config se niega a arrancar (`COSMOS_STILLS_DOCKER`) |
| `lhci` | Lighthouse CI sobre `preview` |
| `check` | `typecheck` + `lint` + `format:check` + `test` (lo mínimo antes de cada commit) |

## Pirámide de tests

| Nivel | Qué | Ejemplos |
|---|---|---|
| Unitarios (Vitest) | Toda la lógica pura | Detección de WebGL2 (`detectWebGL2`: GPU, por software —por su `renderer` o sin contexto con `failIfMajorPerformanceCaveat`— o ninguno; `isSoftwareRenderer` con nombres reales y los del disfraz de los e2e), `mapM`, suavizado (`lib/math/damp` y `lib/scroll/smoothM`), efectos del Big Bang (`lib/bigBang`: destello en dos golpes que se apagan solos —el del scroll se rearma arriba—, temblor, ancho y espaciado del nombre —su reposo, igual al token `--wdth-hero-rest`— y halo), el tope del paso igual en el bucle del hero y en el reloj de la escena (`sceneClock.test.ts`), `setScrollTarget` que ignora lo que no es un número finito, pausa de la escena (`scene/pause`: pestaña oculta y misión rápida), cámara (`scene/math/camera`: pose por `m` en los keyframes, encuadre de escritorio, campo de visión de móvil con tope, paralaje y la media query igual a la de los paneles), el ratón de la escena (`scene/pointer`, solo `mouse`, medido sobre el lienzo, también al salir; el paralaje lo acota a ±1), gravedad del cursor (`scene/math/gravity`: sube y baja suave, se apaga donde estaba, apagada con movimiento reducido), proyección a la pantalla (`scene/math/projection`, y en `CameraRig.test.tsx` la misma que la de Three), constelaciones (`scene/math/constellations`: su aspecto con la presencia del capítulo que da `scene/math/chapterPresence`, encendido suave o instantáneo con movimiento reducido y su aspecto; `scene/math/labelFit`: lo que tapa la interfaz en escritorio y por debajo, y qué etiquetas caben en el orden del panel; `scene/config/constellationLayout`: una estrella por skill y ninguna de más, Y entre 0,9 y 1,5, distancia ≥ 1,2, una figura por grupo —líneas entre dos estrellas distintas de su grupo, sin repetir y todas unidas— sin cruzar otro grupo, en pantalla ninguna línea a menos de 12 px de una estrella ajena ni tachando una etiqueta, lo que tapa la interfaz sacado de los tokens donde se puede (panel, barra, alto del raíl), cada etiqueta de una letra por unidad y en la parte latina de Plex Mono, y, en reposo (m = 2), las etiquetas proyectadas, delante de la cámara, sin pisarse ni tapar el panel, la barra, el raíl o el HUD a 1280×720 y 1440×900, EN y ES, con y sin barra de scroll y con el paralaje en sus esquinas), `watchMediaQuery`, generadores de formas y estrellas, geometría y uniforms de las partículas, cabecera GLSL (etiquetas y colores desde TS, y `SUN_DIR`, la luz de la Tierra, atada a `SUN.position` y leída de la cabecera; ningún nombre sin definir, ninguno en los fragment shaders, ni etiquetas, colores ni luz escritos a mano), shaders sin comentarios (con sus líneas en su sitio), paleta de la escena contra la tabla del design system (cada color en su papel) y sus parejas en `tokens.css` (`--color-singularity`, `--color-flash`), color de fondo del lienzo (`scene/voidColour`), bucle de frames (también su pausa) y reloj de la escena, medidor de fps (`scene/fpsMeter`: calentamiento, ventanas seguidas, pausa), elección de nivel, nivel de debajo y móvil (`nextLowerLevel`, `isHandheld`, `readHandheldSignals`), formato del HUD, `i18n`, builders de SEO, asignación de placas (`plateLabelOf`/`plateSlugOf`, `NO_PLATE` a 1 o más de cualquier placa), presencia de un capítulo (`scene/math/chapterPresence`, una rampa para galaxia, placas y pins, y el Sol y la gravedad sobre la Tierra), placas encendidas (`scene/math/plateCycle`: el proyecto señalado, también sin placa, para el ciclo; el ciclo cada 2,6 s, que vuelve donde iba; nada con movimiento reducido ni lejos de la tortuga), pins (`scene/math/platePins`: el ancla, su caja, los pisos de derecha a izquierda y el balanceo igual que el del shader; `scene/labelWriter`: lo que se escribe de una etiqueta colocada); invariantes de estilos (`src/styles/styles.test.ts`: tokens definidos, sin colores, duraciones ni familias literales, fundidos con `--dur-fade-*`, contraste AA, `--color-void` en `#rrggbb`); invariante de estructura (`src/structure.test.ts`: archivos con el mismo nombre, en su carpeta, ADR-018); invariante de citas (`src/code-references.test.ts`: el código no cita notas de fuera del repo, también claves sin opción como las de una pregunta suelta y las de encargo sin fase; las imágenes y fuentes no se leen); commits de solo docs (`scripts/docsOnly.test.ts`, ADR-033, sobre repos de git de usar y tirar: qué es doc, el árbol final y cada commit —código que entra y sale, merges, historia reescrita, refs que no son un hash, un repo roto—, y la orden con su salida 0/1 y el motivo en stderr); `sizes` de la ficha (`features/project/imageSizes`: sus medidas son las de `tokens.css` y de los CSS de la página); encaje de las fotos fijas del modo sin WebGL (`features/scene-mount/stillFrames`: cada fórmula dentro de su condición del CSS, bloque a bloque, y la densidad de cada encuadre igual a la de su nivel; `camera.test.ts`: el CSS sigue la regla del campo de visión y el ancho de los paneles); el contador de las cifras de Mission control (`scripts/siteTelemetry.test.ts`: cuenta `it`/`test` con el compilador —`.only`, `.concurrent`, `.fails`, `it.each(…)(…)` y con su tipo— y no `describe`, `skip`, `use`, comentarios ni textos; falla con una forma que no sabe contar, sin matriz, con un navegador que no es un proyecto de Playwright, sin ADR o con uno repetido; solo mira el job `e2e`; el mes en UTC también en Honolulú; cuenta una sola vez por build), `formatMonth` (en corto por idioma, sin moverse por la zona horaria, y lo que no es un mes —también 00 o 13— tal cual), y el AA de cada canal de las transmisiones sobre su velo |
| Contenido (Vitest) | Invariantes del contenido | Reglas de `docs/01-contenido/modelo-de-datos.md`; paridad de claves EN/ES; portada y galería de cada ficha (textos, archivos y orden, lista escrita a mano); skills ↔ posiciones de constelación (en los unitarios: `scene/config/constellationLayout`); la cuenta atrás de Mission control (T-4 a T-0 sin huecos, los pasos de antes del código al principio, el bucle hacia atrás) y `browserName`; la imagen para compartir del sitio (1200×630 por idioma y un `alt` con lo que se lee en ella), los iconos con las medidas del manifest y de `apple-touch-icon`, el favicon (XML válido; solo pinta con los colores de los tokens, blanco o nada, sin `style`, y las líneas al 75 %) y el color del espacio de la cabecera y el manifest igual al token; la huella de la imagen y los iconos (`scripts/ogInputs.test.ts`) |
| Componentes (Vitest + Testing Library) | Comportamiento visible | `HoldButton` (teclado y puntero), `useConstellations` (una por grupo, su aspecto en reposo y encendido —solo el grupo de `frame.skillGroup`; al instante con movimiento reducido—, nada lejos del capítulo —ni se dibujan— ni antes de que las partículas estén pintadas, las 37 etiquetas a la vista a 1280×720 y solo las que caben a 390×844 —13 en inglés y 12 en español—, `data-hot` en su grupo, `data-live` desde `interactiveFrom`, las que nacen de nuevo sin un frame en medio —en su sitio y con el ámbar de su grupo—, escribe solo lo que cambia y libera la GPU), `ConstellationLabels` (en `body`, decorativas, en el orden del panel, el puntero solo con `data-live`, el ratón encima enciende su grupo y al salir lo suelta (solo si sigue encendido), un toque lo enciende, y un grupo que no existe no enciende nada, y su CSS con la caja de `STAR_LABEL_BOX`), `Skills` (con escena: el ratón enciende al entrar y suelta al salir —el toque y el lápiz no—, solo el foco del teclado enciende y perderlo suelta —moverse dentro del grupo o irse de la ventana no suelta—, manda el último gesto —también el ratón que sale de un grupo que ya no está encendido—, un toque enciende y cambia y tocar fuera apaga, deslizar no apaga, el grupo encendido desde una etiqueta se marca en el panel, y se apaga al irse el viaje o al apagarse la escena —con el foco en un grupo, el foco pasa al título; al irse el viaje no se mueve—; sin escena, fuera del Tab; la frase guía y sus dos instrucciones, que el CSS oculta con `no-gl`; el `:hover` sin escena solo con `hover: hover`, y el encendido con `Highlight` en alto contraste), `uiStore` (`releaseActiveSkillGroup` y `releaseActiveProject` sueltan solo lo que sigue encendido o señalado, `selectSceneOn`), `Projects` y `ProjectRow` (cada fila señala su proyecto con el ratón, el foco del teclado en sus enlaces —también al volver de una ficha con el teclado— y el toque, sin un instante de «suelto» al mover el foco dentro; tocar fuera, irse a una ficha o apagarse la escena lo sueltan; el ámbar del `:hover` solo con `hover: hover`, y la señalada con `Highlight` en alto contraste), `pointGestures` y `useTapOutsideTurnsOff` (los gestos que comparten Skills y Projects), `PlatePins` (la capa, el ratón, el clic, los dos toques y su colocación en cada frame, ocultos en una transmisión), `Transmission` (franja, título enfocable y pie con el reloj parado; «Skip» salta al capítulo siguiente y con Ctrl/Cmd deja el enlace; sin `IntersectionObserver` o con movimiento reducido no se arma; se enciende una vez con el margen de `TRANSMISSION_ENTRY`, no con un aviso de «fuera», y al desmontarse deja de observar y quita sus marcas), `MissionLog` (región `#mission-log` con su cola, la ficha como el CV, el manifiesto, el registro y la referencia en el idioma de su carta; solo pinta lo que dice `experience`), `MissionControl` (región `#mission-control` titulada «How I work» con el «T-0» decorativo; la secuencia como lista ordenada T-4 → T-0 con sus piezas separadas por espacios y el texto del bucle al alcance del lector; el dibujo, escondido; la telemetría con las cifras del build y el mes, que es lo único marcado para la captura; «Touchdown» y «Skip» a Contacto; las líneas del teletipo en orden), `ChapterJumpLink` (enlace real al capítulo en su idioma; salta con el foco en su título, con Ctrl/Cmd deja el enlace y fuera del viaje el router navega), `CrewFile` (la ficha como `dl`, en EN y ES; sin `availableNow` o sin `openToWork`, falta solo esa parte; el CV justo tras el título y solo si hay PDF; «Identity verified» después del último campo; el visor, decorativo; «Copy»; la firma con el año), `ProjectPage` (hasta F5, dice que se está viendo y la escena se para), `ChapterRail` (el rombo de cada interludio mientras se lee), `CosmicHud` (se esconde leyendo una transmisión: un interludio o el epílogo), `LanguageSwitch` y `LanguageNotice` (conservan el interludio que se lee), `Contact` y `QuickMissionContent` (sin `availableNow`, sin «Available immediately»), `CameraRig` deja su pose y su campo de visión en el frame, `SceneMount` da los textos de las etiquetas y los nombres de los pins en el idioma del viaje y ninguno fuera (una ficha, una 404, `/ES`), y un pin abre la ficha en el idioma de la página, `useHoldCharge` (detona una vez, se descarga sola, ignora pulsaciones durante la descarga y se rearma arriba, también a mitad de ella), `useBigBang` (golpes del destello y su rearme, persigue `m` también pasado el hero, ritmo de movimiento reducido, sin destello ni temblor con él, escribe solo lo que cambia, limpia `<html>`), placa de cada frame en `SceneRoot` (`data-plate`; sin ciclo con movimiento reducido) y `frame.plate` → `uPlate` en `sceneMaterials`, contratos de CSS de las variables `--_bang-*` en `Hero`, `BigBangFlash` y `SceneRoot`, cada uno anclado a su regla (el temblor solo con `scene-on`, el halo fijo solo con `bang-live`, el destello oculto sin escena), `CopyButton` (éxito y fallo), `ChapterRail` (`aria-current`), `QuickMissionDialog` (foco y Esc), `LanguageSwitch` (conserva el capítulo activo), `SceneMount` (nivel elegido, sin WebGL2 o pintado por software, escena que lanza o se rinde → sin WebGL con su aviso, turno con la sugerencia de idioma), `SceneRoot` (con el `<Canvas>` simulado: DPR y estrellas por nivel, su nivel (`data-level`) y la degradación con partículas pintadas, bucle de frames propio —rellena el frame y avanza; un frame que lanza para y se rinde—, color de fondo del token con sus números tal cual —y otra vez al recuperar el contexto; un token que no es `#rrggbb` se registra—, movimiento reducido —el reloj se para y sigue sin salto—, su `m` suavizada —arranca en `mTarget`, lo persigue más deprisa con movimiento reducido y el store sigue con el objetivo—, la pausa con misión rápida o pestaña oculta (`data-paused`), shader y contexto perdido, las formas de su nivel, `data-shapes` y `data-particles`, y a la cámara y al Sol les da el mismo frame (el Sol, en todos los niveles y ya antes de las formas, con `painted` a falso), con si es escritorio y el ratón hasta desmontarse; la gravedad del cursor sigue al ratón con el tiempo del reloj, baja al salir donde estaba y es 0 con movimiento reducido), `SceneMount` también marca `scene-on` cuando la escena pinta y quita sus clases al desmontarse, `Particles` y `BackgroundStars` (`useParticles` y `useBackgroundStars` con `useFrame` simulado: las partículas avisan una vez en su primer frame; los dos rellenan los uniforms en cada frame y liberan geometría y material, también al cambiar las formas o el número de estrellas), `Sun` (`useSun` con `useFrame` simulado: un cuadrado de −1 a 1 en dos triángulos de cara a la cámara, solo se pinta cerca de su capítulo —se enciende y se apaga justo en los dos bordes de su rampa— y con la Tierra ya pintada, también con movimiento reducido y en Bajo, rellena los uniforms en cada frame y libera la GPU; el Sol en `sceneMaterials`: aparece con la presencia del capítulo 4 por los dos lados, espera a `painted`, se ve entero con movimiento reducido y en Bajo, late con el reloj y quieto con movimiento reducido, y su perfil de alfa es el de las estrellas de las constelaciones), la gravedad del cursor en los uniforms de las partículas (a la mitad sobre la Tierra, suavizada por los dos lados con la rampa del capítulo 4 —también a medio morph hacia el retrato— y entera en la tortuga y en el retrato), `CameraRig` (con `useFrame` simulado: pose, encuadre, campo de visión solo al cambiar el aspecto, paralaje con el tiempo real y sin él con movimiento reducido), `useSceneShapes` (formas del worker, reintento en el hilo principal a Bajo, Apagado, otro `count` → otras formas, cancelación; `lowerTo`: sin reintento, formas y nivel en el mismo turno o, si no llegan, nada cambia), `useHotDegradation` (un nivel cada vez, no mide sin partículas ni mientras llegan las formas, deja de medir si no llegan, la pausa tira la ventana en curso), `usePortrait` (nada hasta pedirlo ni sin formas, y con ellas un solo encargo con la semilla del proyecto; menos partículas —también con el encargo en marcha, sin cancelarlo— dan el principio del retrato sin pedir otro; si no llega, avisa una vez y no reintenta, ni al bajar de nivel; al desmontar se cancela sin aviso), el retrato en `useParticles` (lo pide una vez desde `PORTRAIT_LOAD_FROM_M`; `pPor` en la geometría y `uPor` que sube desde que está; formas nuevas con su trozo, sin perder `uPor`; avisa una vez al pintarlo entero), `SceneStills` (solo con el nivel `off`; la foto del capítulo activo cuando ha llegado, la anterior hasta entonces, ninguna en la singularidad; solo las de los capítulos visitados; `<picture>` de escritorio y de móvil) |
| Extremo a extremo (Playwright) | Recorridos reales en Chromium, Firefox y WebKit | Los specs usan el `test` de `tests/e2e/support/test.ts`: en los tres motores se presenta como GPU y arranca la escena en Bajo, como las capturas (salvo los de la degradación en caliente, que fuerzan Alto, y los dos de «por software»: uno con el `renderer` de SwiftShader; otro, solo en Chromium, sin disfraz), y ESLint lo exige; las ayudas comunes, en `tests/e2e/support/helpers.ts`. Recruiter: home → Projects → página de Chessmate → código (`recruiter.spec.ts`, en EN y ES: a 1280 px, «Projects» de la barra pone los proyectos en pantalla con un clic y el segundo abre la ficha; a 390 px, la misión rápida pone los proyectos en pantalla con un toque —título de Proyectos y primer proyecto enteros— y su enlace llega tras un deslizamiento, y el raíl cae en el capítulo con la escena primero y la primera fila llega tras un deslizamiento; en la ficha, ruta y `lang` exactos y el código a un clic en una pestaña nueva, sin errores en consola); misión rápida; cambio de idioma; detonación; WebGL desactivado; movimiento reducido; 404; el viaje sin escena (`journey.spec.ts`: capítulos y anclas EN/ES, detonación con teclado y con movimiento reducido, nombre que no tapa la singularidad y sin scroll horizontal en 1280×720, 1440×900 y 390×844 (también bajando, con el nombre ensanchado y todo su espaciado), el Big Bang (la carga comprime el nombre; bajar lo ensancha y apaga el halo; con escena, el lienzo tiembla y detonar da el destello fuerte, y empezar a bajar da un solo golpe que se apaga aunque se pare ahí; con movimiento reducido o sin WebGL, ni destello ni temblor; los de escena se saltan sin WebGL2, nunca en Chromium: la ayuda común `skipWithoutWebGL2`, que usan también `scene.spec.ts`, `constellations.spec.ts` y `plates.spec.ts` y reconoce Chromium por el motor, no por el nombre del proyecto), todo lo enfocable entra en pantalla con Tab sin quedar bajo la barra, las anclas caen justo bajo la barra, CLS < 0,1 con fuentes lentas, lectura sin JS y la primera pintura del hero entera sin JS); la interfaz fija (`chrome.spec.ts`: HUD que sigue el scroll; raíl con el capítulo activo, saltos con foco y sin entrada en el historial, enlaces sin JS, columna de puntos, foco y alto contraste, sin tapar el hero en móvil, y tras volver de la 404 de `/ES`; barra con Skip, Projects/Contact, idioma que conserva el capítulo y no navega en el actual, velo, texto al 200 % a 390 px (forma corta «Quick») y a 960 px (ceden el chip y la etiqueta larga), en el viaje y en las fichas, chip «Open to work» que salta a Contacto y su punto que respira, y enlaces sin JS); el modo misión rápida (`quick-mission.spec.ts`: abre a pantalla completa con el foco dentro y `#quick` en su sitio, todo el contenido, Esc y «Close quick mission» devuelven ancla, scroll y foco, `#quick` escrito en la dirección y Atrás, Tab que no sale (`:modal`), cabecera fija a 390 px, copiar el email y su alternativa a 390 px con el texto al 200 %, y 44 px de los controles nuevos); la sugerencia de idioma (`language-notice.spec.ts`: solo con el navegador en español, se recuerda la respuesta, cabe a 390 px y nada enfocado queda debajo, en el viaje y en la ficha); la página de proyecto (`project-page.spec.ts`: secciones con datos en orden, vuelta al viaje con el foco en la fila (también la última a 390 px) y Atrás con el scroll donde estaba, barra, Skip, EN / ES al mismo proyecto, misión rápida y su enlace a otro proyecto que la cierra, anterior/siguiente con el foco en el nombre y en media columna, cuentas de demo que caben a 520 y 600 px en español con el texto al 200 %, 44 px de sus controles, sin scroll lateral con el texto al 200 % (fichas y 404) y la barra entera, y la sugerencia de idioma con ese proyecto); cimientos visuales (`design-system.spec.ts`: fuentes y su precarga, eje `wdth`, foco, margen lateral, duraciones, reset); presupuestos de fuentes, imágenes, JS inicial (framework y código propio por página; el detalle de las fichas solo en el de las fichas, ADR-036) y JS de la escena —con los shaders sin comentarios— sobre el build (`budgets.spec.ts`); la carga de la escena (`scene.spec.ts`: con WebGL2, llega después de la primera pintura en su chunk, sin errores, deja pasar los clics al contenido y es el mismo lienzo tras ir a una ficha y volver; el contenido de cada página (`main`) queda por encima del lienzo y, en el viaje, el destello del Big Bang entre los dos; las partículas se pintan (los shaders compilan) y se ven (entrando por `/#about`, una fracción de los píxeles junto a los paneles no es el fondo), el fondo es el color del token (también tras recuperar el contexto), la gravedad del cursor hace brillar la parte más densa de la nebulosa con el ratón encima, y no una celda de control lejos de él (el paralaje llega a las dos), y nada con movimiento reducido, el punto CSS del hero cede al de partículas y el halo se queda, y el viaje por los 6 capítulos llega al Crew file sin errores ni avisos de WebGL del navegador; con movimiento reducido, igual; la misión rápida la pausa (`data-paused`) y al cerrarla sigue; arranca en Bajo en cualquier motor (lo fija el `test` de los e2e); con el `renderer` de SwiftShader (WebGL por software, ADR-029) va al modo sin WebGL con su aviso, sin descargar la escena, y en Chromium sin GPU y sin disfraz también (el nombre escondido, leído por la extensión, como en PageSpeed; se salta en un equipo con GPU); pintando demasiado lento (en Chromium, arrancando en Alto con cada frame retrasado 50 ms por el test) baja un nivel cada vez hasta Bajo con las formas del worker y, si esas formas no llegan, el nivel se queda y avisa una vez; entrando por el Crew file con las imágenes del retrato retenidas hasta la primera bajada, el retrato llega del mismo encargo (dos imágenes en total) y sigue en Bajo sin avisos de WebGL; a 1280×720 y a 390×844, la cámara recorre los 6 capítulos con el ratón dentro y fuera, sin errores; un contexto perdido que no vuelve pasa a sin WebGL; las formas llegan del worker sin descargar los generadores (`data-shapes="worker"`) y, si el worker no llega, se generan una vez en el hilo principal y la escena sigue (`data-shapes="main"`); entrando por `/#contact` con el worker retenido, el Sol no brilla sobre el vacío hasta que la Tierra está pintada, y después se ve y su programa compila sin avisos de WebGL; sin WebGL, no descarga la escena, marca `no-gl` (con el fondo estático del espacio por debajo del contenido y el punto y el halo CSS) y avisa una vez por visita en el idioma de la página y después de la sugerencia de idioma; sin WebGL, en el viaje, la foto fija del capítulo activo (la de escritorio, ajustada al alto y centrada, fundida con `screen`; la de móvil a 390×844; la siguiente al hacer scroll y ninguna en la singularidad), nunca con escena ni en las fichas; los e2e que miden el scroll al pie de la ventana descartan antes ese aviso con `settleScene`, por si un motor del CI no tiene WebGL); las imágenes de la ficha (`project-images.spec.ts`: a densidad 1, portada del ancho de la columna con su hueco reservado, miniatura de 640 px y visor de 1920 px a 1440 px, y variante de 640 px a 390 px, en el formato que elija cada navegador; la regla 5 sobre cada `<picture>` y el `og:image` de las fichas del build (la portada o, sin ella, la del sitio del idioma de la ruta); la home sin las imágenes; todo lo que ofrece la página —el número exacto— se sirve como imagen; visor con las capturas reales —abrir, ← →, Esc y «Close» con el foco de vuelta—, que a 390 px pinta la imagen entera (`contain`) dentro de la pantalla con sus controles de 44 px; y CLS < 0,1 con la portada y una miniatura lentas, que si falla dice qué elemento se movió, cuándo y cuánto); SEO sobre el HTML real (`seo.spec.ts`: canónica, `hreflang`, Open Graph y JSON-LD de cada página, `og:image` de todas las páginas indexables —JPEG de 1200 px servido, medidas y `alt`, también en el HTML servido—: la portada en las fichas que la tienen (la lista escrita a mano, solo con proyectos que existen) y, en la home y en las que no (Cosmos), la del sitio de su idioma, de 1200×630 y la misma que su home; `summary_large_image`; el dominio que enseña la imagen es el de las canónicas (`og.json`); el favicon, los iconos y el manifest enlazados en la cabecera con `theme-color` el del token, servidos con su tipo y el SVG decodificado como imagen, sitemap y robots, 404 por idioma, y la 404 hidratada con la misma única hoja de estilos que el HTML servido); las placas y los pins de la tortuga (`plates.spec.ts`: el ciclo por turnos sin marcar filas, con su pin marcado; una fila señalada le gana al ciclo y lo sigue haciendo más de un turno; pasar el ratón de una fila a otra no enseña la placa del ciclo; leyendo Mission control, ni pins ni placa, y de vuelta en Projects el ciclo sigue; con movimiento reducido, el ratón, el Tab y el toque en filas y pins encienden su placa y solo esa, el clic en un pin abre su ficha —y al volver, los tres pins en su sitio— y dos toques en táctil, y salir del capítulo con la rueda sin mover el ratón, sobre un pin o una fila, lo suelta; la señalada con `Highlight` en alto contraste (Chromium); sin WebGL, nada, y los enlaces de una fila funcionan; y a 1280×720, 1440×900 y 390×844 en EN y ES, los tres pins sin pisarse ni pisar la interfaz); las constelaciones de Skills (`constellations.spec.ts`, con WebGL2: el ratón, el Tab y el toque encienden su grupo y solo ese, el foco que devuelve el navegador tras un clic no enciende (Chromium), tocar fuera —también en la escena— apaga, una etiqueta marca su grupo en el panel —y recibe el puntero a través del capítulo— y salir del capítulo con la rueda sin mover el ratón lo suelta, si la escena cae con el foco en un grupo el foco pasa al título, con alto contraste el grupo encendido se distingue (Chromium), mientras la galaxia entra y sale ningún capítulo se queda con el puntero de una etiqueta viva, a 1280×720, 1440×900 y 390×844 las etiquetas visibles no se pisan ni pisan la interfaz ni salen del lienzo en EN y ES, la interfaz real cabe en `STAR_LABEL_KEEP_OUT` en EN y ES, y un grupo encendido con un toque se apaga si el viaje se desmonta (Adelante a una ficha y Atrás); sin WebGL, los grupos fuera del Tab); el Mission log (`mission-log.spec.ts`: `/#mission-log` llega con el título bajo la barra, el raíl en su rombo y el reloj parado aunque se baje —el HUD escondido—; la pantalla recoge el puntero y su cola no; ningún texto bajo el raíl en EN y ES; cambiar de idioma leyéndolo deja en él; «Skip» y el rombo con el foco en su título; en ES con la cita original; a 360 y 390 px con la letra al 200 %, en EN y ES, nada se corta; a 1024×768 (entre md y lg) ninguna palabra se parte; a 844×390 el teletipo se enciende y escribe todas las líneas; con movimiento reducido, nada tapado y el cursor quieto; sin WebGL, entero sobre la foto de la nebulosa); Mission control (`mission-control.spec.ts`: `/#mission-control` con el título bajo la barra, el raíl en su rombo y el reloj parado en el tiempo mítico; la telemetría igual a la que cuenta el repo —con el mes del build—; la secuencia en orden; el puntero en la pantalla y no en su cola; nada bajo el raíl en EN y ES; cambiar de idioma leyéndolo deja en él; Contact llega tras la cola con el reloj en marcha; «Skip» y «Touchdown» con el teclado, a Contact con el foco en su título; el rombo del raíl; a 390 px sin scroll lateral y «Touchdown» de 44 px; a 360 y 390 px con la letra al 200 %, en EN y ES, nada se corta y el «T-0» y cada cifra caben en un renglón (también a 1280 px); a 1024×768 ninguna palabra se parte; con movimiento reducido nada tapado y el cursor quieto, también si se pide con la transmisión ya encendida; el teletipo escribe todas las líneas; sin WebGL, entero sobre la foto de la tortuga); el Crew file (`crew-file.spec.ts`, desde C.6a: `/#crew-file` y `/es#crew-file` con el título bajo la barra, el raíl en su parada, el HUD escondido y el pie del canal; la parada del raíl con el foco en su título; es el final de la página (nada debajo); «Download CV» y el email en EN y ES, con el PDF servido; a 390 px sin scroll lateral y el CV antes de la ficha; a 360 y 390 px con la letra al 200 %, en EN y ES, nada se corta; a 844×390 y 800×360 el raíl entero bajo la barra, con paradas de 24 px o más; con movimiento (también a 844×390) el teletipo escribe todas las líneas; con movimiento reducido nada tapado; sin WebGL, entero (ninguna línea tapada) sobre la foto del retrato; con el teclado, lo enfocado nunca queda tapado por el teletipo; a 915×412 el raíl solo con puntos y el HUD escondido; Contacto ya sin la formación ni el pie; a 1280×720 en ES y 1440×900 en EN, el visor centrado con el lienzo, el título y los campos a sus lados sin pisarlo, las líneas guía hasta el marco, el email y «Download CV» en la misma fila a los lados del visor y el marco pegado al centro al bajar; a 390 y 1024 px, el visor con la proporción del retrato y centrado con él; la llegada (ADR-039): fija bajo la barra mientras dura, con el raíl en el Crew file desde que empieza y suelta después; el ancla y el raíl aterrizan al final de la llegada (a 1 px), el raíl con scroll suave (muchos valores entre medias); entrando por el ancla, el primer Tab va a «Download CV»; cambiar de idioma a mitad de la llegada aterriza en `/es#crew-file`; con el teclado, lo enfocado entero con su anillo (también a 390×844 con Tab y Shift+Tab, con el escenario más alto que la ventana); sin llegada con movimiento reducido; sin WebGL, la foto pasa al retrato con la forma (al 20 %, la Tierra; al 35 %, el retrato); en alto contraste, la sección y su escenario sobre `Canvas` (Chromium); sin JS, la parada del raíl lleva al marcador (`journey.spec.ts`), y el escenario del Crew file más alto que la ventana a 1280×720, para que el Tab lo pruebe (`journey.spec.ts`); el retrato no se descarga al empezar, llega del worker desde la tortuga y se pinta sin avisos de WebGL, y si sus imágenes no llegan, la Tierra se queda —en `scene.spec.ts`—); hasta F5, una ficha tapa la escena con el velo y la pausa, y al volver sigue (`scene.spec.ts`); en un móvil apaisado (844×390 y 667×375) el raíl entero queda bajo la barra (`chrome.spec.ts`); las fotos fijas del modo sin WebGL (`budgets.spec.ts`: cada una ≤ 200 KB, salen al build como archivos y no en base64, y su huella coincide con la escena; `scene.spec.ts`: la del capítulo y el encaje en cinco tamaños, sin pedir la otra variante —también en WebKit—, nunca con escena ni en las fichas, la que releva a una escena que cae a mitad de visita, y el raíl encuentra el capítulo y no su foto (`data-still-chapter`); `project-images.spec.ts` no las cuenta como capturas de proyecto, con un control positivo de su regex) |
| Regresión visual (Playwright + Docker) | Un estado por capítulo y por tamaño de referencia | Ver «Regresión visual», abajo |
| Lighthouse CI | Rendimiento, accesibilidad, SEO | Presupuestos de abajo |

**Cobertura mínima** (falla el CI por debajo): 90 % en `src/lib`, `src/content`, `src/scene/{shapes,math,config,worker}`
y las piezas de la escena con `strict: true` en la tabla única de la escena (`scripts/sceneModules.ts`; hoy todas, con
los shaders: también `SceneRoot`, `CameraRig`, `Particles`, `BackgroundStars` y `useSceneShapes`, que pasaban sin
estar en la lista), medido archivo a archivo (`perFile`: uno flojo no se esconde detrás de los demás; fuera, la
entrada del worker, `shapes.worker.ts`: solo conecta el mensaje con `handleShapesRequest` o `handlePortraitRequest`),
`scripts/docsOnly.ts`, el criterio de los commits de solo docs (ADR-033), y `scripts/siteTelemetry.ts`, el contador de
las cifras de Mission control (ADR-035; el resto de `scripts/` no se mide); 70 % global de líneas. **Una carpeta nueva
de `scene/` se clasifica en esa tabla** (`impure`, `strict` y `stills`, con el motivo escrito de lo que no va): de
ella salen el glob del 90 % de `vitest.config.ts`, `IMPURE_SCENE_MODULES` de `eslint.config.js` y la parte de
`scene/` de la huella de las fotos fijas, y `sceneModules.test.ts` falla si una carpeta no está o si `impure` no casa
con sus imports. Los shaders no se listan: sus tests los leen con `import.meta.glob`.

## Regresión visual

Una captura por capítulo (inicio, About, Skills, Projects, Contact y el Crew file) y por interludio (Mission log y
Mission control) en 1440×900 (`desktop`) y 390×844 (`mobile`, táctil), a densidad 1, y una del modo sin WebGL (Skills,
con su foto fija sobre el degradado y el aviso; ADR-029): 18 referencias en `tests/visual/__screenshots__/<proyecto>/`
(`tests/visual/chapters.spec.ts`, `playwright.visual.config.ts`). Solo Chromium. En la de Mission control van tapadas
las cifras de la telemetría y su mes (`data-telemetry`; el rótulo «Telemetry · this site» sí se ve): cambian con cada
test o ADR nuevo y cada mes (las comprueba su e2e). La del epílogo espera al retrato pintado (`data-portrait="painted"`)
y tapa el año de la firma (`data-site-year`): cambia cada 1 de enero.

- **Siempre en la imagen de Playwright** (ADR-010): `npm run visual` lanza Docker con
  `mcr.microsoft.com/playwright:v<versión de @playwright/test>-noble` y dentro instala, construye y captura
  (`scripts/visual-in-docker.sh`), con los `node_modules` de Linux en un volumen de Docker propio
  (`cosmos-portfolio-visual-node-modules`). Por eso las referencias no llevan el sistema en el nombre. El job
  `Visual regression` del CI usa la misma imagen y el build del job `Build`. Si la imagen no trae el Node de
  `.nvmrc`, el script lo avisa e instala sin `engine-strict` (solo cambia con qué se construye; pinta el navegador
  de la imagen). Dentro, Node resuelve `localhost` con IPv4 primero (`--dns-result-order=ipv4first`): en Docker
  Desktop, sin eso, el pre-renderizado del build no llega a su propio servidor (`ECONNREFUSED 127.0.0.1`).
- **Quieta para la foto:** con movimiento reducido (el reloj de la escena no avanza ni hay oscilaciones, y la
  interfaz no anima) y entrando por el ancla de cada capítulo (la escena arranca en su `m`), tras las partículas
  pintadas y las fuentes. Siempre en Bajo (el spec lo comprueba; salvo la del modo sin WebGL, que no tiene escena): en la imagen, Chromium pinta con SwiftShader y
  lo dice en su `renderer`, así que el sitio iría al modo sin WebGL (ADR-029); presentado como GPU, en escritorio
  arrancaría en Alto o Medio según los núcleos (en Docker Desktop, Alto), y SwiftShader no llega a 45 fps, así
  que la degradación en caliente cambiaría el nivel a mitad de la foto. El spec se presenta como GPU con poca
  memoria (`forceLowScene`, el mismo de los e2e: `renderer` de GPU inventado y `deviceMemory` 2), y la elección
  inicial da Bajo, el suelo. No vigila lo que solo se ve en movimiento.
- **Tolerancia estrecha** (la misma imagen y el mismo build pintan igual), sin reintentos: un píxel cuenta como
  distinto si su color cambia más de un 5 % (`threshold` 0,05; el de Playwright por defecto, 0,2, dejaba pasar un
  ~20 % de brillo, y bajar un 15 % el alfa de las partículas pasaba en verde) y se toleran 50 píxeles distintos
  por captura (algún borde que SwiftShader redondee distinto). Las dos cifras, con nombre en
  `playwright.visual.config.ts`.
- **Solo en Docker:** la config se niega a correr fuera de la imagen (sin `CI` ni la variable que pone
  `scripts/visual.ts`): unas referencias de Windows con el mismo nombre harían fallar el CI sin pista clara. El
  arranque de Docker lo comparte con `npm run stills` (`scripts/playwrightImage.ts`; dentro, los dos instalan y
  construyen con `scripts/prepare-in-docker.sh`).
- **Al cambiar algo visible a propósito:** `npm run visual:update`, mirar las PNG nuevas y commitearlas con el
  cambio. Sin más argumentos, borra antes todas las referencias (no queda ninguna sin test); los argumentos van a
  Playwright (`npm run visual -- --grep about` repite un capítulo, y con `--update` y cualquier otro argumento solo
  rehace lo que casa y deja las demás). La espera a la escena antes de cada foto tiene su propio plazo, 60 s (el
  test, 90 s): el primer test de una tanda arranca en frío en Docker y se pasaba de los 15 s de `expect` aunque la
  foto saliera bien. Aun así, sin argumentos una referencia que falla se queda borrada (S36): en local,
  `npm run visual:update -- --workers=1` rehace sin borrar. Si el CI falla, su informe (`playwright-report-visual`) trae la
  referencia, la captura y la diferencia.

## Presupuestos (Lighthouse CI y tamaño)

| Métrica | Límite |
|---|---|
| JS inicial (sin escena), gzip | **Framework ≤ 112 KB** (las dependencias del JS inicial, chunk `entry.client` o `framework`; 107,3 KB en F2.4; las de la escena van en su chunk diferido) + **código propio ≤ 40 KB por página** (home 17,4 · proyecto 12,6 · 404 7,0 KB en F2.4; la home, 35,5 KB en C.2 con el Mission log: el tope pasa de 35 a 38 KB por las secciones de la fase C; 38,4 KB en C.4 con Mission control, sobre todo sus textos en los dos idiomas: pasa a 40 KB, con margen para el Crew file de C.6; 34,7 KB en C.5, con el detalle de las fichas fuera de la home —ADR-036—, y la ficha, 33,8 KB al sacar el detalle y 35,4 KB con la de Cosmos completa; la home, 35,5 KB en C.6a con el Crew file). Alarma propia, no requisito externo (mandan los Core Web Vitals y Lighthouse del brief). E2E `budgets.spec.ts` sobre el build, en **todos** los HTML del build (ADR-020) |
| CSS (hoja única), gzip | ≤ 50 KB (ADR-019: por encima, revisar si conviene volver a partirla; 4,3 KB en F2.4). E2E `budgets.spec.ts` sobre la hoja que piden las páginas |
| Chunk de la escena, gzip | ≤ 260 KB desde F4.3 (ADR-032; antes, 250 KB) (Three.js, React Three Fiber y `SceneRoot`; 241,6 KB en F3.1 con el lienzo vacío y en F3.2 con las formas pedidas, casi todo Three.js entero; 248,2 KB en F3.3 con las partículas, sus shaders y las estrellas; 247,0 KB con los shaders sin comentarios, antes de F3.4; 248,0 KB en F3.4 con la cámara; 248,1 KB con el color de fondo sin linealizar y el reajuste de las partículas y del shader; 248,4 KB en F3.5 con el suavizado de `m` y la pausa; 249,0 KB en F3.6 con la degradación en caliente; 249 066 B en F4.2; 252 535 B en F4.3b con las constelaciones y sus etiquetas, 252 594 B con el retoque de las figuras tras su auditoría y 252 738 B con las correcciones de la segunda; 252 910 B en F4.3c con el puntero de las etiquetas; 253 037 B en C.3 con 37 estrellas y 253 040 B con las correcciones de las auditorías de C.2 y de F4.3c; 253 071 B tras la sesión 38 (C.4); 253 069 B en C.5; 253 121 B en C.6a (el raíl que encoge); 254 088 B en C.6b con el retrato, del margen, y 254 340 B con la corrección de su auditoría (quedan 5 660 B: ~0,16 KB de margen tras F4.4 y F4.5); 254 731 B en F4.4a, 256 460 B en F4.4b y 256 481 B con la corrección de la auditoría de F4.4a, 256 630 B con la de F4.4b y 257 074 B en F4.5, el Sol, 257 075 B con la corrección de su auditoría y 257 127 B con la de la auditoría de cierre de F4; 257 312 B en C.7 con la llegada del epílogo y 257 340 B con la corrección de su auditoría (medido antes sobre `main`, 257 367 B: los nombres con hash de los chunks; quedan 2 660 B); por paquete, con `source-map-explorer --gzip` tras F4.3b, en KiB: three 167,9, React Three Fiber 53,6 y lo suyo 3,5, el código propio 13,7 y ~8 de saltos de línea y código sin origen; ADR-032 fija un tope por paso: F4.3a + F4.3b ≤ 3,6 KB, F4.3c ≤ 1 KB, F4.4 ≤ 2,5 KB, F4.5 ≤ 3 KB). E2E `budgets.spec.ts`: lo sigue desde el import dinámico, exige que ningún HTML lo pida y que los shaders lleguen sin el texto de sus comentarios |
| Lo que la escena carga aparte, gzip | **Worker de las formas ≤ 10 KB** (4,4 KB en F3.2; 6,0 KB en C.6b, con el retrato) y **generadores del reintento ≤ 10 KB** (el mismo código en su chunk; 3,8 KB). E2E `budgets.spec.ts`: clasifica cada `import()` y `new URL(…)` que sale de la escena; uno sin clasificar (o con una ruta que no se puede leer) hace fallar el test |
| Fuentes (todas, woff2 subconjunto latino) | ≤ 150 KB (e2e `budgets.spec.ts` desde F2; Lighthouse CI en F6) |
| Imágenes (cada variante que ofrecen las páginas: AVIF, WebP y JPEG para compartir) | ≤ 200 KB por archivo (148 KB la mayor en F2.8). E2E `budgets.spec.ts` sobre las que piden los HTML del build |
| Fotos fijas del modo sin WebGL (AVIF y WebP, ADR-029) | ≤ 200 KB por archivo (~160 KB la mayor en F3.9, la WebP de la galaxia de escritorio); ningún HTML las pide y su huella coincide con la escena (`stills.json`). E2E `budgets.spec.ts` |
| Imágenes del retrato (la foto y el paquete de profundidad; las descarga el worker) | ≤ 200 KB por archivo (63 KB la foto y 89 KB el paquete en C.6b, sin metadatos). E2E `budgets.spec.ts` sobre las del build; que solo lleven píxeles y midan lo que dice `PORTRAIT_FRAME`, `shapeContract.test.ts` |
| LCP móvil (simulado) | < 2,5 s |
| CLS | < 0,1 |
| TBT | < 200 ms |
| Lighthouse móvil | Performance ≥ 85 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 95 |

### Mediciones

Hasta F6, Lighthouse se pasa a mano al cerrar cada fase (`npx lighthouse@<versión exacta>`, perfil móvil por
defecto, sobre `npm run build` + `npm run preview`) y se apunta aquí; en F6 lo sustituye Lighthouse CI. En local se
hacen tres pasadas por página y se apunta la mediana: la primera tras arrancar `npm run preview` sale en frío.

**Cierre de F2 (`v0.1.0`) · Lighthouse 13.5.0 · móvil simulado · build local**

| Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 93 | 100 | 100 | 100 | 2,7 s | 0 | 50 ms |
| `/es` | 92 | 100 | 100 | 100 | 2,7 s | 0 | 0 ms |
| `/projects/chessmate` | 94 | 100 | 100 | 100 | 2,6 s | 0 | 10 ms |
| `/es/projects/astrohub` | 95 | 100 | 100 | 100 | 2,6 s | 0 | 0 ms |
| `/projects/cosmos` | 96 | 100 | 100 | 100 | 2,4 s | 0 | 0 ms |
| `/404` | 97 | 100 | 100 | 54 | 2,4 s | 0 | 0 ms |

**Cierre de F2 · PageSpeed Insights (Lighthouse 13.5.0, Moto G Power emulado, 4G lenta) · producción en Vercel ·
2026-10-26**

| Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 97 | 100 | 100 | 100 | 2,3 s | 0 | 0 ms |
| `/projects/chessmate` | 98 | 100 | 100 | 100 | 2,1 s | 0 | 0 ms |

- La 404 no puntúa en SEO a propósito: lleva `noindex` y no tiene descripción (no se indexa).
- LCP de las fichas: la portada (`fetchpriority="high"`, sin `loading="lazy"`, ya en el HTML inicial); casi todo
  el tiempo es retraso de render, no descarga. En la home, el texto de entrada del hero (~2,2 s de retraso de
  render en local). En local, la home y las fichas de Chessmate y AstroHub pasan algo del presupuesto de LCP
  (< 2,5 s); en producción (CDN de Vercel) quedan dentro. Se vigila en F6 con Lighthouse CI y en un móvil real.
- Aviso sin peso en la nota: `label-content-name-mismatch` en EN / ES (se ve «EN», el nombre es «English»,
  `componentes.md`). Se revisa con NVDA y control por voz en F6.

**Antes del cierre de F3 · 2026-10-29 · con la escena pintada por software** (motivo de ADR-029; repetida
al implementarlo: «Cierre de F3», abajo)

| Medida | Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| PageSpeed (Lighthouse 13.6.0, Moto G Power, 4G lenta), producción | `/` | 88 | 100 | 100 | 100 | 0,9 s | 0 | 450 ms |
| PageSpeed, producción | `/projects/cosmos` | 83 | 100 | 100 | 100 | 0,8 s | 0 | 660 ms |
| Lighthouse 13.5.0, móvil simulado, build local (contenedor Linux, sin GPU) | 5 indexables | 63–64 | 100 | 100 | 100 | 2,6–2,8 s | 0 | 4,8–7,4 s |
| Lo mismo con WebGL desactivado (`--disable-3d-apis`) | `/` | 94 | 100 | 100 | 100 | 2,7 s | 0 | 0 ms |

- Las tareas largas son de `SceneRoot`: ~1 s al montar la escena y 60–180 ms por frame (SwiftShader en el hilo
  principal). Chromium sin GPU da contexto con `failIfMajorPerformanceCaveat`, así que la escena no se ve como
  «por software» y arranca (en Bajo, por la pantalla de móvil). La 404 local: 67 y SEO 54 (`noindex`, a propósito).
- `npm audit`: 0 vulnerabilidades.

**F3.6c · fps de la escena · 2026-10-28** (fragmento de consola fuera del repo: frames del navegador con
`requestAnimationFrame`, 5 s quieto en cada capítulo tras 2,5 s de asentarse y el viaje entero con scroll continuo
en 12 s; producción, `tortoisecode.dev`)

| Equipo | Nivel | Inicio | About | Skills | Projects | Contact | Viaje (scroll) | p95 · peor |
|---|---|---|---|---|---|---|---|---|
| Windows, Brave (Chromium 156), 6 núcleos, ventana 1029×637 a DPR 1,5 | Alto | 60 | 60 | 60 | 60 | 60 | 60 | 16,8 ms · 17,5 ms |

- Sin bajar de nivel en ningún tramo (la degradación en caliente no saltó). 60 es el refresco de la pantalla: la
  medida no dice cuánto margen queda. Brave no da el nombre de la GPU (protección contra huellas).
- Queda por medir (F6): un móvil real (≥ 30 fps en Bajo), una ventana maximizada y Firefox/Safari.

**Cierre de F3 (`v0.2.0`) · 2026-10-30 · Lighthouse 13.6.0** (con ADR-029: el WebGL pintado por software apaga la
escena)

| Medida | Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| PageSpeed (Moto G Power, 4G lenta), producción | `/` | 100 | 100 | 100 | 100 | 0,9 s | 0 | 0 ms |
| PageSpeed (Moto G Power, 4G lenta), producción | `/projects/cosmos` | 100 | 100 | 100 | 100 | 0,8 s | 0 | 0 ms |
| PageSpeed (escritorio), producción | `/` y `/projects/cosmos` | 100 | 100 | 100 | 100 | 0,2 s | 0 | 0 ms |
| Móvil simulado, build local (contenedor Linux, sin GPU) | `/` | 99 | 100 | 100 | 100 | 0,8 s | 0 | 90 ms |
| Lo mismo | `/es` | 99 | 100 | 100 | 100 | 0,8 s | 0 | 80 ms |
| Lo mismo | `/projects/chessmate` | 96 | 100 | 100 | 100 | 2,8 s | 0 | 50 ms |
| Lo mismo | `/es/projects/astrohub` | 95 | 100 | 100 | 100 | 2,8 s | 0 | 70 ms |
| Lo mismo | `/projects/cosmos` | 100 | 100 | 100 | 100 | 0,8 s | 0 | 30 ms |
| Lo mismo | `/404` | 100 | 100 | 100 | 54 | 0,8 s | 0 | 10 ms |

- PageSpeed y el contenedor no tienen GPU: la escena se apaga sin descargar Three.js ni las fotos fijas: solo corren
  la detección (`lib/device/webgl2`) y la elección de nivel (`lib/device/sceneLevel`). Por eso vuelve a las cifras de F2 o mejores (el
  2026-10-29, con la escena pintada por software: 88 y 83 en PageSpeed y 63–64 en local). Estas medidas son del
  modo sin WebGL; la escena con GPU se mide en fps («F3.6c · fps de la escena»).
- Build local: mediana de tres pasadas por página. La primera tras arrancar `npm run preview` sale en frío (`/` 80,
  TBT 700 ms) y no se apunta.
- LCP: Lighthouse 13.6.0 da 0,8 s en `/` y la 13.5.0, con el mismo build y el mismo elemento (el párrafo de entrada
  del hero), 2,4–2,7 s. La bajada frente a F2 es del cambio de versión de Lighthouse, no del código. Las fichas de
  Chessmate y AstroHub siguen algo por encima de 2,5 s en local (la portada), como en F2; en producción, dentro.
- PageSpeed trae una categoría nueva, «Navegación agéntica» (en desarrollo): 2/2 en las dos páginas.
- `npm audit` (completo y con `--omit=dev`): 0 vulnerabilidades.

**Cierre de la fase C · 2026-11-23 · Lighthouse 13.6.0** (build de `main` en `4570576`; la misma versión y las
mismas páginas que en F3; sin PageSpeed hasta F6)

| Medida | Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| Móvil simulado, build local (contenedor Linux, sin GPU) | `/` | 98 | 100 | 100 | 100 | 0,8 s | 0 | 160 ms |
| Lo mismo | `/es` | 99 | 100 | 100 | 100 | 0,8 s | 0 | 94 ms |
| Lo mismo | `/projects/chessmate` | 95 | 100 | 100 | 100 | 2,8 s | 0 | 69 ms |
| Lo mismo | `/es/projects/astrohub` | 95 | 100 | 100 | 100 | 2,9 s | 0 | 15 ms |
| Lo mismo | `/projects/cosmos` | 100 | 100 | 100 | 100 | 0,8 s | 0 | 16 ms |
| Lo mismo | `/404` | 100 | 100 | 100 | 54 | 0,8 s | 0 | 0 ms |

- Chrome for Testing 153 sin cabeza y sin GPU: la escena se apaga sin descargar Three.js ni las fotos fijas (ninguna
  de las 18 peticiones de `/` es de la escena). Mide el modo sin WebGL, como en F3.
- Mediana de cada medida en tres pasadas por página. La primera tras arrancar `npm run preview` (`/`, 90, TBT
  396 ms) no se apunta.
- Frente a F3, la home pierde un punto (99 → 98) y su TBT sube de 90 a 160 ms con las secciones de la fase C (Mission
  log, Mission control y Crew file; 570 elementos en el DOM de `/`). Lejos del mínimo del brief (Performance ≥ 85).
  Las fichas de Chessmate y AstroHub, como en F3: la LCP (la portada) algo por encima de 2,5 s en local.
- La 404 da SEO 54 a propósito, como en F3: `noindex` y sin meta description.
- `npm audit --omit=dev`: 0 vulnerabilidades. El completo da 10 moderadas, todas de herramientas de lint (nada llega
  al build): `minimatch` 10.2.6 (GHSA-g3hv-75wg-m249) a través de `eslint` 10.12.0, `typescript-eslint` 8.71.1 y
  `eslint-plugin-jsx-a11y-x` 0.2.0. `npm audit fix` no lo arregla y `--force` propone bajar
  `eslint-plugin-jsx-a11y-x` a 0.1.1: no se aplica. Resuelto el mismo día en `chore/deps-2026-11`: `eslint` 10.15.0,
  `typescript-eslint` 8.73.0 y `minimatch` 11.0.9 para el plugin (`overrides`; `stack.md` → «Conflictos»): 0
  vulnerabilidades en los dos.

**Cierre de F4 (`v0.3.0`) · 2026-11-23 · Lighthouse 13.6.0** (build de `main` en `af5df93` con la versión 0.3.0; las
mismas páginas que en F3 y en la fase C)

| Medida | Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| Móvil simulado, build local (contenedor Linux, sin GPU) | `/` | 99 | 100 | 100 | 100 | 0,8 s | 0 | 101 ms |
| Lo mismo | `/es` | 99 | 100 | 100 | 100 | 0,8 s | 0 | 133 ms |
| Lo mismo | `/projects/chessmate` | 96 | 100 | 100 | 100 | 2,8 s | 0 | 53 ms |
| Lo mismo | `/es/projects/astrohub` | 95 | 100 | 100 | 100 | 2,8 s | 0 | 113 ms |
| Lo mismo | `/projects/cosmos` | 100 | 100 | 100 | 100 | 0,8 s | 0 | 11 ms |
| Lo mismo | `/404` | 100 | 100 | 100 | 54 | 0,8 s | 0 | 0 ms |

- Chrome for Testing 153 sin cabeza y sin GPU: la escena se apaga sin descargar Three.js ni las fotos fijas, así que mide
  el modo sin WebGL, como en F3 y en la fase C. La escena con GPU se mide en fps (abajo).
- Performance y LCP iguales que en el cierre de F3; frente a la fase C, la home 98 → 99 y Chessmate 95 → 96 (dentro
  del ruido de tres pasadas). Lo que F4 suma al JS inicial (el bucle del Big Bang del hero y el puntero de Skills y de
  las filas) no mueve la nota.
- Las fichas de Chessmate y AstroHub, LCP algo por encima de 2,5 s en local (la portada), y la 404 SEO 54 (`noindex`
  y sin meta description), como en F3 y en la fase C.
- Mediana de cada medida en tres pasadas por página; la primera de `/` tras arrancar `npm run preview` (90) no se
  apunta.
- `npm audit` (completo y con `--omit=dev`): 0 vulnerabilidades.

**PageSpeed (Lighthouse 13.6.0) · producción · 2026-11-23**

| Medida | Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| Móvil (Moto G Power, 4G lenta) | `/` | 98 | 100 | 100 | 100 | 0,9 s | 0 | 0 ms |
| Móvil (Moto G Power, 4G lenta) | `/projects/cosmos` | 100 | 100 | 100 | 100 | 0,9 s | 0 | 0 ms |
| Escritorio | `/` | 100 | 100 | 100 | 100 | 0,2 s | 0,002 | 0 ms |
| Escritorio | `/projects/cosmos` | 100 | 100 | 100 | 100 | 0,2 s | 0 | 0 ms |

- La home en móvil dio 98 por el Speed Index: 4,4 s, con FCP y LCP en 0,9 s (el SI de F3 no se apuntó; el de la ficha
  de Cosmos en esta misma medida, 1,2 s). **Medido al corregir la auditoría de cierre (2026-11-24): es ruido de
  PageSpeed, no la página.** Cinco pasadas de `/` en móvil (Chrome 157): SI 4,49 · 2,75 · 1,20 · 1,22 · 1,11 s, con el
  FCP simulado en 0,9 s en las cinco y Performance 96 · 100 · 100 · 100 · 100. El SI que da PageSpeed sale sobre todo
  del SI *observado* en su propia carga, que sigue a la red real: la primera pasada, en frío, observó la primera
  pintura a 2,58 s; las tres últimas, a 0,14–0,19 s. En las cinco, el SI observado queda 0,13–0,23 s por encima de la
  primera pintura observada: después de ella la pantalla casi no cambia (el aviso sin WebGL y el latido del halo no
  pesan; `non-composited-animations`, 0). No se toca código.
- «Navegación agéntica»: 2/2 en las dos páginas.

**Cierre de F4 · aceptación de los capítulos 0–4** (`docs/02-experiencia/capitulos/00–04`, cada criterio con su test o
su medida; revisado en la auditoría de cierre)

| Criterio | Test o medida | Veredicto |
|---|---|---|
| 0.1 Primera pintura: nombre, rol, frase, botón y punto | `journey.spec.ts` («the first paint of the hero is whole without JavaScript»; el viaje sin JS); `Hero.test.tsx` | Prueba |
| 0.2 Mantener 1,5 s detona; soltar antes descarga | `journey.spec.ts` (detonar y «a short click does not detonate», que suelta con la carga ya subiendo); `charge.test.ts`; `useHoldCharge.test.tsx` | Prueba |
| 0.3 Ratón, táctil y Espacio | `journey.spec.ts`; `HoldButton.test.tsx` | Prueba |
| 0.4 Arriba otra vez, se rearma | `journey.spec.ts`; `useHoldCharge.test.tsx` | Prueba |
| 1.1 Contraste AA sobre la nebulosa | `styles.test.ts` (el velo sólido sobre una escena blanca); el degradado radial de escritorio, medido a mano en F4.2 (`design-system.md`) | Prueba en móvil; medida a mano en escritorio |
| 1.2 La nebulosa no cambia de forma | `content.test.ts`; `mapM.test.ts` | Prueba |
| 1.3 En móvil, la nebulosa completa | captura `mobile/chapter-1-about.png`; encuadre de F3.6c | Medida a mano |
| 2.1 Cada skill, una vez en el panel y una como estrella | `Skills.test.tsx`; `constellationLayout.test.ts`; `Constellations.test.tsx` | Prueba |
| 2.2 Enciende la correcta y solo esa | `constellations.spec.ts`; `Constellations.test.tsx` (los uniforms de todos los grupos) | Prueba |
| 2.3 Etiquetas fuera del raíl y dentro de pantalla, en 3 tamaños | `constellations.spec.ts`; `constellationLayout.test.ts` | Prueba |
| 3.1 Placa, pin y fila; hasta 7 sin tocar la escena | `plateSlots.test.ts`; `plates.spec.ts`; `Projects.test.tsx` | Prueba |
| 3.2 Fila → su placa, solo esa | `plates.spec.ts` (también más de un turno del ciclo sin que cambie la placa) | Prueba |
| 3.3 Enlaces de la fila sin escena | `plates.spec.ts` («without WebGL the links of a row work»); `Projects.test.tsx`; el viaje sin JS | Prueba |
| 3.4 Tortuga y pins fuera del raíl | pins: `plates.spec.ts`; tortuga: encuadre de F3.6c | Pins, prueba; tortuga, medida a mano |
| 4.1 Email: copiar y seleccionar a mano | `CopyButton.test.tsx`; `Contact.test.tsx` (también el contrato de `user-select: all`); `quick-mission.spec.ts` | Prueba |
| 4.2 CV solo si existe el PDF | `Contact.test.tsx`; `journey.spec.ts` | Prueba |
| 4.3 Disponibilidad desde el perfil | `Contact.test.tsx` | Prueba |

**Cierre de F4 · fps de la escena · 2026-11-23** (el fragmento de F3.6c, ahora también con el Crew file y el viaje en
14 s; producción, `tortoisecode.dev`)

| Equipo | Nivel | Inicio | About | Skills | Projects | Contact | Crew file | Viaje (scroll) | p95 · peor |
|---|---|---|---|---|---|---|---|---|---|
| Windows, Brave (Chromium 158), 6 núcleos, ventana 1280×800 a DPR 1,5, enchufado | Alto | 60 | 60 | 60 | 60 | 60 | 60 | 60 | 16,8 ms · 17,0 ms |
| Lo mismo, con el ahorro de energía (batería) | Bajo (bajó de Alto) | 30 | 30 | 30 | 30 | 30 | 30 | 30 | 33,5–33,7 ms · 34,1 ms |

- Con las constelaciones (Skills), las placas y sus pins (Projects), el Sol (Contact) y el retrato (Crew file), el
  mismo equipo de F3.6c sigue a 60 en Alto sin bajar de nivel, con una ventana mayor que la de F3.6c (1280×800 frente
  a 1029×637: ~56 % más píxeles). 60 es el refresco de la pantalla: la medida no dice cuánto margen queda. El fragmento
  es el de F3.6c con el Crew file y el viaje en 14 s (F3.6c, 12 s), guardado fuera del repo junto al de F3.6c.
- Con el ahorro de energía de Brave, el navegador pinta a 30 fps clavados y la degradación en caliente baja la escena
  a Bajo (30 < 45 de escritorio) aunque la GPU vaya sobrada: es el límite conocido de `rendimiento.md` →
  «Degradación en caliente», aceptado en F3.6 (con el ahorro de energía, gastar menos es lo que se pide) y confirmado
  aquí en un equipo real. Solo en escritorios y portátiles: un móvil arranca en Bajo y en Bajo no se mide.
- Queda por medir (F6): un móvil real (≥ 30 fps en Bajo), Firefox/Safari y una ventana a pantalla completa en un
  monitor grande.

## Definición de «hecho» (por tarea)

1. `npm run check` en verde y build correcto (un commit de solo docs, ADR-033: solo `npm run check`); `npm run visual` (Docker) si cambia algo visible y, si es a
   propósito, `npm run visual:update` y sus PNG; `npm run stills` (Docker) si cambian formas, shaders, cámara,
   niveles o proyectos (las placas), mirar las fotos y commitearlas (ADR-029); también si cambia cualquier archivo
   de `STILLS_SOURCES`, aunque sea un comentario (la huella lee el texto; con `budgets.spec.ts` antes del commit);
   `npm run og` si cambia algo de lo que se ve en la imagen para compartir o en los iconos (el nombre, el rol, el dominio, el favicon, los tokens, la foto fija de la tortuga, las fuentes o el propio generador), y commitear sus PNG y `og.json` (lo avisa `scripts/ogInputs.test.ts`, en `check`). Si el cambio toca la config de Vite o
   los imports especiales
   (`?project`, `?share`…), abrir también las páginas afectadas con `npm run dev`, sin errores en consola: los e2e
   prueban el build y Vitest sustituye esos imports (en F2.8, la ficha caía solo en desarrollo).
2. Tests nuevos para el comportamiento añadido, incluidos los casos límite.
3. Accesibilidad revisada (teclado, foco, lector) si toca interfaz.
4. Auditoría con mirada fresca (`code-audit` o la Mesa) antes de cerrar la fase.
5. `STATE.md` y, si aplica, `DECISIONS.md` y estos docs actualizados.
