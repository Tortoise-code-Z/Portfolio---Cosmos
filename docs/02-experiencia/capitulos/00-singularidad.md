# Capítulo 0 · Singularidad → Big Bang (Inicio)

## Propósito

Presentar quién eres en 3 segundos y dar el primer momento «wow». Tesis visual: antes de todo había un punto.

## Contenido (`textos-sitio.md` → `hero.*`, `perfil.md`)

- Kicker: alias, rol y stack.
- Nombre en dos líneas, gigante: **VÍCTOR / PÉREZ** (tipografía display, eje `wdth` estrecho en reposo).
- Frase: «Everything that exists started as a single point. So did my code.»
- Botón «Hold to detonate» con anillo de carga + pista «or scroll» con el icono de flecha abajo.
- El nombre es el `<h1>` de la página.

## Escena en reposo (`m = 0`)

- Fondo negro azulado; **sin estrellas de fondo** (aún no existen).
- Un único punto blanco incandescente en el centro, con un halo suave que late despacio.
- Todas las partículas están dentro de ese punto.

## Interacciones

**Mantén pulsado para detonar**
- Mientras se mantiene (ratón, dedo, o `Espacio`/`Enter` con foco en el botón) la carga sube de 0 a 1 en
  **1,5 s**; al soltar, baja a ritmo de 1,8/s.
- Con la carga: el punto crece y vibra, el halo se expande, la pantalla tiembla un poco y el nombre **se
  comprime** (el eje `wdth` baja): la energía se acumula.
- Al llegar a 1: **destello** radial blanco-ámbar (entre el lienzo y el texto: no tapa la lectura), la explosión
  y un desplazamiento automático suave hasta el capítulo 1, con el foco en su título
  (`estados-y-accesibilidad.md` → «Accesibilidad», punto 8). La carga se descarga sola; la detonación solo puede
  volver a cargarse si se regresa al inicio.
- Mantener pulsado en la zona vacía del hero también carga: no sobre el texto (se puede seleccionar, y en táctil el
  toque largo es del sistema) ni sobre enlaces y botones. Mientras carga desde la zona, el toque largo no abre el
  menú contextual.

**Scroll**
- El primer scroll ya inicia la explosión (ventana de morph desde el 0 %). El destello acompaña al comienzo.
- El nombre se ensancha de `wdth` 62 a 150 y se separan sus letras mientras sube y desaparece.

**Cursor**
- La gravedad del cursor existe pero, con todas las partículas en el punto, apenas se nota hasta la explosión.

## Layout

- **Escritorio:** contenido abajo a la izquierda, el punto centrado en la pantalla. El hero ocupa la altura de la
  ventana con margen inferior; el nombre no puede tapar el punto.
- **Móvil:** el mismo orden en una columna; el botón ocupa el ancho disponible si no cabe en línea.
- El kicker nunca se solapa con los acentos del nombre (margen superior en el `<h1>`).

## Accesibilidad y movimiento reducido

- El nombre accesible del botón es su texto visible («Hold to detonate», WCAG 2.5.3 «etiqueta en el nombre»);
  la explicación «Hold to trigger the Big Bang and start the journey» va como descripción (`aria-describedby`).
- Con movimiento reducido: sin temblor, sin destello y sin vibración; el botón funciona igual pero el
  desplazamiento al capítulo 1 es instantáneo. La explosión se sigue viendo al hacer scroll (la controla el
  usuario).
- Sin WebGL: el punto y el halo se dibujan con CSS, así que el hero se ve completo igual. Con escena, el punto
  es el de partículas y el halo sigue siendo el CSS (`estados-y-accesibilidad.md` → «Secuencia de carga»).
- Sin WebGL, el nombre (`wdth` y espaciado) y el halo siguen la carga y el scroll; el destello y el temblor solo
  existen con la escena, porque acompañan a la explosión de partículas (ADR-030).

## Aceptación

1. En la primera pintura (antes de cargar la escena) ya se ven el nombre, el rol, la frase, el botón y el punto.
2. Mantener 1,5 s detona y lleva al capítulo 1; soltar antes no hace nada salvo descargar.
3. Funciona con ratón, táctil y teclado (mantener `Espacio`).
4. Volver arriba del todo deja el hero listo para detonar otra vez.
