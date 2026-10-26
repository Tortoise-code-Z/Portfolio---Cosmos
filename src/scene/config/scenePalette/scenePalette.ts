/**
 * Paleta de la escena (docs/03-diseno/design-system.md → «Paleta de la escena»): los colores del shader, con
 * nombre. Los «principales» de esa tabla están aquí con el mismo valor (lo comprueba el test); el resto son los
 * matices del prototipo que la tabla no lista. Llegan al GLSL como `const vec3` (`scene/shaders/glslHeader`), en
 * el mismo espacio que el prototipo: el shader no convierte el color (ver `particulas-y-shaders.md` → «Colores»).
 */
export const SCENE_PALETTE = {
  // Singularidad y destello
  singularityWarm: '#fff2d9',
  singularityIce: '#c7dbff',
  flash: '#fff2d9',
  // Nebulosa
  nebulaViolet: '#8047ff',
  nebulaMagenta: '#ff4291',
  nebulaTeal: '#24d9e0',
  nebulaAmber: '#ff9947',
  nebulaCore: '#ffe6b8',
  // Galaxia
  galaxyCore: '#ffd18c',
  galaxyArm: '#618cff',
  galaxyArmPink: '#f273ff',
  // Tortuga
  turtleShell: '#1a998a',
  turtleEdge: '#ffa847',
  turtlePlate: '#f2b861',
  turtlePlateLit: '#ffedc7',
  turtleForest: '#52f26b',
  turtleBody: '#38c7a3',
  turtleWake: '#73bfff',
  turtlePlastron: '#cc8c47',
  // Tierra
  earthOcean: '#1247d9',
  earthLand: '#47b852',
  earthDesert: '#c79e5c',
  earthClouds: '#f2f7ff',
  earthAtmosphere: '#599eff',
  earthDawn: '#ff7326',
  earthRim: '#ff8033',
  earthCity: '#ffb859',
  // Estrellas de fondo
  starCold: '#bfd1ff',
  starWarm: '#ffd9a6',
} as const;

export type ScenePaletteName = keyof typeof SCENE_PALETTE;

/** Un color `#rrggbb` en sus tres componentes de 0 a 1 (como los `vec3` del shader). */
export function hexToRgb(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (match === null) throw new RangeError(`Not a #rrggbb colour: ${hex}`);
  const [, r = '', g = '', b = ''] = match;
  return [Number.parseInt(r, 16) / 255, Number.parseInt(g, 16) / 255, Number.parseInt(b, 16) / 255];
}
