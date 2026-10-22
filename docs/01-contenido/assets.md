# Assets

## Capturas de proyectos

- **Origen:** repo del portfolio actual (`https://github.com/Tortoise-code-Z/portfolio`), carpeta
  `src/assets/images/` y `src/assets/images/screenshots/`. Listado y textos alternativos en cada ficha de
  `proyectos/`.
- **Destino:** `src/assets/projects/<slug>/`.
- **Tratamiento:** convertir a **AVIF + WebP** con varios anchos (por ejemplo 640, 1280 y 1920 px) para
  `srcset`; conservar `width`/`height` para que no haya saltos de layout (CLS). La herramienta se decide en
  `docs/05-tecnico/`.
- Las ilustraciones tipo caricatura del sitio actual (`*-Caricatura*.webp`) **no se usan** en la v1: la estética
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
