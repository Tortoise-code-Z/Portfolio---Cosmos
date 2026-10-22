# Estados, carga y accesibilidad

## Secuencia de carga

1. **HTML pre-renderizado + CSS**: todo el texto visible y el hero completo (el punto y su halo, con CSS).
   Es lo que mide el LCP.
2. **JavaScript de la interfaz**: navegación, idioma, modo misión rápida, copiar email. Sin la escena.
3. **Escena en diferido**: el código 3D se descarga aparte (import dinámico) cuando el navegador está libre.
4. **Generación de partículas** en un Web Worker (no bloquea el hilo principal).
5. **Entrada del lienzo**: fundido de ~400 ms. En el hero, el punto de partículas coincide con el halo CSS, así que
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

- Con la pestaña oculta o el modo misión rápida abierto, la escena **no renderiza** (ahorro de batería).

## 404 «Lost in space»

- Título, frase y botón «Back to the start». La escena muestra la nebulosa atenuada y a la deriva.
- Responde con estado 404 real (configuración del hosting).

## Accesibilidad (resumen comprobable)

1. Contraste AA en todo el texto (el fondo de los paneles lo asegura sobre cualquier zona de la escena).
2. Navegación completa con teclado; foco visible; «Skip to content».
3. Un `<h1>` por página; jerarquía de encabezados sin saltos.
4. El lienzo es `aria-hidden`; nada interactivo existe solo en él.
5. Regiones `aria-live` para mensajes (copiado, aviso sin WebGL).
6. Lighthouse Accessibility ≥ 95 y revisión manual con lector de pantalla (NVDA) en la fase de pulido.
