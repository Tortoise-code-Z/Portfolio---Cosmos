import { AdditiveBlending, CustomBlending, NormalBlending } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { JOURNEY_SEGMENTS } from '~/content/chapters';
import { EPILOGUE_ARRIVAL } from '~/lib/scroll/arrival/arrival';
import {
  CHAPTER_SHAPES,
  createShapeMix,
  SHAPE,
  SHIP_ARRIVAL,
  shapeMixAt,
} from '~/lib/scroll/shapeTrack/shapeTrack';

import {
  CAMERA_KEYFRAMES,
  CHAPTER_PRESENCE_FADE,
  EARTH_GRAVITY,
  PORTRAIT_FADE_IN_S,
  SHIP_SOLID,
  SUN,
} from '../config/sceneConfig';
import constellationLinesFragment from '../shaders/constellations/constellationLines.frag.glsl?raw';
import constellationsVertex from '../shaders/constellations/constellations.vert.glsl?raw';
import constellationStarsFragment from '../shaders/constellations/constellationStars.frag.glsl?raw';
import { glslHeader } from '../shaders/glslHeader/glslHeader';
import particlesFragment from '../shaders/particles/particles.frag.glsl?raw';
import particlesVertex from '../shaders/particles/particles.vert.glsl?raw';
import starsFragment from '../shaders/stars/stars.frag.glsl?raw';
import starsVertex from '../shaders/stars/stars.vert.glsl?raw';
import sunFragment from '../shaders/sun/sun.frag.glsl?raw';
import sunVertex from '../shaders/sun/sun.vert.glsl?raw';
import {
  createConstellationLinesMaterial,
  createConstellationStarsMaterial,
  createConstellationUniforms,
  createParticleMaterial,
  createParticleUniforms,
  createSceneFrame,
  createStarsMaterial,
  createStarUniforms,
  createSunMaterial,
  createSunUniforms,
  motionOf,
  POINTER_AWAY,
  shipPresence,
  shipSolid,
  shipWeight,
  updateParticleMaterial,
  updateParticleUniforms,
  updateStarUniforms,
  updateSunUniforms,
  type SceneFrame,
} from './sceneMaterials';

// Los mismos `createShapeMix` y `shapeMixAt`, espiados: para contar los objetos que crea cada frame (ADR-004).
vi.mock('~/lib/scroll/shapeTrack/shapeTrack', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/lib/scroll/shapeTrack/shapeTrack')>();
  return {
    ...original,
    createShapeMix: vi.fn(original.createShapeMix),
    shapeMixAt: vi.fn(original.shapeMixAt),
  };
});

/** La `m` a cada lado de `chapter` con esa presencia (`chapterPresence`): `side` −1 hacia atrás, +1 hacia delante. */
function mWithPresence(chapter: number, presence: number, side: -1 | 1): number {
  return chapter + side * ((1 - presence) / CHAPTER_PRESENCE_FADE);
}

/**
 * Una presencia algo por debajo de 0: la `m` justo pasado el final de la rampa (en el final exacto, el redondeo deja
 * ~1e-16).
 */
const PAST_THE_RAMP = -1e-6;

const frame: Readonly<SceneFrame> = {
  m: 2.5,
  j: null,
  charge: 0.4,
  time: 12,
  delta: 0.016,
  reducedMotion: false,
  pixelRatio: 2,
  aspect: 1.6,
  barTop: 0.08,
  extras: true,
  wide: true,
  pointer: { x: 0.2, y: -0.4, inside: true },
  gravity: { strength: 0.7, x: 0.25, y: -0.5 },
  camera: { position: { x: 0, y: 12.9, z: 14.2 }, target: { x: 0, y: 0, z: 0 } },
  fov: 55,
  plate: 21,
  transmission: false,
  skillGroup: null,
  painted: true,
  portraitShift: { x: 0, y: 0 },
};

/**
 * La `m` de la escena que da una `m` de la forma (la inversa de `arrivalShapeM`): en la llegada del epílogo la Tierra
 * se va antes (ADR-039), así que el Sol y la gravedad de la Tierra se miden con la de la forma.
 */
function fromShapeM(shapeM: number): number {
  const { base, morphEnd } = EPILOGUE_ARRIVAL;
  return shapeM <= base ? shapeM : base + (shapeM - base) * morphEnd;
}

describe('particle uniforms', () => {
  it('start neutral: no charge, no lit plate, no gravity, the pointer away', () => {
    const uniforms = createParticleUniforms();
    expect(uniforms.uCharge.value).toBe(0);
    expect(uniforms.uPlate.value).toBe(0);
    expect(uniforms.uGrav.value).toBe(0);
    expect(uniforms.uMouse.value.toArray()).toEqual([POINTER_AWAY, POINTER_AWAY]);
  });

  it('start still in the singularity (the shape map, ADR-041)', () => {
    const uniforms = createParticleUniforms();
    expect(uniforms.uFrom.value).toBe(SHAPE.singularity);
    expect(uniforms.uTo.value).toBe(SHAPE.nebula);
    expect(uniforms.uT.value).toBe(0);
  });

  it('take the shapes from the m of the shape: the portrait is formed before the arrival ends (ADR-039)', () => {
    const uniforms = createParticleUniforms();
    const { base, morphEnd } = EPILOGUE_ARRIVAL;
    updateParticleUniforms(uniforms, { ...frame, m: base + morphEnd / 2 });
    expect(uniforms.uFrom.value).toBe(SHAPE.earth);
    expect(uniforms.uTo.value).toBe(SHAPE.portrait);
    expect(uniforms.uT.value).toBeCloseTo(0.5);
    updateParticleUniforms(uniforms, { ...frame, m: base + 1 });
    expect(uniforms.uM.value).toBe(base + 1);
    // Quieta en el retrato, entero: el shader evalúa una sola forma.
    expect(uniforms.uFrom.value).toBe(SHAPE.portrait);
    expect(uniforms.uTo.value).toBe(SHAPE.portrait);
    expect(uniforms.uT.value).toBe(0);
  });

  it('take the shapes from the position in the segments, with the satellite in the Mission log (C.7)', () => {
    const uniforms = createParticleUniforms();
    const arrival = JOURNEY_SEGMENTS.findIndex(
      (segment) => segment.kind === 'interlude-arrival' && segment.interlude === 'mission-log',
    );
    const tail = JOURNEY_SEGMENTS.findIndex(
      (segment) => segment.kind === 'interlude-tail' && segment.interlude === 'mission-log',
    );
    // `m` quieta en la nebulosa: la forma la da `j`.
    updateParticleUniforms(uniforms, { ...frame, m: 1, j: arrival + SHIP_ARRIVAL.formed / 2 });
    expect(uniforms.uFrom.value).toBe(SHAPE.nebula);
    expect(uniforms.uTo.value).toBe(SHAPE.satellite);
    expect(uniforms.uT.value).toBeCloseTo(0.5);
    updateParticleUniforms(uniforms, { ...frame, m: 1, j: arrival + 1.5 });
    expect([uniforms.uFrom.value, uniforms.uT.value]).toEqual([SHAPE.satellite, 0]);
    updateParticleUniforms(uniforms, { ...frame, m: 1.5, j: tail + 0.5 });
    expect(uniforms.uFrom.value).toBe(SHAPE.satellite);
    expect(uniforms.uTo.value).toBe(SHAPE.galaxy);
    expect(uniforms.uT.value).toBeCloseTo(0.5);
    // El final del viaje: el retrato, entero.
    updateParticleUniforms(uniforms, { ...frame, m: 5, j: JOURNEY_SEGMENTS.length - 0.5 });
    expect([uniforms.uFrom.value, uniforms.uTo.value, uniforms.uT.value]).toEqual([
      SHAPE.portrait,
      SHAPE.portrait,
      0,
    ]);
  });

  it('without the measured segments, or with reduced motion (no ships), take the shapes from m', () => {
    const uniforms = createParticleUniforms();
    const arrival = JOURNEY_SEGMENTS.findIndex((segment) => segment.kind === 'interlude-arrival');
    updateParticleUniforms(uniforms, {
      ...frame,
      m: 1.5,
      j: arrival + 0.2,
      reducedMotion: true,
    });
    expect([uniforms.uFrom.value, uniforms.uTo.value]).toEqual([SHAPE.nebula, SHAPE.galaxy]);
    expect(uniforms.uT.value).toBeCloseTo(0.5);
    updateParticleUniforms(uniforms, { ...frame, m: 1.5, j: null });
    expect([uniforms.uFrom.value, uniforms.uTo.value]).toEqual([SHAPE.nebula, SHAPE.galaxy]);
  });

  it('take the shapes with no new object per frame: always the same mix (ADR-004)', () => {
    const uniforms = createParticleUniforms();
    vi.mocked(createShapeMix).mockClear();
    vi.mocked(shapeMixAt).mockClear();
    for (const m of [0.5, 2.5, 4.3, 5]) updateParticleUniforms(uniforms, { ...frame, m });
    for (const j of [2.5, 5.5]) updateParticleUniforms(uniforms, { ...frame, j });
    expect(createShapeMix).not.toHaveBeenCalled();
    const outs = vi.mocked(shapeMixAt).mock.calls.map(([, , out]) => out);
    expect(outs).toHaveLength(6);
    expect(new Set(outs).size).toBe(1);
  });

  it('a chapter shape per camera keyframe: the m of the shape is still that of the chapters (ADR-041)', () => {
    // Una forma de capítulo por pose de la cámara, en orden: sin naves, la `m` de la forma sale de la de la escena.
    // Las naves no tienen pose: la cámara se queda en la del capítulo de antes.
    expect(CHAPTER_SHAPES).toHaveLength(CAMERA_KEYFRAMES.length);
  });

  it('take the frame in place (the same objects every frame)', () => {
    const uniforms = createParticleUniforms();
    const before = { ...uniforms };
    const mouse = uniforms.uMouse.value;
    updateParticleUniforms(uniforms, frame);
    expect(uniforms).toEqual(before);
    expect(uniforms.uM.value).toBe(2.5);
    expect(uniforms.uFrom.value).toBe(SHAPE.galaxy);
    expect(uniforms.uTo.value).toBe(SHAPE.turtle);
    expect(uniforms.uT.value).toBe(0.5);
    expect(uniforms.uCharge.value).toBe(0.4);
    expect(uniforms.uPlate.value).toBe(21);
    expect(uniforms.uTime.value).toBe(12);
    expect(uniforms.uPR.value).toBe(2);
    expect(uniforms.uAspect.value).toBe(1.6);
    expect(uniforms.uMotion.value).toBe(1);
    expect(uniforms.uExtras.value).toBe(1);
    expect(uniforms.uGrav.value).toBe(0.7);
    expect(uniforms.uMouse.value).toBe(mouse);
    expect(mouse.toArray()).toEqual([0.25, -0.5]);
    for (const key of Object.keys(before) as (keyof typeof before)[]) {
      expect(uniforms[key]).toBe(before[key]);
    }
  });

  it('uPor: 0 until the portrait is in the geometry; then it rises to 1 in PORTRAIT_FADE_IN_S, real seconds', () => {
    const uniforms = createParticleUniforms();
    const step = { ...frame, delta: PORTRAIT_FADE_IN_S / 4 };
    expect(uniforms.uPor.value).toBe(0);
    updateParticleUniforms(uniforms, step);
    expect(uniforms.uPor.value).toBe(0);
    updateParticleUniforms(uniforms, step, true);
    expect(uniforms.uPor.value).toBeCloseTo(0.25);
    updateParticleUniforms(uniforms, step, true);
    expect(uniforms.uPor.value).toBeCloseTo(0.5);
    for (let i = 0; i < 5; i++) updateParticleUniforms(uniforms, step, true);
    expect(uniforms.uPor.value).toBe(1);
    updateParticleUniforms(uniforms, step);
    expect(uniforms.uPor.value).toBe(0);
  });

  it('uPor with reduced motion: straight to 1, with no rise', () => {
    const uniforms = createParticleUniforms();
    updateParticleUniforms(uniforms, { ...frame, reducedMotion: true, delta: 0.001 }, true);
    expect(uniforms.uPor.value).toBe(1);
  });

  it('the cursor gravity is softer over the Earth (EARTH_GRAVITY), and whole away from it', () => {
    const uniforms = createParticleUniforms();
    const whole = frame.gravity.strength;
    const at = (m: number): number => {
      updateParticleUniforms(uniforms, { ...frame, m });
      return uniforms.uGrav.value;
    };
    expect(at(EARTH_GRAVITY.chapter)).toBeCloseTo(whole * EARTH_GRAVITY.scale);
    // Por los dos lados (la tortuga y el retrato, que también gira con `uGrav`), a medias con media presencia y entera
    // justo pasado el final de la rampa.
    for (const side of [-1, 1] as const) {
      expect(at(fromShapeM(mWithPresence(EARTH_GRAVITY.chapter, 0.5, side)))).toBeCloseTo(
        whole * (1 + EARTH_GRAVITY.scale) * 0.5,
      );
      expect(at(fromShapeM(mWithPresence(EARTH_GRAVITY.chapter, 0.01, side)))).toBeLessThan(whole);
      expect(at(fromShapeM(mWithPresence(EARTH_GRAVITY.chapter, PAST_THE_RAMP, side)))).toBe(whole);
    }
    // A medio morph hacia el retrato, aún suavizada; en la tortuga y en el retrato, entera.
    expect(at(fromShapeM(EARTH_GRAVITY.chapter + 0.25))).toBeLessThan(whole);
    // Con números fijos, sin la cuenta de `fromShapeM`: en la llegada la Tierra se va con la forma (ADR-039), y la
    // rampa acaba entre `m` 4,30 y 4,31 (forma en 4 + 1/1,8 ≈ 4,556; × `morphEnd` 0,55 ≈ 4,306), no en 4,556.
    expect(at(4.3)).toBeLessThan(whole);
    expect(at(4.31)).toBe(whole);
    expect(at(EARTH_GRAVITY.chapter - 1)).toBe(whole);
    expect(at(EARTH_GRAVITY.chapter + 1)).toBe(whole);
  });

  it('reduced motion and the low level turn their uniforms off', () => {
    const uniforms = createParticleUniforms();
    updateParticleUniforms(uniforms, { ...frame, reducedMotion: true, extras: false });
    expect(uniforms.uMotion.value).toBe(0);
    expect(uniforms.uExtras.value).toBe(0);
  });
});

describe('createSceneFrame', () => {
  it('starts at the singularity, uncharged, with motion and extras, narrow, with no mouse and no lit plate', () => {
    expect(createSceneFrame()).toEqual({
      m: 0,
      j: null,
      charge: 0,
      time: 0,
      delta: 0,
      reducedMotion: false,
      pixelRatio: 1,
      aspect: 1,
      barTop: 0,
      extras: true,
      wide: false,
      pointer: { x: 0, y: 0, inside: false },
      gravity: { strength: 0, x: 0, y: 0 },
      camera: { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } },
      fov: 55,
      plate: 0,
      transmission: false,
      skillGroup: null,
      painted: false,
      portraitShift: { x: 0, y: 0 },
    });
  });
});

describe('motionOf', () => {
  it('1 with motion, 0 with reduced motion: the uMotion of the shader', () => {
    expect(motionOf(frame)).toBe(1);
    expect(motionOf({ ...frame, reducedMotion: true })).toBe(0);
    const uniforms = createParticleUniforms();
    updateParticleUniforms(uniforms, { ...frame, reducedMotion: true });
    expect(uniforms.uMotion.value).toBe(motionOf({ ...frame, reducedMotion: true }));
  });
});

describe('constellation uniforms', () => {
  it('start hidden and say whether they paint stars or lines', () => {
    expect(createConstellationUniforms(false)).toEqual({
      uSize: { value: 0 },
      uPR: { value: 1 },
      uOpacity: { value: 0 },
      uLine: { value: 0 },
    });
    expect(createConstellationUniforms(true).uLine.value).toBe(1);
  });
});

describe('star uniforms', () => {
  it('no stars before the Big Bang; all of them from m = 0.4', () => {
    const uniforms = createStarUniforms();
    updateStarUniforms(uniforms, { ...frame, m: 0 });
    expect(uniforms.uVisible.value).toBe(0);
    updateStarUniforms(uniforms, { ...frame, m: 0.2 });
    expect(uniforms.uVisible.value).toBeGreaterThan(0);
    expect(uniforms.uVisible.value).toBeLessThan(1);
    updateStarUniforms(uniforms, { ...frame, m: 0.4 });
    expect(uniforms.uVisible.value).toBe(1);
    expect(uniforms.uTime.value).toBe(12);
    expect(uniforms.uPR.value).toBe(2);
  });
});

describe('sun uniforms', () => {
  it('start hidden, at its size', () => {
    expect(createSunUniforms()).toEqual({ uSize: { value: SUN.size }, uOpacity: { value: 0 } });
  });

  it('shows with the presence of its chapter: whole on the Earth, nothing on the turtle or the portrait', () => {
    const uniforms = createSunUniforms();
    const opacityAt = (m: number): number => {
      updateSunUniforms(uniforms, { ...frame, m });
      return uniforms.uOpacity.value;
    };
    expect(opacityAt(SUN.chapter)).toBe(SUN.opacity);
    // Por los dos lados, con la rampa de la presencia: a medias con media y nada justo pasado su final.
    for (const side of [-1, 1] as const) {
      expect(opacityAt(fromShapeM(mWithPresence(SUN.chapter, 0.5, side)))).toBeCloseTo(
        SUN.opacity * 0.5,
      );
      expect(opacityAt(fromShapeM(mWithPresence(SUN.chapter, 0.01, side)))).toBeGreaterThan(0);
      expect(opacityAt(fromShapeM(mWithPresence(SUN.chapter, PAST_THE_RAMP, side)))).toBe(0);
    }
    expect(opacityAt(SUN.chapter - 1)).toBe(0);
    expect(opacityAt(SUN.chapter + 1)).toBe(0);
    // Con números fijos: en la llegada se apaga con la forma, entre `m` 4,30 y 4,31 (ver la gravedad).
    expect(opacityAt(4.3)).toBeGreaterThan(0);
    expect(opacityAt(4.31)).toBe(0);
  });

  it('waits for the particles: nothing on its chapter before they are painted (the Earth not there yet)', () => {
    const uniforms = createSunUniforms();
    updateSunUniforms(uniforms, { ...frame, m: SUN.chapter, painted: false });
    expect(uniforms.uOpacity.value).toBe(0);
    updateSunUniforms(uniforms, { ...frame, m: SUN.chapter, painted: true });
    expect(uniforms.uOpacity.value).toBe(SUN.opacity);
  });

  it('is seen whole with reduced motion and on the low level (it only stops pulsing)', () => {
    const uniforms = createSunUniforms();
    for (const change of [{ reducedMotion: true }, { extras: false }]) {
      updateSunUniforms(uniforms, { ...frame, ...change, m: SUN.chapter });
      expect(uniforms.uOpacity.value, JSON.stringify(change)).toBe(SUN.opacity);
    }
  });

  it('glows with the alpha profile of the constellation stars: the same block in both shaders', () => {
    // Copiado (los fragment shaders no llevan cabecera, por peso): de `CORE` al color, todo igual salvo de dónde sale
    // la distancia al centro (`vUv` del cuadrado, `gl_PointCoord` del punto).
    const profile = (source: string): string | undefined =>
      /const float CORE[\s\S]*?gl_FragColor[^\n]*/
        .exec(source)?.[0]
        .split('\n')
        .filter((line) => !/^\s*float d = /.test(line))
        .join('\n');
    const sun = profile(sunFragment);
    expect(sun).toContain('const float HALO');
    expect(sun).toBe(profile(constellationStarsFragment));
  });

  it('pulses with the scene clock, within ± SUN.pulse; still at its size with reduced motion', () => {
    const uniforms = createSunUniforms();
    const sizeAt = (time: number, reducedMotion = false): number => {
      updateSunUniforms(uniforms, { ...frame, time, reducedMotion });
      return uniforms.uSize.value;
    };
    const quarter = Math.PI / 2 / SUN.pulseRate;
    expect(sizeAt(0)).toBe(SUN.size);
    expect(sizeAt(quarter)).toBeCloseTo(SUN.size + SUN.pulse);
    expect(sizeAt(3 * quarter)).toBeCloseTo(SUN.size - SUN.pulse);
    expect(sizeAt(quarter, true)).toBe(SUN.size);
  });
});

/** Todos los shaders de `scene/shaders`: cada uno, con su material en la tabla de abajo. */
const ALL_SHADERS = Object.values(
  import.meta.glob<string>('../shaders/**/*.glsl', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
);

const MATERIALS = [
  ['particles', createParticleMaterial, createParticleUniforms, particlesVertex, particlesFragment],
  ['stars', createStarsMaterial, createStarUniforms, starsVertex, starsFragment],
  [
    'constellation stars',
    createConstellationStarsMaterial,
    () => createConstellationUniforms(false),
    constellationsVertex,
    constellationStarsFragment,
  ],
  [
    'constellation lines',
    createConstellationLinesMaterial,
    () => createConstellationUniforms(true),
    constellationsVertex,
    constellationLinesFragment,
  ],
  ['sun', createSunMaterial, createSunUniforms, sunVertex, sunFragment],
] as const;

describe('materials', () => {
  it('every shader of scene/shaders has its material here', () => {
    const used = new Set<string>(
      MATERIALS.flatMap(([, , , vertex, fragment]) => [vertex, fragment]),
    );
    expect(ALL_SHADERS.length).toBeGreaterThan(0);
    for (const source of ALL_SHADERS) expect(used.has(source)).toBe(true);
  });

  for (const [name, material, uniforms, vertex, fragment] of MATERIALS) {
    it(`${name}: additive light, no depth, its own shaders with the header first and the uniforms shared`, () => {
      const own = uniforms();
      const created = (material as (u: typeof own) => ReturnType<typeof createParticleMaterial>)(
        own,
      );
      expect(created.blending).toBe(AdditiveBlending);
      expect(created.transparent).toBe(true);
      expect(created.depthWrite).toBe(false);
      expect(created.depthTest).toBe(false);
      expect(created.vertexShader).toBe(glslHeader() + vertex);
      expect(created.fragmentShader).toBe(fragment);
      for (const [key, uniform] of Object.entries(own)) expect(created.uniforms[key]).toBe(uniform);
      // Los uniforms que declaran sus shaders son justo los suyos: uno mal escrito se quedaría en 0 sin avisar.
      const declared = new Set(
        [...`${vertex}\n${fragment}`.matchAll(/^\s*uniform\s+\w+\s+(\w+)\s*;/gm)].map(([, n]) => n),
      );
      expect([...declared].sort()).toEqual(Object.keys(own).sort());
    });
  }
});

describe('the ships (C.7)', () => {
  const mix = (from: number, to: number, t: number): ReturnType<typeof createShapeMix> =>
    ({ from, to, t }) as ReturnType<typeof createShapeMix>;
  const arrival = JOURNEY_SEGMENTS.findIndex((segment) => segment.kind === 'interlude-arrival');

  it('shipWeight: t coming to a ship, 1 − t leaving it, 1 still in it, 0 without one', () => {
    expect(shipWeight(mix(SHAPE.nebula, SHAPE.satellite, 0.3))).toBe(0.3);
    expect(shipWeight(mix(SHAPE.satellite, SHAPE.galaxy, 0.25))).toBe(0.75);
    expect(shipWeight(mix(SHAPE.satellite, SHAPE.galaxy, 0))).toBe(1);
    expect(shipWeight(mix(SHAPE.galaxy, SHAPE.turtle, 0.5))).toBe(0);
  });

  it('shipSolid: opaque as the ship forms, at once in it, light again as it comes apart; 0 without a ship', () => {
    expect(shipSolid(mix(SHAPE.nebula, SHAPE.satellite, SHIP_SOLID.rise))).toBe(0);
    expect(shipSolid(mix(SHAPE.nebula, SHAPE.satellite, 1))).toBe(1);
    expect(shipSolid(mix(SHAPE.satellite, SHAPE.galaxy, 0))).toBe(1);
    expect(shipSolid(mix(SHAPE.satellite, SHAPE.galaxy, SHIP_SOLID.fall / 2))).toBeCloseTo(0.5);
    expect(shipSolid(mix(SHAPE.satellite, SHAPE.galaxy, SHIP_SOLID.fall))).toBe(0);
    expect(shipSolid(mix(SHAPE.nebula, SHAPE.galaxy, 0.5))).toBe(0);
  });

  it('the particle uniforms take the solidity and the ship pose from the position in the segments', () => {
    const uniforms = createParticleUniforms();
    const before = { ...uniforms };
    const position = uniforms.uShipPos.value;
    updateParticleUniforms(uniforms, { ...frame, m: 1, j: arrival + 0.5 });
    expect(uniforms.uFrom.value).toBe(SHAPE.satellite);
    expect(uniforms.uSolid.value).toBe(1);
    // A medio acercarse: fuera del origen, a su tamaño casi, con su pantalla en la proporción de lo que se ve.
    expect(uniforms.uShipPos.value).toBe(position);
    expect(position.length()).toBeGreaterThan(0);
    expect(uniforms.uShipScale.value).toBeGreaterThan(0.55);
    expect(uniforms.uScreen.value.y).toBe(2);
    expect(uniforms.uScreen.value.x).toBeGreaterThan(2);
    expect(uniforms.uVert.value).toBe(0);
    expect(uniforms.uFlagSpan.value).toBeGreaterThan(0);
    for (const key of Object.keys(before) as (keyof typeof before)[]) {
      expect(uniforms[key]).toBe(before[key]);
    }
  });

  it('without a ship in the mix the material is the usual one (uSolid 0) and the ship is not placed', () => {
    const uniforms = createParticleUniforms();
    updateParticleUniforms(uniforms, { ...frame, m: 2.5, j: null });
    expect(uniforms.uSolid.value).toBe(0);
    expect(uniforms.uShipPos.value.toArray()).toEqual([0, 0, 0]);
  });

  it('shipPresence: what the camera fades its parallax with', () => {
    expect(shipPresence({ ...frame, m: 1, j: arrival + 0.5 })).toBe(1);
    expect(shipPresence({ ...frame, m: 1, j: arrival })).toBe(0);
    expect(shipPresence({ ...frame, m: 2.5, j: null })).toBe(0);
    // Con movimiento reducido no hay naves.
    expect(shipPresence({ ...frame, m: 1, j: arrival + 0.5, reducedMotion: true })).toBe(0);
  });

  it('updateParticleMaterial: additive as always with uSolid 0; mixed, then with depth, then opaque', () => {
    const uniforms = createParticleUniforms();
    const material = createParticleMaterial(uniforms);
    const state = (solid: number): [number, boolean, boolean, boolean] => {
      uniforms.uSolid.value = solid;
      updateParticleMaterial(material, uniforms);
      return [material.blending, material.transparent, material.depthTest, material.depthWrite];
    };
    expect(state(0)).toEqual([AdditiveBlending, true, false, false]);
    expect(state(0.3)).toEqual([CustomBlending, true, false, false]);
    expect(state(0.7)).toEqual([CustomBlending, true, true, true]);
    expect(state(1)).toEqual([NormalBlending, false, true, true]);
    expect(state(0)).toEqual([AdditiveBlending, true, false, false]);
  });
});
