# Estados, carga y accesibilidad

## Secuencia de carga

1. **HTML pre-renderizado + CSS**: todo el texto visible y el hero completo (el punto y su halo, con CSS).
   Es lo que mide el LCP. En las fichas, el LCP es la portada (`Picture` con prioridad alta, sin `lazy`;
   `pagina-proyecto.md` punto 2).
2. **JavaScript de la interfaz**: navegación, idioma, modo misión rápida, copiar email. Sin la escena.
3. **Escena en diferido**: el código 3D se descarga aparte (import dinámico) cuando el navegador está libre.
4. **Generación de partículas** en un Web Worker (no bloquea el hilo principal).
5. **Entrada del lienzo**: fundido de ~400 ms (`--dur-fade-slow`; 150 ms con movimiento reducido). En el hero, el punto de partículas coincide con el halo CSS, así que
   el relevo no se nota.
6. Si el usuario ya había hecho scroll, la escena arranca en el `m` actual, sin repetir la explosión.

No hay pantalla de carga ni porcentajes: el contenido nunca espera a la escena.

## Sin WebGL (o si falla)

- Se detecta al iniciar; ante cualquier error de contexto o de shader, se desmonta la escena y se marca el
  documento con una clase (`no-gl`).
- Fondo: degradado estático del espacio en CSS; hero con el punto CSS.
- Aviso discreto, una sola vez: «Your browser can't show the 3D universe, but everything else is here.»
- Todo lo demás funciona igual (raíl, HUD, misión rápida, páginas de proyecto).
- Pérdida de contexto WebGL en caliente (`webglcontextlost`): se intenta restaurar una vez; si no, modo sin WebGL.

## Movimiento reducido (`prefers-reduced-motion: reduce`)

| Se mantiene | Se quita |
|---|---|
| Interfaz: fundidos de opacidad, en 150 ms (`--dur-fade-*`) | Interfaz: el resto de transiciones (color, desplazamiento) pasa a 0 ms (`--dur-fast/base/slow/flight`) |
| Morph de formas ligado al scroll (lo controla el usuario) | Temblor, destello y vibración del hero |
| Iluminación de constelaciones y placas | Giro autónomo de nebulosa, galaxia y Tierra; nado de la tortuga |
| Detonación (sin efectos) | Gravedad del cursor; ciclo automático de placas |
| | Scroll suave en saltos (pasa a instantáneo) y vuelo de cámara a proyectos |

## Táctil y móvil

- Sin hover: los encendidos se activan con un toque y se apagan tocando fuera.
- Sin gravedad de cursor (no hay puntero fino).
- Paneles no *sticky*; primero se ve la escena y luego sube el texto.
- La detonación funciona manteniendo el dedo; se evita el menú contextual y la selección de texto en el botón.

## Niveles de rendimiento

La escena elige un nivel al arrancar y puede **bajarlo** si los fps reales caen de forma sostenida (nunca lo
sube a mitad de visita para no causar tirones). Valores en `docs/04-escena/`.

| Nivel | Cuándo | Efecto |
|---|---|---|
| Alto | Escritorio con GPU dedicada o integrada moderna | Todas las partículas, DPR hasta 2 |
| Medio | Portátil modesto o fps bajos sostenidos | Menos partículas, DPR hasta 1,5 |
| Bajo | Móvil, `saveData`, poca memoria | Partículas mínimas, DPR 1, sin estela |
| Apagado | Sin WebGL o fallo | Modo sin WebGL |

## Pestaña oculta y modo misión rápida

- Con la pestaña oculta o el modo misión rápida abierto, la escena **no renderiza** (ahorro de batería). Desde
  F2.6, `uiStore` sabe si el modo está abierto (`quickMissionOpen`); la escena lo leerá en F3.
- El modo es un `<dialog>` modal: el resto de la página queda inerte (ni Tab ni lector), el foco entra en «Close
  quick mission» y vuelve al botón de la barra al cerrar, y el fondo no se desplaza.
- El visor de la galería de una página de proyecto es otro `<dialog>` modal: el foco entra en «Close», vuelve a la
  miniatura de la imagen que se veía al cerrar (con «Close» o `Esc`) y el fondo no se desplaza. Al abrir, el
  lector dice qué imagen es (la descripción del diálogo es su región `status`).

## 404 «Lost in space»

- Título, frase y enlace «Back to the start», centrados (sin barra ni raíl: solo hay un camino, volver). La escena
  muestra la nebulosa atenuada y a la deriva (desde F3).
- Responde con estado 404 real (configuración del hosting).

## Accesibilidad (resumen comprobable)

1. Contraste AA en todo el texto (el fondo de los paneles lo asegura sobre cualquier zona de la escena).
2. Navegación completa con teclado; foco visible; «Skip to content».
3. Un `<h1>` por página; jerarquía de encabezados sin saltos.
4. El lienzo es `aria-hidden`; nada interactivo existe solo en él.
5. Regiones `aria-live` (`role="status"`) para mensajes: copiado del email y de las cuentas de demo, sugerencia de
   idioma, la imagen del visor y, desde F3, aviso sin WebGL. Existen desde el principio (vacías) para que el lector
   anuncie lo que aparece; la del visor nace con el visor abierto, así que además describe el diálogo
   (`aria-describedby`) para que se oiga al abrir.
6. Lighthouse Accessibility ≥ 95 y revisión manual con lector de pantalla (NVDA) en la fase de pulido.
7. Las listas sin viñetas declaran `role="list"`: Safari quita el rol a un `<ul>` o `<ol>` con `list-style: none` y
   VoiceOver deja de anunciar «lista, 3 elementos». ESLint (`jsx-a11y-x/no-redundant-roles`) lo permite en `<ul>`
   y `<ol>` (el raíl), también dentro de `<nav>`.
8. En el viaje, los saltos que mueven la vista (la detonación del hero, el raíl, Projects y Contact de la barra, el
   chip «Open to work», el logo y «Skip to content») llevan también el foco al título del destino
   (`tabindex="-1"` y `focus({ preventScroll: true })`), como un enlace de salto. Desde una página de proyecto,
   «Projects» y «Back to the shell» dejan el foco en la fila de ese proyecto, el logo, el chip y Contact no lo
   mueven y «Skip to content» va al nombre del proyecto; llegar a una ficha con un enlace deja el foco en su nombre
   (navegacion.md → «Teclado y foco»). Límite conocido: en modo
   exploración, NVDA y JAWS activan con un clic sintético, que el botón de mantener ignora (un clic corto no hace
   nada); esos usuarios avanzan por encabezados. Se revisa con NVDA en F6.
