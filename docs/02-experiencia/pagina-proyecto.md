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

1. **Cabecera:** «Back to the shell», nombre del proyecto (display grande), tagline, año, rol, contexto,
   etiqueta «Featured» y acciones Live demo / Code.
2. **Portada:** imagen `cover` a ancho completo dentro de un marco con corchetes.
3. **About the project:** párrafos `about`.
4. **Key features:** rejilla de `features`.
5. **Tech stack:** cuatro grupos (core, libraries, design, tooling).
6. **Development process:** párrafos `process` + **Technical highlights**.
7. **Notes:** avisos `info` / `warning` con su estilo.
8. **Try it:** pasos resumidos, cuenta de demo (con botón copiar) y enlace «Read the full guide in the README».
9. **Gallery:** miniaturas; al abrir, visor a pantalla completa con flechas, teclado (← → Esc), contador
   «n of total» y foco atrapado.
10. **Pie del proyecto:** Previous / Next project + enlaces a GitHub, LinkedIn y email.

Las secciones sin datos (por ejemplo, `tryIt: null`) **no se pintan**.

## Layout

- Columna de lectura de ~720 px centrada; la galería y la portada pueden ser más anchas.
- La barra superior y el selector de idioma siguen visibles; el raíl y el HUD se ocultan (no hay capítulos).

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
4. Volver a la home deja el scroll en el capítulo de proyectos con la placa visitada iluminada.
