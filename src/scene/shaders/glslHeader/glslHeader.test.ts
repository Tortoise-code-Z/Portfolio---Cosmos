import { describe, expect, it } from 'vitest';

import { EPILOGUE_ARRIVAL } from '~/lib/scroll/arrival/arrival';
import { SHAPE, SHAPE_TRACK, type ShapeId } from '~/lib/scroll/shapeTrack/shapeTrack';

import { FIRST_PLATE_LABEL, LAST_PLATE_LABEL } from '../../config/plateSlots/plateSlots';
import { PORTRAIT_TURN, SHIP_FRAME, SUN, TURTLE_SWAY } from '../../config/sceneConfig';
import { SCENE_PALETTE } from '../../config/scenePalette/scenePalette';
import { EARTH_TAG, PORTRAIT_FRAME, TURTLE_TAG } from '../../shapes/shapeContract/shapeContract';
import { stripGlslComments } from '../stripGlslComments/stripGlslComments';
import { constantName, glslFloat, glslHeader, sunDirection } from './glslHeader';

const header = glslHeader();
/**
 * Todos los shaders de `scene/shaders`, por su ruta: uno nuevo queda vigilado sin apuntarlo a mano. La cabecera solo
 * se antepone a los vertex shaders (`sceneMaterials`).
 */
const SHADERS: Readonly<Record<string, string>> = import.meta.glob<string>('../**/*.glsl', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const only = (suffix: string): Readonly<Record<string, string>> =>
  Object.fromEntries(Object.entries(SHADERS).filter(([path]) => path.endsWith(suffix)));
const VERTEX_SHADERS = only('.vert.glsl');
const FRAGMENT_SHADERS = only('.frag.glsl');
const particlesVertex = SHADERS['../particles/particles.vert.glsl'] ?? '';
const HEADER_NAME = /\b(?:SHAPE|TURTLE|EARTH|PLATE|PORTRAIT|COLOR|SUN|ARRIVAL)_\w+/g;
/** El shader de las partículas sin comentarios: lo que compila. */
const particlesCode = stripGlslComments(particlesVertex);
/** El cuerpo de `shape()`, la función que pinta la forma de un id. */
const shapeBody =
  /^void shape\(float id, [^)]*\) \{\n([\s\S]*?)\n\}$/m.exec(particlesCode)?.[1] ?? '';
/** Las condiciones de sus ramas (`if (…) forma(P, C, S, A);`). */
const shapeConditions = [
  ...shapeBody.matchAll(/^\s*(?:else )?if \((.+)\) \w+\(P, C, S, A\);$/gm),
].map(([, condition]) => condition);

/** El nombre de la cabecera de una forma: `SHAPE_EARTH`. */
function shapeName(id: ShapeId): string {
  const key =
    Object.entries(SHAPE).find(([, value]) => value === id)?.[0] ?? `unknown ${String(id)}`;
  return `SHAPE_${constantName(key)}`;
}

/** Los nombres que define la cabecera (`#define X …` y `const vec3 X = …`). */
const defined = new Set(
  [...header.matchAll(/^(?:#define (\w+)|const vec3 (\w+))/gm)].map(([, a, b]) => a ?? b),
);

describe('the shaders of scene/shaders', () => {
  it('are all here, each a vertex or a fragment shader', () => {
    expect(Object.keys(SHADERS).length).toBeGreaterThanOrEqual(9);
    expect(particlesVertex).not.toBe('');
    expect(Object.keys(VERTEX_SHADERS).length + Object.keys(FRAGMENT_SHADERS).length).toBe(
      Object.keys(SHADERS).length,
    );
  });
});

describe('glslHeader', () => {
  it('defines every turtle and Earth tag with its value, and the plate range', () => {
    for (const [key, value] of Object.entries(TURTLE_TAG)) {
      expect(header).toContain(`#define TURTLE_${constantName(key)} ${glslFloat(value)}\n`);
    }
    for (const [key, value] of Object.entries(EARTH_TAG)) {
      expect(header).toContain(`#define EARTH_${constantName(key)} ${glslFloat(value)}\n`);
    }
    expect(header).toContain(`#define PLATE_FIRST ${glslFloat(FIRST_PLATE_LABEL)}\n`);
    expect(header).toContain(`#define PLATE_LAST ${glslFloat(LAST_PLATE_LABEL)}\n`);
  });

  it('defines how the turtle sways, from TURTLE_SWAY, and the particles shader sways with those names', () => {
    for (const [key, value] of Object.entries(TURTLE_SWAY)) {
      expect(header).toContain(`#define TURTLE_SWAY_${constantName(key)} ${glslFloat(value)}\n`);
    }
    // La misma cuenta que `swayTurtlePoint` (math/platePins): girar sobre Y y después subir o bajar. El giro, con
    // los signos de `swayTurtlePoint` (`out[0] = c·x + s·z`, `out[2] = −s·x + c·z`): con otro, la tortuga giraría al
    // revés que sus pins.
    expect(particlesVertex).toContain(
      'vec3 rotY(vec3 p, float a) {\n' +
        '  float c = cos(a);\n' +
        '  float s = sin(a);\n' +
        '  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);\n' +
        '}',
    );
    expect(particlesVertex).toContain(
      'p = rotY(p, sin(uTime * TURTLE_SWAY_YAW_RATE) * TURTLE_SWAY_YAW * uMotion);\n' +
        '  p.y += sin(uTime * TURTLE_SWAY_BOB_RATE) * TURTLE_SWAY_BOB * uMotion;',
    );
  });

  it('the Earth is lit from the Sun the visitor sees: SUN_DIR points from the Earth (the origin) to SUN.position', () => {
    const [x, y, z] = sunDirection();
    expect(Math.hypot(x, y, z)).toBeCloseTo(1);
    const length = Math.hypot(...SUN.position);
    expect([x, y, z].map((c) => Number(c.toFixed(6)))).toEqual(
      SUN.position.map((c) => Number((c / length).toFixed(6))),
    );
    // Lo que llega al GLSL, leído de la cabecera (no con la fórmula de la implementación).
    const written = /^#define SUN_DIR vec3\((\S+), (\S+), (\S+)\)$/m
      .exec(header)
      ?.slice(1)
      .map(Number);
    expect(written).toHaveLength(3);
    for (const [i, c] of [x, y, z].entries()) expect(written?.[i]).toBeCloseTo(c, 4);
    // La luz de la Tierra es esa, no una dirección escrita a mano en el shader: la línea de `lam` no lleva números.
    const lam = /^\s*float lam = (.+);$/m.exec(particlesVertex)?.[1];
    expect(lam).toContain('SUN_DIR');
    expect(lam).not.toMatch(/\d/);
  });

  it('the lit plate pulses only with motion: its sin(uTime * 5.0) goes through uMotion', () => {
    expect(particlesVertex).toContain(
      'COLOR_TURTLE_PLATE_LIT * (2.0 + 0.6 * sin(uTime * 5.0) * uMotion)',
    );
  });

  it('defines the half height of the portrait and its fade at the bottom, from its frame', () => {
    const value = /#define PORTRAIT_HALF_H (\S+)\n/.exec(header)?.[1];
    expect(Number(value)).toBeCloseTo(PORTRAIT_FRAME.halfHeight, 4);
    const fade = /#define PORTRAIT_FADE_H (\S+)\n/.exec(header)?.[1];
    expect(Number(fade)).toBeCloseTo(PORTRAIT_FRAME.fadeHeight, 4);
  });

  it('the portrait turns with the mouse by PORTRAIT_TURN, never by a number by hand', () => {
    expect(header).toContain(`#define PORTRAIT_TURN ${glslFloat(PORTRAIT_TURN)}\n`);
    expect(particlesCode).toContain(
      'p = rotY(p, clamp(uMouse.x, -1.0, 1.0) * uGrav * PORTRAIT_TURN);',
    );
  });

  it('the cursor gravity leaves the face and the ships alone: its pull and glow go by what is still neither', () => {
    expect(particlesCode).toContain(
      'float f = exp(-dot(d, d) * GRAV_FALLOFF) * uGrav * max(1.0 - portraitWeight - shipWeight, 0.0);',
    );
    expect(particlesCode).toContain(
      'float shipWeight = (isShip(uFrom) ? 1.0 - tt : 0.0) + (isShip(uTo) ? tt : 0.0);',
    );
    // Las dos naves, por su nombre.
    expect(particlesCode).toContain(
      'return isTag(id, SHAPE_SATELLITE) || isTag(id, SHAPE_MOTHERSHIP);',
    );
  });

  it('defines how a ship sways from the same numbers as its pose (SHIP_FRAME)', () => {
    const define = (name: string): number =>
      Number(new RegExp(`#define ${name} (\\S+)\\n`).exec(header)?.[1]);
    expect(define('SHIP_SWAY')).toBe(SHIP_FRAME.sway);
    expect(define('SHIP_SWAY_RATE')).toBe(SHIP_FRAME.swayRate);
  });

  it('defines the arrival of the epilogue from the same numbers as the camera and the page (ADR-039)', () => {
    const define = (name: string): number =>
      Number(new RegExp(`#define ${name} (\\S+)\\n`).exec(header)?.[1]);
    expect(define('ARRIVAL_BASE')).toBe(EPILOGUE_ARRIVAL.base);
    expect(define('ARRIVAL_BEAM_START')).toBe(EPILOGUE_ARRIVAL.beam[0]);
    expect(define('ARRIVAL_BEAM_END')).toBe(EPILOGUE_ARRIVAL.beam[1]);
    expect(define('ARRIVAL_BEAM_REACH')).toBe(EPILOGUE_ARRIVAL.beamReach);
    // El shader los usa: la línea del haz baja hasta ARRIVAL_BEAM_REACH altos de la ventana (en NDC, de 1 arriba a −1
    // abajo: el doble), como `arrivalBeamLine` de la página. Dónde está formado el retrato no: llega en `uT`
    // (`shapePosition`, la misma cuenta que la cámara).
    expect(header).not.toContain('ARRIVAL_MORPH_END');
    expect(particlesVertex).toContain('float b = 1.0 - 2.0 * ARRIVAL_BEAM_REACH * down;');
  });

  it('defines an id per shape, the ones of uFrom/uTo (the shape map, ADR-041)', () => {
    for (const [key, id] of Object.entries(SHAPE)) {
      expect(header).toContain(`#define SHAPE_${constantName(key)} ${glslFloat(id)}\n`);
    }
  });

  it('shape() has a branch per shape of the journey, each by its name; an unknown id paints nothing', () => {
    // Cada rama elige por el nombre de la forma (`isTag(id, SHAPE_EARTH)`), nunca por un número ni por un orden.
    expect(shapeConditions.length).toBeGreaterThanOrEqual(SHAPE_TRACK.length);
    for (const condition of shapeConditions)
      expect(condition).toMatch(/^isTag\(id, SHAPE_[A-Z_]+\)$/);
    // Una forma del viaje sin su rama se pintaría como otra sin avisar: cada una tiene la suya.
    for (const id of SHAPE_TRACK) expect(shapeConditions).toContain(`isTag(id, ${shapeName(id)})`);
    // El último `else` no es una forma: tamaño y alfa 0, sin llamar a ninguna.
    const fallback = /\belse \{([^}]*)\}\s*$/.exec(shapeBody)?.[1] ?? '';
    expect(fallback).toContain('S = 0.0;');
    expect(fallback).toContain('A = 0.0;');
    expect(fallback).not.toMatch(/\w+\(P, C, S, A\)/);
  });

  it('the particles take the shapes from uFrom/uTo/uT, never from m or a number by hand (ADR-041)', () => {
    // Ninguna comparación con las formas: `uFrom < 0.5`, `id == 4.0`, `3.5 > id`, `abs(id - 4.0)`.
    expect(particlesCode).not.toMatch(/\b(?:uFrom|uTo|id)\s*(?:[<>]=?|[=!]=)/);
    expect(particlesCode).not.toMatch(/(?:[<>]=?|[=!]=)\s*(?:uFrom|uTo|id)\b/);
    expect(particlesCode).not.toMatch(/abs\(\s*(?:uFrom|uTo|id)\s*-/);
    // `uM` solo está para el haz de la llegada: su declaración y `arrivalBeam()`.
    expect([...particlesCode.matchAll(/\buM\b/g)]).toHaveLength(2);
    expect(particlesCode).toContain('float a = clamp(uM - ARRIVAL_BASE, 0.0, 1.0);');
    // Las dos formas, la segunda solo durante un cambio (uT > 0: quieta, una sola).
    expect(particlesCode).toContain('shape(uFrom, PA, CA, SA, AA);');
    expect(particlesCode).toContain('if (uT > 0.0) {\n    shape(uTo, PB, CB, SB, AB);');
    expect(particlesCode).toContain('bool toPortrait = isTag(uTo, SHAPE_PORTRAIT);');
  });

  it('no pow() whose base can be negative (undefined in GLSL ES): only the bases known to be ≥ 0', () => {
    // Una base que puede ser negativa se escribe como producto (`exp(-q * q)`): particulas-y-shaders.md.
    // El valor absoluto, también: el casco de la nave nodriza (una superelipse).
    const allowed = ['pow(rim,', 'pow(2.0,', 'pow(1.0 - d * 2.0,', 'pow(abs(ca),', 'pow(abs(sa),'];
    for (const [name, source] of Object.entries(SHADERS)) {
      const calls = [...source.matchAll(/\bpow\([^,]*,/g)].map(([call]) => call);
      expect(
        calls.filter((call) => !allowed.includes(call)),
        name,
      ).toEqual([]);
    }
  });

  it('a vec3 per palette colour, with its components', () => {
    expect(header).toContain('const vec3 COLOR_TURTLE_EDGE = vec3(1.0, 0.6588, 0.2784);');
    expect(
      Object.keys(SCENE_PALETTE).every((key) => defined.has(`COLOR_${constantName(key)}`)),
    ).toBe(true);
  });

  it('every tag, plate or colour name the vertex shaders use is defined (a typo would not compile)', () => {
    for (const [name, source] of Object.entries(VERTEX_SHADERS)) {
      const used = new Set([...source.matchAll(HEADER_NAME)].map(([match]) => match));
      const missing = [...used].filter((identifier) => !defined.has(identifier));
      expect(missing, name).toEqual([]);
    }
  });

  it('the fragment shaders use none of its names: they do not get the header', () => {
    for (const [name, source] of Object.entries(FRAGMENT_SHADERS)) {
      expect(
        [...source.matchAll(HEADER_NAME)].map(([match]) => match),
        name,
      ).toEqual([]);
    }
  });

  it('the shaders write no tag number or colour by hand: they go through the names', () => {
    for (const [name, source] of Object.entries(SHADERS)) {
      // Una etiqueta o un id escritos a mano: `tag … 12.5`, `isTag(tag, 12.0)`, `isTag(id, 4.0)`,
      // `abs(tag - 12.0)` o `aR.y < 12.5`.
      expect(source, name).not.toMatch(/\btag\s*[<>=]=?\s*\d/);
      expect(source, name).not.toMatch(/isTag\(\s*\w+\s*,\s*-?[\d.]/);
      expect(source, name).not.toMatch(/abs\(tag\s*-\s*\d/);
      expect(source, name).not.toMatch(/\baR\.[yz]\s*[<>=!]=?\s*\d/);
      // Un nombre desplazado a mano, salvo el ±0,5 de redondeo: `TURTLE_FLIPPER + 1.5` da por hecho 2 aletas.
      expect(source, name).not.toMatch(/\b(?:TURTLE|EARTH|PLATE)_[A-Z_]+\s*[+-]\s*(?!0\.5\b)\d/);
      // Un color escrito a mano en vez de uno de la paleta: `c = vec3(2.0)`.
      expect(source, name).not.toMatch(/\b[cC]\s*=\s*vec3\(\s*-?[\d.]/);
    }
  });

  it('glslFloat always writes a float literal; constantName goes to UPPER_SNAKE', () => {
    expect(glslFloat(20)).toBe('20.0');
    expect(glslFloat(0.25)).toBe('0.25');
    expect(glslFloat(-3)).toBe('-3.0');
    expect(glslFloat(1e-7)).toBe('1e-7');
    expect(() => glslFloat(Number.NaN)).toThrow(RangeError);
    expect(constantName('shellEdge')).toBe('SHELL_EDGE');
    expect(constantName('galaxyArmPink')).toBe('GALAXY_ARM_PINK');
    expect(constantName('head')).toBe('HEAD');
  });
});
