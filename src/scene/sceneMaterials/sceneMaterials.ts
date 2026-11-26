import {
  AdditiveBlending,
  AddEquation,
  CustomBlending,
  Matrix3,
  NormalBlending,
  OneFactor,
  OneMinusSrcAlphaFactor,
  ShaderMaterial,
  Vector2,
  Vector3,
  type IUniform,
} from 'three';

import { JOURNEY_SEGMENTS } from '~/content/chapters';
import type { SkillGroupId } from '~/content/types';
import { lerp } from '~/lib/math/lerp/lerp';
import { smoothstep } from '~/lib/math/smoothstep/smoothstep';
import { journeyValue } from '~/lib/scroll/journeyPosition/journeyPosition';
import {
  CHAPTER_SHAPES,
  createShapeMix,
  isShip,
  journeySteps,
  SHAPE,
  SHAPE_TRACK,
  shapeMixAt,
  shapePosition,
  type ShapeId,
  type ShapeMix,
} from '~/lib/scroll/shapeTrack/shapeTrack';

import { NO_PLATE } from '../config/plateSlots/plateSlots';
import { EARTH_GRAVITY, PORTRAIT_FADE_IN_S, SHIP_SOLID, SUN } from '../config/sceneConfig';
import { createCameraPose, type CameraPose } from '../math/camera/camera';
import { shapePresence } from '../math/chapterPresence/chapterPresence';
import { createGravity, type Gravity } from '../math/gravity/gravity';
import { createShipPose, shipPose } from '../math/shipPose/shipPose';
import { createScenePointer, type ScenePointer } from '../pointer/pointer';
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

/**
 * Materiales de la escena (docs/04-escena/particulas-y-shaders.md → «Uniforms» y «Material»): los shaders con
 * su cabecera (etiquetas y colores desde TypeScript), los uniforms y cómo se ponen al día en cada frame, sin
 * crear objetos.
 */

export interface ParticleUniforms {
  /** `m` (0–5): la de la llegada del epílogo (su haz). La forma va en `uFrom`, `uTo` y `uT`. */
  readonly uM: IUniform<number>;
  /**
   * El mapa de formas (ADR-041): la forma de la que sale (`SHAPE`), a la que va y cuánto lleva (0 → 1; 0, quieta en
   * `uFrom`, y el shader evalúa una sola).
   */
  readonly uFrom: IUniform<ShapeId>;
  readonly uTo: IUniform<ShapeId>;
  readonly uT: IUniform<number>;
  /** Segundos de animación (congelados con movimiento reducido). */
  readonly uTime: IUniform<number>;
  /** Carga de la detonación (0–1): el punto crece y vibra (la vibración, sin movimiento reducido). */
  readonly uCharge: IUniform<number>;
  /** Densidad de píxeles del lienzo. */
  readonly uPR: IUniform<number>;
  /** Etiqueta de la placa iluminada (0 = ninguna): `SceneFrame.plate`. */
  readonly uPlate: IUniform<number>;
  /**
   * Gravedad del cursor, de 0 a 1 (0 en táctil, sin ratón dentro o con movimiento reducido), más suave sobre la
   * Tierra (`EARTH_GRAVITY`).
   */
  readonly uGrav: IUniform<number>;
  readonly uAspect: IUniform<number>;
  /** Dónde tira la gravedad, en NDC (el ratón o, al apagarse, el último punto donde estuvo). */
  readonly uMouse: IUniform<Vector2>;
  /** 1 normal · 0 movimiento reducido (anula las oscilaciones propias). */
  readonly uMotion: IUniform<number>;
  /** 1 · 0 en Bajo: sin estela de la tortuga ni luces de ciudad. */
  readonly uExtras: IUniform<number>;
  /**
   * El retrato (`pPor`): 0 hasta que está en la geometría (el retrato es la Tierra); entonces sube a 1 en
   * `PORTRAIT_FADE_IN_S` (de golpe con movimiento reducido) y la Tierra pasa a retrato.
   */
  readonly uPor: IUniform<number>;
  /**
   * La nave que trae una transmisión (C.7 · naves; `math/shipPose`): el centro de su pantalla en la escena, sus ejes
   * (los de la cámara), su tamaño, lo que está girada (en Y y en X), su pantalla en sus unidades, si va en vertical
   * y hasta dónde cruza la bandera de Irlanda. Solo cuentan con una nave en la mezcla.
   */
  readonly uShipPos: IUniform<Vector3>;
  readonly uShipAxes: IUniform<Matrix3>;
  readonly uShipScale: IUniform<number>;
  readonly uShipTurn: IUniform<Vector2>;
  readonly uScreen: IUniform<Vector2>;
  readonly uVert: IUniform<number>;
  readonly uFlagSpan: IUniform<number>;
  /**
   * De luz que se suma (0, como todas las formas) a puntos opacos con profundidad (1): solo mientras se forma o se ve
   * una nave (`shipSolid`). Con 0, el material de siempre.
   */
  readonly uSolid: IUniform<number>;
}

export interface StarUniforms {
  readonly uTime: IUniform<number>;
  readonly uPR: IUniform<number>;
  /** Antes del Big Bang no hay estrellas: sigue a `m`. */
  readonly uVisible: IUniform<number>;
}

/** Los de una constelación: sus estrellas y sus líneas comparten shader de vértices (`uLine` las distingue). */
export interface ConstellationUniforms {
  /** Tamaño de las estrellas, en píxeles CSS. */
  readonly uSize: IUniform<number>;
  readonly uPR: IUniform<number>;
  readonly uOpacity: IUniform<number>;
  /** 0 en las estrellas · 1 en las líneas (su color). */
  readonly uLine: IUniform<number>;
}

/** Los del Sol (F4.5): su lado y su opacidad, que pone `updateSunUniforms`. */
export interface SunUniforms {
  /** Lado del cuadrado, en unidades de la escena. */
  readonly uSize: IUniform<number>;
  readonly uOpacity: IUniform<number>;
}

/**
 * Fuera de la pantalla (NDC va de −1 a 1): solo hasta el primer frame, que pone en `uMouse` el punto de la gravedad.
 * Es una defensa: lo que apaga la gravedad es `uGrav = 0`, no que el punto esté lejos.
 */
export const POINTER_AWAY = 9;

/** Las estrellas aparecen con el Big Bang: `smoothstep(0,02; 0,4; m)`. */
export const STARS_VISIBLE_FROM = 0.02;
export const STARS_VISIBLE_AT = 0.4;

export function createParticleUniforms(): ParticleUniforms {
  const { from, to, t } = createShapeMix();
  return {
    uM: { value: 0 },
    uFrom: { value: from },
    uTo: { value: to },
    uT: { value: t },
    uTime: { value: 0 },
    uCharge: { value: 0 },
    uPR: { value: 1 },
    uPlate: { value: NO_PLATE },
    uGrav: { value: 0 },
    uAspect: { value: 1 },
    uMouse: { value: new Vector2(POINTER_AWAY, POINTER_AWAY) },
    uMotion: { value: 1 },
    uExtras: { value: 1 },
    uPor: { value: 0 },
    uShipPos: { value: new Vector3() },
    uShipAxes: { value: new Matrix3() },
    uShipScale: { value: 1 },
    uShipTurn: { value: new Vector2() },
    uScreen: { value: new Vector2(1, 1) },
    uVert: { value: 0 },
    uFlagSpan: { value: 0 },
    uSolid: { value: 0 },
  };
}

export function createConstellationUniforms(line: boolean): ConstellationUniforms {
  return {
    uSize: { value: 0 },
    uPR: { value: 1 },
    uOpacity: { value: 0 },
    uLine: { value: line ? 1 : 0 },
  };
}

export function createSunUniforms(): SunUniforms {
  return { uSize: { value: SUN.size }, uOpacity: { value: 0 } };
}

export function createStarUniforms(): StarUniforms {
  return { uTime: { value: 0 }, uPR: { value: 1 }, uVisible: { value: 0 } };
}

/**
 * Lo que cambia de un frame a otro. Un solo objeto para toda la visita: el bucle de frames lo rellena antes de
 * cada `advance()` y las piezas lo leen en su `useFrame` (cero objetos nuevos por frame, ADR-004).
 */
export interface SceneFrame {
  /**
   * La `m` de la escena, suavizada desde `mTarget` (ADR-028). Toda pieza de la escena lee esta, nunca
   * `sceneStore.m`.
   */
  m: number;
  /**
   * La posición en los tramos de la escena (`lib/scroll/journeyPosition`), suavizada desde `jTarget` como `m`: de ella
   * salen las formas y la nave (C.7 · naves). `null` mientras la página no ha medido los tramos: las formas salen de
   * `m`, sin naves.
   */
  j: number | null;
  /**
   * Las formas de este frame (`shapeMixOf`): las calcula el bucle una vez, después de `m` y `j`, y las leen las
   * partículas, la cámara y lo atado a una forma (pins, placas, constelaciones, el Sol: `shapePresence`). El mismo
   * objeto toda la visita.
   */
  readonly shapes: ShapeMix;
  /** Carga de la detonación (0–1), tal cual la deja el botón del hero en `sceneStore`. */
  charge: number;
  time: number;
  /** Segundos reales desde el frame anterior (`sceneClock.delta`): para suavizar, no para animar. */
  delta: number;
  reducedMotion: boolean;
  pixelRatio: number;
  aspect: number;
  /**
   * La fracción del alto del lienzo que tapa la barra fija de arriba (0 sin barra): la pantalla de una nave se encaja
   * con lo que se ve debajo (`math/shipPose`). La pone el bucle.
   */
  barTop: number;
  /** Extras del nivel (estela y luces de ciudad; no en Bajo: tampoco las piezas pequeñas de las naves). */
  extras: boolean;
  /** Escritorio (`WIDE_LAYOUT_QUERY`, la media query de los paneles): el encuadre se aparta a un lado. */
  wide: boolean;
  /** El ratón (lo escribe `watchPointer`; es el mismo objeto toda la visita). */
  readonly pointer: ScenePointer;
  /** La gravedad del cursor (la pone al día el bucle con `followGravity`; el mismo objeto toda la visita). */
  readonly gravity: Gravity;
  /**
   * La pose de la cámara de este frame (la escribe `CameraRig`, antes que nadie: va la primera en el `<Canvas>`) y
   * su campo de visión vertical, en grados: con ellos se proyectan las etiquetas (`math/projection`).
   */
  readonly camera: CameraPose;
  fov: number;
  /**
   * La placa del caparazón que se ilumina (`uPlate`; 20..26) o ninguna (0): la del proyecto señalado o la del ciclo
   * automático (`scene/math/plateCycle`). La escribe el bucle.
   */
  plate: number;
  /**
   * Se lee un interludio (Mission log o Mission control, su pantalla o su cola; no el epílogo):
   * `sceneStore.interlude`, que el bucle copia aquí como `mTarget` y `charge` (los `useFrame` leen el frame, no el
   * store: ADR-027). Lo leen los pins y el ciclo de placas, que se apagan tras el velo de Mission control. Las
   * constelaciones y el Sol no: van detrás de su interludio y entran en su cola.
   */
  transmission: boolean;
  /**
   * El grupo de Skills encendido (`uiStore.activeSkillGroup`), o ninguno: lo copia el bucle, como `plate` y
   * `transmission` (ADR-027).
   */
  skillGroup: SkillGroupId | null;
  /**
   * Las partículas ya se han pintado (el primer frame con formas, `Particles` → `onFirstFrame`): antes, lo que va con
   * una forma (los pins, el Sol) no tiene dónde.
   */
  painted: boolean;
  /**
   * Cuánto se separa el marco del retrato del centro de la ventana, en px (y, hacia abajo): `sceneStore.portraitShift`,
   * que copia el bucle. La cámara mueve la imagen eso en el epílogo (`CameraRig`, ADR-042). El mismo objeto toda la
   * visita.
   */
  readonly portraitShift: { x: number; y: number };
}

export function createSceneFrame(): SceneFrame {
  return {
    m: 0,
    j: null,
    shapes: createShapeMix(),
    charge: 0,
    time: 0,
    delta: 0,
    reducedMotion: false,
    pixelRatio: 1,
    aspect: 1,
    barTop: 0,
    extras: true,
    wide: false,
    pointer: createScenePointer(),
    gravity: createGravity(),
    camera: createCameraPose(),
    fov: 55,
    plate: NO_PLATE,
    transmission: false,
    skillGroup: null,
    painted: false,
    portraitShift: { x: 0, y: 0 },
  };
}

/**
 * Cuánto se mueve lo que oscila solo (`uMotion`): 1, o 0 con movimiento reducido. Lo comparten el shader y lo que la
 * escena coloca siguiendo sus oscilaciones (los pins con el balanceo de la tortuga), para que no se separen.
 */
export function motionOf(frame: Readonly<SceneFrame>): number {
  return frame.reducedMotion ? 0 : 1;
}

/** Los pasos de las formas y de la nave en cada tramo del viaje (C.7 · naves; `lib/scroll/shapeTrack`). */
const JOURNEY_STEPS = journeySteps(JOURNEY_SEGMENTS);

/**
 * ¿Hay naves en este frame? Sin movimiento reducido (sus huecos miden 0) y con los tramos medidos (`frame.j`): las
 * formas salen de la posición en los tramos. Si no, de `m`, sin naves, y el velo de los interludios tapa lo que va con
 * la tortuga (los pins, el ciclo de placas).
 */
export function shipsInPlay(frame: Readonly<SceneFrame>): boolean {
  return !frame.reducedMotion && frame.j !== null;
}

/**
 * Las formas de un frame por el mapa de formas (ADR-041): de la posición en los tramos (`frame.j`), con las naves
 * (`SHAPE_TRACK`). Con movimiento reducido no hay naves (los huecos de sus llegadas y salidas miden 0), y mientras la
 * página no ha medido los tramos no hay posición: entonces, de la `m` de la forma, una por capítulo
 * (`CHAPTER_SHAPES`). Escribe en `out` y lo devuelve.
 */
export function shapeMixOf(frame: Readonly<SceneFrame>, out: ShapeMix): ShapeMix {
  if (frame.reducedMotion || frame.j === null) {
    return shapeMixAt(shapePosition(frame.m), CHAPTER_SHAPES, out);
  }
  return shapeMixAt(journeyValue(frame.j, JOURNEY_STEPS.shape), SHAPE_TRACK, out);
}

/**
 * Lo que pesa una nave en una mezcla (0 → 1): `t` llegando a ella, `1 − t` dejándola, 1 quieta en ella; 0 sin nave.
 */
export function shipWeight(mix: Readonly<ShapeMix>): number {
  if (isShip(mix.from)) return 1 - mix.t;
  return isShip(mix.to) ? mix.t : 0;
}

/**
 * De luz que se suma a puntos opacos (`uSolid`, la prueba v8): sube mientras la nave se forma, en el último tramo del
 * cambio (`SHIP_SOLID.rise` → 1), y baja al empezar a deshacerse (0 → `SHIP_SOLID.fall`); quieta en ella, 1. Sin nave,
 * 0 (el material de siempre).
 */
export function shipSolid(mix: Readonly<ShapeMix>): number {
  if (isShip(mix.from)) return 1 - smoothstep(0, SHIP_SOLID.fall, mix.t);
  return isShip(mix.to) ? smoothstep(SHIP_SOLID.rise, 1, mix.t) : 0;
}

/**
 * Cuánto está la nave en este frame (`shipWeight` de sus formas): la cámara funde con ello su paralaje, para que la
 * pantalla de la nave encaje con lo que se ve (`CameraRig`).
 */
export function shipPresence(frame: Readonly<SceneFrame>): number {
  return shipWeight(frame.shapes);
}

/** Dónde va la nave en este frame y lo que se ve (un solo objeto cada uno: ADR-004). */
const pose = createShipPose();
const shipView = { aspect: 1, fov: 55, barTop: 0 };

/** La nave de este frame en sus uniforms (`math/shipPose`), con su avance en los tramos. */
function updateShipUniforms(uniforms: ParticleUniforms, frame: Readonly<SceneFrame>): void {
  shipView.aspect = frame.aspect;
  shipView.fov = frame.fov;
  shipView.barTop = frame.barTop;
  shipPose(journeyValue(frame.j ?? 0, JOURNEY_STEPS.ship), frame.camera, shipView, pose);
  uniforms.uShipPos.value.set(pose.position.x, pose.position.y, pose.position.z);
  uniforms.uShipAxes.value.fromArray(pose.axes);
  uniforms.uShipScale.value = pose.scale;
  uniforms.uShipTurn.value.set(pose.yaw, pose.pitch);
  uniforms.uScreen.value.set(pose.screen.x, pose.screen.y);
  uniforms.uVert.value = pose.vertical ? 1 : 0;
  uniforms.uFlagSpan.value = pose.flagSpan;
}

/**
 * Las formas salen del mapa de formas (`shapeMixOf`). `portrait`: el retrato ya está en la geometría (`pPor`). `uPor`
 * sube desde lo que valía (los uniforms duran toda la visita, también al cambiar las formas): solo vuelve a 0 sin
 * retrato.
 */
export function updateParticleUniforms(
  uniforms: ParticleUniforms,
  frame: Readonly<SceneFrame>,
  portrait = false,
): void {
  uniforms.uM.value = frame.m;
  const { shapes } = frame;
  uniforms.uFrom.value = shapes.from;
  uniforms.uTo.value = shapes.to;
  uniforms.uT.value = shapes.t;
  uniforms.uSolid.value = shipSolid(shapes);
  // La nave solo se coloca mientras está en la mezcla.
  if (shipWeight(shapes) > 0 || isShip(shapes.to)) updateShipUniforms(uniforms, frame);
  uniforms.uPor.value = !portrait
    ? 0
    : frame.reducedMotion
      ? 1
      : Math.min(1, uniforms.uPor.value + frame.delta / PORTRAIT_FADE_IN_S);
  uniforms.uCharge.value = frame.charge;
  uniforms.uPlate.value = frame.plate;
  uniforms.uTime.value = frame.time;
  uniforms.uPR.value = frame.pixelRatio;
  uniforms.uAspect.value = frame.aspect;
  uniforms.uMotion.value = motionOf(frame);
  uniforms.uExtras.value = frame.extras ? 1 : 0;
  uniforms.uGrav.value =
    frame.gravity.strength * lerp(1, EARTH_GRAVITY.scale, shapePresence(frame.shapes, SHAPE.earth));
  uniforms.uMouse.value.set(frame.gravity.x, frame.gravity.y);
}

export function updateStarUniforms(uniforms: StarUniforms, frame: Readonly<SceneFrame>): void {
  uniforms.uTime.value = frame.time;
  uniforms.uPR.value = frame.pixelRatio;
  uniforms.uVisible.value = smoothstep(STARS_VISIBLE_FROM, STARS_VISIBLE_AT, frame.m);
}

/**
 * El Sol (docs/04-escena/particulas-y-shaders.md → «Sol»): aparece con la presencia de su capítulo, hasta
 * `SUN.opacity`, y late con el reloj de la escena; con movimiento reducido, quieto en su tamaño. Nada antes de que
 * las partículas se pinten (`frame.painted`: entrando por `/#contact`, mientras llegan las formas, brillaría sobre el
 * vacío), como los pins. En la llegada del epílogo se va con la Tierra (la `m` de la forma, ADR-039).
 */
export function updateSunUniforms(uniforms: SunUniforms, frame: Readonly<SceneFrame>): void {
  uniforms.uOpacity.value = frame.painted
    ? shapePresence(frame.shapes, SHAPE.earth) * SUN.opacity
    : 0;
  uniforms.uSize.value = frame.reducedMotion
    ? SUN.size
    : SUN.size + Math.sin(frame.time * SUN.pulseRate) * SUN.pulse;
}

/**
 * Luz que se suma, sin profundidad ni orden: el brillo «de galaxia» sale de sumar partículas. Sin conversión de
 * color ni mapeo de tonos (los shaders no incluyen los trozos de Three que los aplican).
 */
const ADDITIVE = {
  transparent: true,
  depthWrite: false,
  depthTest: false,
  blending: AdditiveBlending,
} as const;

/**
 * Las partículas: luz que se suma, como el resto, salvo mientras se ve una nave (`uSolid` > 0). Entonces la mezcla es
 * `ONE, ONE_MINUS_SRC_ALPHA` (el shader de fragmentos premultiplica: con alfa 0 suma, con alfa 1 tapa), y desde la
 * mitad, con profundidad: lo de delante tapa lo de detrás (`updateParticleMaterial`).
 */
export function createParticleMaterial(uniforms: ParticleUniforms): ShaderMaterial {
  return new ShaderMaterial({
    ...ADDITIVE,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneMinusSrcAlphaFactor,
    uniforms: { ...uniforms },
    vertexShader: glslHeader() + particlesVertex,
    fragmentShader: particlesFragment,
  });
}

/**
 * El estado del material de las partículas para su `uSolid` (la prueba v8): con 0, el de siempre (aditivo, sin
 * profundidad); entre 0 y 1, la mezcla de luz y opacos; desde la mitad, con profundidad; ya sólida del todo, opaca y
 * sin mezcla (lo más barato para la GPU del móvil). Son estados del pintado: cambiarlos no recompila el shader (sin
 * `needsUpdate`).
 */
export function updateParticleMaterial(material: ShaderMaterial, uniforms: ParticleUniforms): void {
  const solid = uniforms.uSolid.value;
  const opaque = solid >= 1;
  material.blending = solid > 0 ? (opaque ? NormalBlending : CustomBlending) : AdditiveBlending;
  material.transparent = !opaque;
  material.depthTest = solid > 0.5;
  material.depthWrite = solid > 0.5;
}

export function createStarsMaterial(uniforms: StarUniforms): ShaderMaterial {
  return new ShaderMaterial({
    ...ADDITIVE,
    uniforms: { ...uniforms },
    vertexShader: glslHeader() + starsVertex,
    fragmentShader: starsFragment,
  });
}

/** El material de las estrellas de una constelación: puntos con halo, del tamaño de `uSize`. */
export function createConstellationStarsMaterial(uniforms: ConstellationUniforms): ShaderMaterial {
  return new ShaderMaterial({
    ...ADDITIVE,
    uniforms: { ...uniforms },
    vertexShader: glslHeader() + constellationsVertex,
    fragmentShader: constellationStarsFragment,
  });
}

/** El material de las líneas de una constelación. */
export function createConstellationLinesMaterial(uniforms: ConstellationUniforms): ShaderMaterial {
  return new ShaderMaterial({
    ...ADDITIVE,
    uniforms: { ...uniforms },
    vertexShader: glslHeader() + constellationsVertex,
    fragmentShader: constellationLinesFragment,
  });
}

/** El material del Sol: un brillo que mira a la cámara, del lado de `uSize`. */
export function createSunMaterial(uniforms: SunUniforms): ShaderMaterial {
  return new ShaderMaterial({
    ...ADDITIVE,
    uniforms: { ...uniforms },
    vertexShader: glslHeader() + sunVertex,
    fragmentShader: sunFragment,
  });
}
