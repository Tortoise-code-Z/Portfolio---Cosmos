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
  'react-query': [6.42, 1.02, -13.93],
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
  'ai-pair': [-2.97, 1.26, 2.52],
  'ai-agents': [-4.39, 0.98, 3.42],
  'ai-prompting': [-3.94, 1.1, 4.58],
  'ai-review': [-4.15, 1.49, 5.82],
  claude: [-3.06, 1.12, 6.41],
  chatgpt: [-4.15, 1.08, 7.18],
};

/**
 * Las líneas de cada constelación, por pares de `Skill.id` del mismo grupo: una figura por grupo (rama, cadena con
 * un triángulo, cadena cerrada al final, un rombo con su cola).
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
 * mono de 11 px (cada letra, 0,6 em: IBM Plex Mono), con el trazo y su hueco a la izquierda (`startPx`), un poco de
 * aire a la derecha y 22 de alto. Empieza `offsetPx` a la derecha de la estrella, centrada en su altura. Con ella
 * se comprueba que las etiquetas caben; el CSS de la etiqueta (F4.3b) la sigue.
 */
export const STAR_LABEL_BOX = {
  fontPx: 11,
  advanceEm: 0.6,
  startPx: 14,
  endPx: 6,
  heightPx: 22,
  offsetPx: 4,
} as const;

/**
 * Lo que ocupa a lo ancho la etiqueta de `text`, en píxeles CSS. Una letra por unidad de `length` (en NFC, una «á» es
 * una sola; las etiquetas no llevan emojis).
 */
export function starLabelWidth(text: string): number {
  const { fontPx, advanceEm, startPx, endPx } = STAR_LABEL_BOX;
  return startPx + text.normalize('NFC').length * fontPx * advanceEm + endPx;
}
