import { FIRST_PLATE_LABEL, LAST_PLATE_LABEL } from '../../config/plateSlots/plateSlots';
import { hexToRgb, SCENE_PALETTE } from '../../config/scenePalette/scenePalette';
import { EARTH_TAG, TURTLE_FLIPPERS, TURTLE_TAG } from '../../shapes/shapeContract/shapeContract';

/**
 * Cabecera común de los shaders (docs/04-escena/particulas-y-shaders.md → «Etiquetas y colores»): las etiquetas
 * de `aR` y los colores de la paleta salen de TypeScript, la misma fuente que los generadores. Así el GLSL no
 * escribe ningún número de etiqueta ni color a mano y no puede quedarse atrás si cambian.
 */

/** Un número como literal `float` de GLSL (siempre con punto: `20` → `20.0`). */
export function glslFloat(value: number): string {
  if (!Number.isFinite(value)) throw new RangeError(`Not a finite number: ${String(value)}`);
  const text = String(value);
  return /[.e]/.test(text) ? text : `${text}.0`;
}

/** `shellEdge` → `SHELL_EDGE`. */
export function constantName(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
}

function defines(prefix: string, tags: Readonly<Record<string, number>>): string[] {
  return Object.entries(tags).map(
    ([key, value]) => `#define ${prefix}_${constantName(key)} ${glslFloat(value)}`,
  );
}

function colours(): string[] {
  return Object.entries(SCENE_PALETTE).map(([key, hex]) => {
    const [r, g, b] = hexToRgb(hex).map((c) => glslFloat(Number(c.toFixed(4))));
    return `const vec3 COLOR_${constantName(key)} = vec3(${String(r)}, ${String(g)}, ${String(b)});`;
  });
}

/** La cabecera entera: se antepone al código de cada shader. */
export function glslHeader(): string {
  return [
    ...defines('TURTLE', TURTLE_TAG),
    `#define TURTLE_FLIPPERS ${glslFloat(TURTLE_FLIPPERS)}`,
    `#define PLATE_FIRST ${glslFloat(FIRST_PLATE_LABEL)}`,
    `#define PLATE_LAST ${glslFloat(LAST_PLATE_LABEL)}`,
    ...defines('EARTH', EARTH_TAG),
    ...colours(),
    '',
  ].join('\n');
}
