import type { RenderLevel } from '~/lib/device/sceneLevel/sceneLevel';

/**
 * Las fotos fijas de la escena del modo sin WebGL (ADR-029; docs/02-experiencia/estados-y-accesibilidad.md →
 * «Sin WebGL»): cómo se sacan (`npm run stills`, `tests/stills/stills.spec.ts`) y cómo se encajan
 * (`SceneStills/SceneStills.module.css`). La cámara usa perspectiva: con el mismo campo de visión, la foto escalada
 * cae donde caería la escena, así que basta con ajustarla al alto o al ancho según la regla del campo de visión
 * (docs/04-escena/camara-y-encuadre.md → «Campo de visión»).
 */

/** Los capítulos con foto: el 0 (singularidad) ya tiene el punto CSS del hero. */
export const STILL_CHAPTERS = [1, 2, 3, 4] as const;
export type StillChapter = (typeof STILL_CHAPTERS)[number];

/** Un encuadre de las fotos: el tamaño de la ventana al sacarla, su densidad y el nivel de la escena. */
export interface StillFrame {
  /** Ancho y alto de la ventana, en px CSS (el lienzo la ocupa entera: sin barra de scroll). */
  readonly width: number;
  readonly height: number;
  /** Densidad de píxeles: la máxima del nivel (`LEVEL_SETTINGS`), lo que pinta un visitante con GPU. */
  readonly deviceScaleFactor: number;
  readonly level: RenderLevel;
}

/**
 * - `desktop` (desde 900 px, con los paneles a un lado y su `shiftX`): Alto, a 900 px de alto y con un aspecto de
 *   2,4 (más ancho que casi cualquier pantalla), así que ajustada al alto la cubre de lado a lado.
 * - `handheld` (por debajo de 900 px, sin `shiftX`): Bajo, en el aspecto donde el campo de visión llega a su tope
 *   (≈ 0,546): ajustada al alto vale para los móviles (que están en el tope) y ajustada al ancho, para las pantallas
 *   que conservan el campo horizontal (hasta 1,25).
 */
export const STILL_FRAMES = {
  desktop: { width: 2160, height: 900, deviceScaleFactor: 2, level: 'high' },
  handheld: { width: 461, height: 844, deviceScaleFactor: 1, level: 'low' },
} as const satisfies Readonly<Record<string, StillFrame>>;

export type StillFrameName = keyof typeof STILL_FRAMES;

/**
 * Cuándo se usa la foto de escritorio: la misma condición que aparta la escena para los paneles
 * (`WIDE_LAYOUT_QUERY` de `scene/config/sceneConfig`, que `features` no puede importar, ni `scene` esta). Lo vigilan
 * dos tests a través del CSS de las fotos: `stillFrames.test.ts` exige ahí `@media ${DESKTOP_STILL_QUERY}` y
 * `scene/math/camera/camera.test.ts`, `@media ${WIDE_LAYOUT_QUERY}`.
 */
export const DESKTOP_STILL_QUERY = '(width >= 900px)';

/** Nombre de cada archivo de foto (sin extensión), en `src/assets/scene-stills/<formato>/`. */
export function stillFileName(frame: StillFrameName, chapter: StillChapter): string {
  return `scene-still-${frame}-${String(chapter)}`;
}
