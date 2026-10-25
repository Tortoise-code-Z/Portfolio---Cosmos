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

- 1200×630 px, una por idioma (`og-en.png`, `og-es.png`): la galaxia o la tortuga de fondo, nombre y rol.
- Se genera desde una captura de la propia escena al final de la fase de pulido. ⏳

## Favicon e iconos

- Favicon SVG (una tortuga o una estrella mínima) + `apple-touch-icon` 180×180 + `manifest` básico. ⏳ Diseño
  pendiente en `docs/03-diseno/`.

## CV en PDF

- **Estado:** por hacer (decisión D3).
- Recomendado: **dos versiones**, `cv-victor-perez-en.pdf` y `cv-victor-perez-es.pdf`, con el contenido de
  `perfil.md` y los proyectos. Destino: `public/cv/`.
- Mientras no existan, `profile.cv` vale `null` y la interfaz **no muestra** el enlace.

## Prototipo de referencia

- `docs/referencia/prototipo-v0.1.html`: el prototipo validado. Referencia visual y de comportamiento,
  no código para copiar.
