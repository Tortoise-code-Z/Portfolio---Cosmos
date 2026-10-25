// Anchos de las capturas de proyecto (docs/01-contenido/assets.md → «Capturas de proyectos»): un solo sitio
// para los números que usan los presets de vite.config.ts, su sustituto de Vitest, las reglas del contenido
// y los e2e. Sin imports: las configs de Vite y Vitest lo cargan sin pasar por Vite.

/** Variantes AVIF y WebP de cada captura (`?project`), de menor a mayor. */
export const PROJECT_IMAGE_WIDTHS = [640, 1280, 1920] as const;

/** La imagen para compartir de cada portada (`?share`, `og:image`). */
export const SHARE_IMAGE_WIDTH = 1200;
