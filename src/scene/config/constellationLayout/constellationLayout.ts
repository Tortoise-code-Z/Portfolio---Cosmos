import type { SkillGroupId } from '~/content/types';

import type { ScenePoint } from '../sceneConfig';

/**
 * Las constelaciones de las skills (docs/04-escena/constelaciones-y-placas.md → «Constelaciones»): dónde va cada
 * estrella, indexada por `Skill.id`, y qué estrellas une cada línea. Flotan sobre el plano de la galaxia
 * (Y entre 0,9 y 1,5) y no giran con ella. Las posiciones salen de colocar las etiquetas en la pantalla con la
 * cámara de la galaxia (m = 2, encuadre de escritorio) a 1280×720 y llevarlas a la escena: cada grupo en su zona
 * del hueco libre entre el panel y el raíl, cada estrella en su fila. Sus reglas las comprueba su test.
 */
export const CONSTELLATION_STARS: Readonly<Record<string, ScenePoint>> = {
  // web: arriba a la izquierda
  html: [-2.21, 1.09, -16.68],
  css: [-3.38, 1.11, -13.72],
  javascript: [-3.81, 0.94, -11.56],
  typescript: [-2.04, 1.23, -8.74],
  php: [-2.48, 1.15, -6.94],
  mysql: [-3.53, 0.95, -5.53],
  apache: [-2.2, 1.21, -3.54],
  // libraries: arriba a la derecha
  'react-ts': [5.3, 1.44, -15.77],
  'react-query': [7.92, 1.02, -13.93],
  zustand: [6.63, 1.1, -11.21],
  'react-router': [3.55, 1.47, -8.26],
  'react-hook-form': [4.41, 1.04, -7.13],
  zod: [3.36, 0.93, -5.56],
  'css-modules': [3.13, 0.92, -3.98],
  r3f: [2.67, 1.1, -2.3],
  tailwind: [1.86, 0.97, -1.19],
  bootstrap: [2.76, 1.04, 0.07],
  // tools: abajo a la derecha
  git: [4.01, 0.98, 1.89],
  github: [3.51, 1.32, 3.33],
  vite: [2.55, 1.43, 4.41],
  vitest: [1.32, 1.0, 4.96],
  playwright: [2.46, 0.93, 5.76],
  docker: [1.81, 1.48, 6.89],
  figma: [0.79, 0.98, 7.29],
  vms: [1.58, 1.42, 8.19],
  // ai: abajo a la izquierda
  'ai-pair': [-5.43, 1.26, 2.52],
  'ai-agents': [-4.37, 0.98, 3.42],
  'ai-prompting': [-3.92, 1.1, 4.58],
  'ai-review': [-4.99, 1.49, 5.82],
  claude: [-3.91, 1.12, 6.41],
  chatgpt: [-4.84, 1.08, 7.18],
};

/**
 * Las líneas de cada constelación, por pares de `Skill.id` del mismo grupo: una figura por grupo (web, una rama;
 * libraries, un triángulo con su cadena; tools, una cadena cerrada al final; ai, un rombo con su cola). Ninguna
 * línea pasa cerca de una estrella que no es suya ni tacha el texto de una etiqueta: lo comprueba su test.
 */
export const CONSTELLATION_LINKS: Readonly<
  Record<SkillGroupId, readonly (readonly [string, string])[]>
> = {
  web: [
    ['html', 'css'],
    ['css', 'javascript'],
    ['javascript', 'typescript'],
    ['javascript', 'php'],
    ['php', 'mysql'],
    ['mysql', 'apache'],
  ],
  libraries: [
    ['react-ts', 'react-query'],
    ['react-query', 'zustand'],
    ['zustand', 'react-ts'],
    ['zustand', 'react-router'],
    ['react-router', 'react-hook-form'],
    ['react-hook-form', 'zod'],
    ['zod', 'css-modules'],
    ['css-modules', 'r3f'],
    ['r3f', 'tailwind'],
    ['tailwind', 'bootstrap'],
  ],
  tools: [
    ['git', 'github'],
    ['github', 'vite'],
    ['vite', 'vitest'],
    ['vitest', 'playwright'],
    ['playwright', 'docker'],
    ['docker', 'figma'],
    ['figma', 'vms'],
    ['docker', 'vms'],
  ],
  ai: [
    ['ai-pair', 'ai-agents'],
    ['ai-agents', 'ai-prompting'],
    ['ai-prompting', 'ai-review'],
    ['ai-review', 'ai-pair'],
    ['ai-review', 'claude'],
    ['claude', 'chatgpt'],
  ],
};

/**
 * La caja de la etiqueta de una estrella (docs/03-diseno/componentes.md → «Etiqueta de estrella»), en píxeles CSS:
 * mono de 11 px en escritorio y 10 por debajo de 900 px (cada letra, 0,6 em: IBM Plex Mono), con el trazo y su
 * hueco a la izquierda (`startPx`), un poco de aire a la derecha y 22 de alto (16 de línea + 3 arriba y abajo).
 * Empieza `offsetPx` a la derecha de la estrella, centrada en su altura. Sin mayúsculas ni espacio entre letras. El
 * CSS de la etiqueta (`scene/ConstellationLabels`, con los tokens en px `--text-star-label`) la sigue: lo comprueba
 * su test.
 */
export const STAR_LABEL_BOX = {
  fontPx: 11,
  narrowFontPx: 10,
  advanceEm: 0.6,
  startPx: 14,
  endPx: 6,
  lineHeightPx: 16,
  padBlockPx: 3,
  heightPx: 22,
  offsetPx: 4,
} as const;

/**
 * Lo que ocupa a lo ancho la etiqueta de `text`, en píxeles CSS, con su tamaño de letra (11 por omisión). Una letra
 * por unidad de `length` (en NFC, una «á» es una sola; las etiquetas no llevan emojis).
 */
export function starLabelWidth(text: string, fontPx: number = STAR_LABEL_BOX.fontPx): number {
  const { advanceEm, startPx, endPx } = STAR_LABEL_BOX;
  return startPx + text.normalize('NFC').length * fontPx * advanceEm + endPx;
}

/**
 * Lo que la interfaz tapa por encima de la escena y donde no puede quedar una etiqueta, en píxeles CSS del lienzo.
 * En escritorio (`wide`, desde 900 px): el panel a la izquierda, la barra de arriba, el raíl (centrado en vertical,
 * contado desde el borde derecho) y el HUD abajo a la derecha. Por debajo: la barra, el raíl (sin textos) y el HUD
 * abajo a la izquierda (entre 520 y 899 px; por debajo no hay). Con `marginPx` alrededor.
 * - De los tokens (lo comprueba su test con `tokens.css`): el panel (`--gutter` de escritorio, `--space-5`, más
 *   `--panel-w`), la barra (`--topbar-h`) y el alto del raíl (un enlace de `--target-min` por capítulo).
 * - Medido en Chromium (F4.3a y F4.3b, EN y ES), porque depende del ancho de sus textos: lo que ocupan desde el
 *   borde el raíl (154 en escritorio, con el español; 52 por debajo) y el HUD (247 de ancho, 62 de alto). El e2e de
 *   F4.3c lo comparará con la página real.
 */
export const STAR_LABEL_KEEP_OUT = {
  marginPx: 8,
  wide: {
    panelRight: 564,
    barBottom: 64,
    rail: { fromRight: 154, halfHeight: 110 },
    hud: { fromRight: 247, fromBottom: 62 },
  },
  narrow: {
    barBottom: 64,
    rail: { fromRight: 52, halfHeight: 110 },
    hud: { fromLeft: 247, fromBottom: 62 },
  },
} as const;

/**
 * Cómo se ven las constelaciones (constelaciones-y-placas.md → «Estados»): el tamaño de las estrellas en píxeles
 * CSS (no cambia con la distancia: las de arriba quedan lejos), lo que crece una estrella de un grupo activo
 * (0,9 → 1,4 de la especificación), la opacidad de estrellas, líneas y etiquetas en reposo y activas, y el ritmo
 * del encendido. Todo multiplicado por la presencia del capítulo 2.
 */
export const CONSTELLATION_LOOK = {
  starPx: 22,
  hotScale: 1.55,
  starOpacity: { rest: 0.65, hot: 1 },
  lineOpacity: { rest: 0.22, hot: 0.9 },
  labelOpacity: { rest: 0.6, hot: 1 },
  hotRate: 8,
  /** Presencia del capítulo 2: `clamp(1 − |m − 2| · fade, 0, 1)`. */
  presenceFade: 1.8,
  /** Desde aquí las etiquetas responden al ratón (F4.3c). */
  interactiveFrom: 0.6,
} as const;
