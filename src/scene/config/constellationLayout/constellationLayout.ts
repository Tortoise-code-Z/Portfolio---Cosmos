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
  html: [-4.53, 0.9, -15.8],
  css: [-3.92, 1.28, -11.82],
  javascript: [-3.59, 1.01, -9.18],
  typescript: [-1.97, 0.98, -7.21],
  glsl: [-1.65, 0.95, -5.18],
  php: [-3.35, 0.96, -4.33],
  mysql: [-2.02, 1.3, -2.14],
  apache: [-3.2, 1.11, -0.85],
  // libraries: arriba a la derecha
  'react-ts': [6.09, 0.92, -16.77],
  nextjs: [7.02, 1.24, -12.95],
  'react-query': [6.52, 0.97, -10.83],
  zustand: [4.95, 1.03, -8.58],
  'react-router': [4.73, 1.02, -6.72],
  'react-hook-form': [3.5, 1.3, -4.56],
  zod: [1.99, 0.99, -3.61],
  'css-modules': [1.62, 1.06, -2.15],
  r3f: [1.93, 1.3, -0.59],
  tailwind: [1.13, 1.39, 0.88],
  electron: [2.39, 0.9, 1.79],
  nestjs: [1.8, 1.05, 2.89],
  // tools: abajo a la derecha
  git: [5.17, 0.99, 0.35],
  github: [4.52, 0.96, 1.67],
  npm: [3.99, 1.43, 3.09],
  pnpm: [2.4, 1.23, 4.07],
  vite: [1.47, 1.37, 5.05],
  vitest: [0.37, 1.29, 5.7],
  playwright: [1.56, 1.01, 6.37],
  docker: [0.23, 1.39, 7.42],
  n8n: [1.26, 1.3, 8.16],
  figma: [0.14, 1.3, 8.74],
  vms: [-1.02, 1.49, 9.44],
  // ai: abajo a la izquierda
  'ai-pair': [-5.25, 1.25, 2.46],
  'ai-agents': [-4.16, 1.09, 3.48],
  'ai-prompting': [-3.93, 1.24, 4.73],
  'ai-review': [-4.75, 1.44, 5.83],
  claude: [-3.68, 1.44, 6.54],
  chatgpt: [-4.72, 1.33, 7.31],
};

/**
 * Las líneas de cada constelación, por pares de `Skill.id` del mismo grupo: una figura por grupo (web, una rama;
 * libraries, un triángulo con su cadena; tools, una cadena cerrada al final; ai, una cometa con su cola). Ninguna
 * línea pasa cerca de una estrella que no es suya ni tacha el texto de la etiqueta de otra estrella (las de sus dos
 * extremos pueden rozarla): lo comprueba su test.
 */
export const CONSTELLATION_LINKS: Readonly<
  Record<SkillGroupId, readonly (readonly [string, string])[]>
> = {
  web: [
    ['html', 'css'],
    ['css', 'javascript'],
    ['javascript', 'typescript'],
    ['typescript', 'glsl'],
    ['javascript', 'php'],
    ['php', 'mysql'],
    ['mysql', 'apache'],
  ],
  libraries: [
    ['react-ts', 'nextjs'],
    ['nextjs', 'react-query'],
    ['react-query', 'react-ts'],
    ['react-query', 'zustand'],
    ['zustand', 'react-router'],
    ['react-router', 'react-hook-form'],
    ['react-hook-form', 'zod'],
    ['zod', 'css-modules'],
    ['css-modules', 'r3f'],
    ['r3f', 'tailwind'],
    ['tailwind', 'electron'],
    ['electron', 'nestjs'],
  ],
  tools: [
    ['git', 'github'],
    ['github', 'npm'],
    ['npm', 'pnpm'],
    ['pnpm', 'vite'],
    ['vite', 'vitest'],
    ['vitest', 'playwright'],
    ['playwright', 'docker'],
    ['docker', 'n8n'],
    ['n8n', 'figma'],
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
  /** El trazo que apunta a la estrella, dentro de `startPx`. */
  strokePx: 6,
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
 * abajo a la izquierda (se ve entre 520 y 899 px; por debajo no hay, pero su zona se reserva siempre, por
 * prudencia: a 360, 390 y 430 px no oculta ninguna etiqueta más). Con `marginPx` alrededor.
 * - De los tokens (lo comprueba su test con `tokens.css`): el panel (`--gutter` de escritorio, `--space-5`, más
 *   `--panel-w`), la barra (`--topbar-h`) y las paradas del raíl (`--rail-stops`, una por capítulo y por interludio,
 *   ocho desde C.6, de `--target-min`, que en una ventana baja encogen hasta `--rail-stop-min`: `railHalfHeight`). El
 *   raíl va centrado; si no cabe bajo la barra, baja lo justo (`keepOutZones` hace la misma cuenta).
 * - Medido, porque depende del ancho de sus textos: lo que ocupan desde el borde el raíl (en escritorio, con el
 *   español, 155,1 en Chromium, medido en C.4 con «Control de misión», y 154,02 en WebKit, medido en C.3; 52 por
 *   debajo) y el HUD (62 de alto; de ancho, 247 en Chromium en
 *   local y 251,3 en el del CI: su «≈» y sus superíndices salen con la mono del sistema). Se reserva con holgura
 *   (158 y 256). El e2e de F4.3c (`constellations.spec.ts`) lo compara con la página real en los tres motores.
 */
export const STAR_LABEL_KEEP_OUT = {
  marginPx: 8,
  wide: {
    panelRight: 564,
    barBottom: 64,
    rail: { fromRight: 158, stops: 8, stopPx: 44, minStopPx: 24 },
    hud: { fromRight: 256, fromBottom: 62 },
  },
  narrow: {
    barBottom: 64,
    rail: { fromRight: 52, stops: 8, stopPx: 44, minStopPx: 24 },
    hud: { fromLeft: 256, fromBottom: 62 },
  },
} as const;

/**
 * Media altura del raíl en una ventana de `height` px de alto: sus paradas miden `stopPx`, salvo que no quepan bajo la
 * barra; entonces encogen lo justo, hasta `minStopPx` (`--rail-stop` en `tokens.css`). Sin la zona segura de arriba,
 * que la escena no ve: en un móvil con muesca reserva algo de más.
 */
export function railHalfHeight(
  height: number,
  {
    barBottom,
    rail,
  }: {
    readonly barBottom: number;
    readonly rail: { readonly stops: number; readonly stopPx: number; readonly minStopPx: number };
  },
): number {
  const stop = Math.min(Math.max((height - barBottom) / rail.stops, rail.minStopPx), rail.stopPx);
  return (rail.stops * stop) / 2;
}

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
  // En reposo, 0,8 (y con su halo, `--halo-star-label`): `--color-dim` a 0,6 daba 3,7 : 1 sobre el vacío.
  labelOpacity: { rest: 0.8, hot: 1 },
  hotRate: 8,
  /** Presencia del capítulo 2: `clamp(1 − |m − 2| · fade, 0, 1)`. */
  presenceFade: 1.8,
  /** Desde aquí las etiquetas responden al puntero, ratón o toque (F4.3c). */
  interactiveFrom: 0.6,
} as const;
