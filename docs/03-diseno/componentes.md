# Componentes de interfaz

> Cada componente con su anatomía, variantes y estados. Todos usan tokens de `design-system.md`.
> Estados comunes: **hover** (color `--color-star` o borde ámbar), **focus-visible** (contorno 2 px
> `--color-star`, separación 3 px), **active**, **disabled** (opacidad 0,4, sin puntero), **hot** (resaltado
> sincronizado con la escena).

## Estructura y lectura

### Panel de capítulo
- Contenedor del texto de cada capítulo. Fondo: degradado radial de `--color-veil` (opaco a la izquierda,
  transparente hacia los bordes) para que no se vea un rectángulo duro sobre la escena.
- **Corchetes de esquina** ámbar en la izquierda (arriba y abajo), 14 px, 1 px.
- Relleno `--space-6`/`--space-7`; ancho `--panel-w`. *Sticky* (`top: 14vh`) en escritorio; normal en móvil.

### Eyebrow
- Una línea `--text-label` en mono: **sección** en ámbar + `· escena · tiempo` en `--color-dim`.

### Título de capítulo (`h2`) · Párrafo · Lista de etiquetas (fortalezas)
- Títulos según escala. Párrafos `--color-ink-soft`.
- Etiqueta: mono 12 px, borde 1 px `--color-faint`, relleno 6/10 px, sin radio.

## Acciones

### Botón de contorno (`ButtonOutline`)
- Mono `--text-label` en mayúsculas, borde 1 px `--color-faint`, fondo velo con desenfoque.
- Uso: «Quick mission», «Back to the journey», «Copy».

### Botón de mantener (`HoldButton`)
- Anillo de progreso (conic-gradient ámbar) de 26 px + texto mono. La variable `--charge` (0–1) dibuja el anillo.
- `touch-action: none`, sin selección de texto, sin menú contextual.
- Estados: reposo · cargando · detonado (deshabilitado hasta volver al inicio).

### Enlace de acción (`ActionLink`)
- Mono 12 px en mayúsculas con subrayado de 1 px `--color-faint` separado 2 px; al pasar, ámbar.
- Externos: icono de enlace externo y `rel="noopener noreferrer"`; se abren en pestaña nueva.

### Botón copiar (`CopyButton`)
- Estados de texto: Copy → Copied (1,8 s) / Select and copy it. Anuncio en `aria-live="polite"`.

## Navegación

### Barra superior (`TopBar`)
- Fija, transparente, con el logo a la izquierda y las acciones a la derecha. Margen lateral de página.
- El selector de idioma `EN / ES` es un par de enlaces; el activo, subrayado ámbar y `aria-current="true"`.

### Chip de disponibilidad (`AvailabilityChip`)
- Punto turquesa de 6 px que «respira» (opacidad, sin escala) + «Open to work». Borde `--color-faint`.
- Con movimiento reducido el punto no respira.

### Raíl (`ChapterRail`)
- Columna de 5 botones alineados a la derecha: texto (sección en 13 px + escena en mono 10 px) y punto de 7 px.
- Activo: punto ámbar relleno, escala 1,4 y halo; texto opaco. Inactivos: texto al 45 %.
- Por debajo de `--bp-md`: solo puntos, con `aria-label`.

### HUD (`CosmicHud`)
- Dos líneas en mono: reloj (13 px, valores en ámbar) y escala (11 px, `--color-dim`). `aria-hidden`.

## Escena ↔ interfaz

### Etiqueta de estrella (`StarLabel`)
- Mono 11 px, `--color-dim`, con un trazo de 6 px a la izquierda que apunta a la estrella. *Hot*: ámbar.
- Posicionada por proyección 3D → 2D en cada frame; opacidad según el peso del capítulo.

### Pin de placa (`PlatePin`)
- Tallo vertical de 46 px (degradado ámbar a transparente) + etiqueta con borde y velo. *Hot*: borde y texto ámbar.

### Grupo de habilidades (`SkillGroup`)
- Bloque con borde izquierdo de 1 px; título mono en `--color-dim` y skills en texto normal. *Hot*: borde y
  título ámbar. Es enfocable (`tabindex="0"`) para encender la constelación con teclado.

### Fila de proyecto (`ProjectRow`)
- Borde izquierdo de 1 px; nombre en display (`--text-h3`), año alineado a la derecha en mono, metadatos en mono
  (con «Featured» en turquesa), resumen y acciones. *Hot*: borde ámbar y degradado ámbar muy tenue de fondo.

## Contacto

### Email destacado
- Display 700, `wdth` 112, seleccionable (`user-select: all`), con corte de línea seguro en móvil.

### Órbita (`OrbitItem`, formación)
- Rejilla de 2 columnas: título a la izquierda, periodo y horas a la derecha (mono); debajo, academia y skills.
  Separador superior de 1 px.

## Diálogos y avisos

### Modo misión rápida (`QuickMissionDialog`)
- `<dialog>` modal a pantalla completa, fondo `--color-void` al 96 %. Contenido en rejilla `auto-fit` de
  columnas de mínimo 280 px.

### Visor de galería (`Lightbox`)
- `<dialog>` con la imagen centrada, contador mono «3 / 9», flechas y cerrar. Teclado ← → Esc.

### Aviso (`Notice`)
- Barra flotante abajo, mono 12 px, velo y borde. Uso: sin WebGL, sugerencia de idioma. Descartable.

### Nota de proyecto (`ProjectNote`)
- Bloque con borde izquierdo de 2 px: turquesa (`info`) o ámbar (`warning`), icono y texto.

## Accesibilidad común

- Área táctil mínima 44 × 44 px en todo lo pulsable (aunque el dibujo sea menor).
- Ningún estado se comunica solo con color: el activo del raíl también cambia de tamaño y `aria-current`.
