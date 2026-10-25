# Página de proyecto (`/projects/:slug`)

## Propósito

Dar a cada proyecto una página propia, compartible e indexable, con todo el detalle que un tech lead quiere ver,
sin romper la sensación de estar dentro del mismo universo.

## Transición desde la tortuga

1. Clic en «View project» o en un pin → la placa del proyecto se ilumina al máximo.
2. La cámara **se lanza hacia la placa** (~0,8 s) mientras el viaje se desvanece.
3. Aparece la página del proyecto; la escena queda detrás, **atenuada (≈30 %)**, con la tortuga vista desde
   arriba y esa placa encendida.
4. El lienzo es el mismo (no se recrea): la transición no vuelve a cargar nada.

- **Carga directa** de `/projects/chessmate` (enlace compartido): la escena arranca directamente en ese estado,
  sin Big Bang.
- **Proyecto anterior / siguiente:** la cámara se desliza a la placa vecina mientras cambia el contenido.
- **Volver** («Back to the shell» o Atrás): la cámara se aleja y el viaje reaparece en el capítulo de la tortuga.
- Con movimiento reducido: fundido simple, sin vuelo de cámara.

## Estructura de la página (documento normal, sin capítulos de scroll)

1. **Cabecera:** «Back to the shell», nombre del proyecto (display grande, `h1`), tagline, metadatos en mono
   (Featured en turquesa · año · rol · contexto) y acciones Live demo (si hay) / Code.
2. **Portada:** imagen `cover` a ancho completo dentro de un marco con corchetes.
3. **About the project:** párrafos `about`.
4. **Key features:** rejilla de `features`.
5. **Tech stack:** cuatro grupos (core, libraries, design, tooling), cada uno con su título (`h3`) y etiquetas.
6. **Development process:** párrafos `process` + **Technical highlights** (`h3`). Sin párrafos de proceso, los
   retos van solos con su propio `h2`.
7. **Notes:** avisos `info` / `warning` con su estilo. El tipo no se dice solo con color ni con el icono: el
   lector oye «Note:» / «Warning:» delante.
8. **Try it:** introducción, pasos numerados (las «→» del texto, con el icono), las cuentas de demo y el enlace
   «Read the full guide in the README». Cada cuenta (User, Admin…) muestra usuario y contraseña con un botón
   copiar por dato que dice cuál copia («Copy password (Admin)»); todas comparten columnas, para que los botones
   queden alineados (por debajo de sm, o con el texto grande si no caben, el campo encima). El título va en
   singular o en plural según el número de cuentas («Demo account» / «Demo accounts»).
9. **Gallery:** miniaturas (botones «Open image n of total» + texto alternativo, todas con la misma proporción);
   al abrir, visor a pantalla completa con flechas, teclado (← → con vuelta, Esc), contador «n / total» y foco
   atrapado (modal nativo). La imagen activa se anuncia («3 of 9: texto alternativo»), también al abrir; al
   cerrar, el foco vuelve a la miniatura de la imagen que se estaba viendo.
10. **Pie del proyecto:** Previous / Next project (sin vuelta: el primero no tiene anterior y el último no tiene
    siguiente; cada tarjeta en media columna como mucho, a su lado) + enlaces a GitHub, LinkedIn y email. Al
    llegar a la ficha vecina, el foco va a su nombre.

Las secciones sin datos (por ejemplo, `tryIt: null`) **no se pintan**. Cada sección es una región con nombre
(su `h2`); los `h2` van con la escala de `h3`: el display grande es solo el nombre.

## Layout

- Columna de lectura de `--read-w` (720 px) centrada, con aire arriba para la barra fija. La portada y la galería
  van en la misma columna.
- La interfaz fija del viaje, salvo lo que depende de los capítulos: «Skip to content» (lleva al nombre del
  proyecto), barra superior (sus enlaces a capítulos navegan al viaje; `EN / ES` lleva a este mismo proyecto en el
  otro idioma), modo misión rápida y sugerencia de idioma (ofrece este mismo proyecto en español). El raíl y el
  HUD no salen (no hay capítulos).
- Sin scroll lateral a 320 px con el texto al 200 %: las palabras largas y las URL se parten.

## SEO

- `<title>` y descripción propias (`meta.project.title`, `summary` tal cual), imagen Open Graph = `cover` cuando
  exista (si es `null`, la imagen del sitio de su idioma; hasta entonces, sin `og:image`).
- HTML pre-renderizado con todo el contenido (decisión técnica en `docs/05-tecnico/`).
- Datos estructurados `SoftwareSourceCode` (un `CreativeWork`) con nombre, descripción, año, URL canónica, URL del
  código (`codeRepository`), idioma y autor embebido.
- Slug desconocido: la misma página 404 del idioma, sin redirección (`docs/05-tecnico/arquitectura.md`).

## Aceptación

1. Cada proyecto tiene su URL en los dos idiomas y funciona al cargarla directamente.
2. Toda la página es legible y navegable sin escena.
3. La galería se usa por completo con teclado y anuncia la imagen activa.
4. Volver a la home deja el scroll en el capítulo de proyectos con el foco en la fila del proyecto visitado
   (`navegacion.md` → «Volver desde una página de proyecto»); desde F5, además, con la placa iluminada.
