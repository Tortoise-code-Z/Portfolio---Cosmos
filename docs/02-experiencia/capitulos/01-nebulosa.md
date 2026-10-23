# Capítulo 1 · Nebulosa (Sobre mí)

## Propósito

Contar tu origen y quién eres hoy. Metáfora: de una nube de gas nace una estrella, como de la curiosidad nació
tu profesión.

## Contenido (`about.*`, `perfil.md`)

- Eyebrow: «About · nebula · t ≈ 200 million years».
- Título: «A star born from curiosity».
- Bio en 3 párrafos (perfil).
- Fortalezas como etiquetas: Hard-working · Communication · Perseverance.
- Chip de disponibilidad «Open to work · Killarney, Ireland» (el detalle completo vive en contacto).

## Escena en reposo (`m = 1`)

- Nube de gas tallada con ruido, en magenta, violeta y turquesa con vetas ámbar; gira muy despacio.
- En el centro, una **protoestrella** brillante con un disco de acreción fino.
- Las estrellas de fondo ya están encendidas.

## Interacciones

- **Gravedad del cursor:** las partículas cercanas al puntero giran y se apartan, como un remolino; brillan un poco más.
  Solo con puntero fino (ratón o trackpad).
- No hay más interacción: es un capítulo de lectura.

## Layout

- **Escritorio:** panel a la izquierda (máx. ~540 px), *sticky* durante su capítulo (si es más alto que la ventana,
  se fija por abajo); la nebulosa a la derecha (encuadre desplazado). Soltarlo a mitad del capítulo, cuando la
  forma empieza a cambiar, se decide en F3–F4 con la escena delante.
- **Móvil:** primero ~70 vh de escena limpia; después el panel sube por encima con un fondo degradado que
  asegura el contraste. Los paneles no son *sticky* en móvil.
- El panel lleva los corchetes de esquina del design system.

## Accesibilidad y movimiento reducido

- Sección con `aria-labelledby` apuntando al título.
- Movimiento reducido: la nebulosa no gira sola (solo cambia con el scroll) y no hay gravedad de cursor.

## Aceptación

1. El texto mantiene contraste AA sobre la parte más brillante de la nebulosa (el fondo del panel lo garantiza).
2. La nebulosa no se mueve mientras se lee la primera mitad del capítulo, salvo su giro lento.
3. En móvil se ve la nebulosa completa antes de que suba el texto.
