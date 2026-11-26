import { lerp } from '~/lib/math/lerp/lerp';
import { smoothstep } from '~/lib/math/smoothstep/smoothstep';
import { SHIP_ARRIVAL } from '~/lib/scroll/shapeTrack/shapeTrack';

import { SHIP_FRAME } from '../../config/sceneConfig';
import type { CameraPose, MutablePoint } from '../camera/camera';

/**
 * Dónde va la nave que trae una transmisión (C.7 · naves; docs/04-escena/formas.md → «Naves»), sin Three: de su avance
 * (`q`, de 0 a 2: `journeySteps(...).ship`), la pose de la cámara y lo que se ve, su sitio en la escena, su tamaño, su
 * giro y la proporción de su pantalla. La nave se dibuja en el shader en sus propias unidades (la pantalla en el plano
 * `z = 0`, mirando a +z) y esto la coloca: `P = position + axes · (giro(p) · scale)`. Escribe en un objeto que se crea
 * una vez (cero objetos nuevos por frame, ADR-004).
 *
 * - Llegada (`q` de 0 a 1, en fracción de su hueco): hasta `SHIP_ARRIVAL.formed` la forma de antes se convierte en la
 *   nave, pequeña y girada, en el centro de esa forma (el origen); hasta `SHIP_ARRIVAL.near` viaja al centro de lo que
 *   se ve bajo la barra y se pone de frente, con su pantalla al 86–90 % (`SHIP_FRAME`); hasta el final, se acerca hasta
 *   que la pantalla llena la vista.
 * - Pantalla (`q` = 1): la vista llena (la nave, fuera de la vista: se lee la transmisión).
 * - Salida (`q` de 1 a 2): se aleja de frente, hasta `SHIP_FRAME.far` veces la distancia a la que encaja; en la cola,
 *   ya lejos, se deshace en la forma siguiente.
 *
 * La cámara no se mueve mientras está la nave (`m` quieta; el paralaje se funde a 0), así que la pantalla encaja con
 * lo que se ve.
 */

/** Lo que se ve: el aspecto del lienzo, su campo de visión vertical (grados) y la fracción de alto que tapa la barra. */
export interface ShipView {
  readonly aspect: number;
  readonly fov: number;
  readonly barTop: number;
}

export interface ShipPose {
  /** El centro de la pantalla de la nave, en la escena. */
  readonly position: MutablePoint;
  /**
   * Los ejes de la nave en la escena, por columnas (`mat3` de GLSL): a la derecha, arriba y hacia la cámara (los de la
   * cámara: la nave mira de frente a lo que se ve).
   */
  readonly axes: number[];
  /** Su tamaño (1: la pantalla mide `SHIP_FRAME.screenHeight` unidades de la escena de alto). */
  scale: number;
  /** Lo que está girada, en radianes: en Y (`yaw`) y en X (`pitch`). */
  yaw: number;
  pitch: number;
  /** Su pantalla, en sus unidades: ancho y alto (en horizontal) o al revés (en vertical: `vertical`). */
  readonly screen: { x: number; y: number };
  /** En vertical (más alto que ancho): los paneles del satélite van arriba y abajo. */
  vertical: boolean;
  /** Hasta dónde cruza la bandera de Irlanda a cada lado, en unidades de la nave (fuera de la vista). */
  flagSpan: number;
}

export function createShipPose(): ShipPose {
  return {
    position: { x: 0, y: 0, z: 0 },
    axes: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    scale: SHIP_FRAME.birthScale,
    yaw: SHIP_FRAME.turn.yaw,
    pitch: SHIP_FRAME.turn.pitch,
    screen: { x: SHIP_FRAME.screenHeight, y: SHIP_FRAME.screenHeight },
    vertical: false,
    flagSpan: 0,
  };
}

const DEG_TO_RAD = Math.PI / 180;

/** La pantalla con la nave de frente, en fracción del alto de la ventana (`shipScreen`). */
export interface ShipScreen {
  width: number;
  height: number;
  vertical: boolean;
}

export function createShipScreen(): ShipScreen {
  return { width: 0, height: 0, vertical: false };
}

/**
 * La pantalla con la nave de frente, en fracción del alto de la ventana: su ancho y su alto, con la proporción de
 * `SHIP_FRAME` sobre lo que se ve bajo la barra (`barTop`: la fracción del alto que tapa). Escribe en `out`.
 */
export function shipScreen(aspect: number, barTop: number, out: ShipScreen): ShipScreen {
  const seen = 1 - barTop;
  out.vertical = aspect < 1;
  if (out.vertical) {
    out.width = SHIP_FRAME.portrait.width * aspect;
    out.height = SHIP_FRAME.portrait.height * seen;
  } else {
    out.width = SHIP_FRAME.landscape.width * aspect;
    out.height = Math.min(
      SHIP_FRAME.landscape.height * seen,
      out.width * SHIP_FRAME.landscape.maxRatio,
    );
  }
  return out;
}

/** La pantalla de este frame (un solo objeto: `shipPose` corre en cada frame). */
const frameScreen = createShipScreen();

/** La pose de la nave con avance `q` (de 0 a 2), vista con `camera` en `view`. Escribe en `out` y lo devuelve. */
export function shipPose(q: number, camera: CameraPose, view: ShipView, out: ShipPose): ShipPose {
  const { position: eye, target } = camera;
  // Los ejes de la cámara: hacia delante (f), a la derecha (r = f × arriba) y arriba (u = r × f), como
  // `math/projection`.
  let fx = target.x - eye.x;
  let fy = target.y - eye.y;
  let fz = target.z - eye.z;
  const fl = Math.hypot(fx, fy, fz);
  fx /= fl;
  fy /= fl;
  fz /= fl;
  let rx = -fz;
  let rz = fx;
  const rl = Math.hypot(rx, rz);
  rx /= rl;
  rz /= rl;
  const ux = -rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy;
  const { axes } = out;
  axes[0] = rx;
  axes[1] = 0;
  axes[2] = rz;
  axes[3] = ux;
  axes[4] = uy;
  axes[5] = uz;
  axes[6] = -fx;
  axes[7] = -fy;
  axes[8] = -fz;

  const screen = shipScreen(view.aspect, view.barTop, frameScreen);
  out.vertical = screen.vertical;
  out.screen.x = (SHIP_FRAME.screenHeight * screen.width) / screen.height;
  out.screen.y = SHIP_FRAME.screenHeight;

  // A qué distancia la pantalla mide su alto (`screen.height` de la ventana), a cuál llena la vista entera (también lo
  // que tapa la barra, por encima de su centro) y a cuál se va.
  const tan = Math.tan((view.fov / 2) * DEG_TO_RAD);
  const near = SHIP_FRAME.screenHeight / (2 * tan * screen.height);
  const cover =
    Math.max(view.aspect / screen.width, (1 + view.barTop) / screen.height) * SHIP_FRAME.cover;
  // La nebulosa (y cada forma) está centrada en el origen: su profundidad delante de la cámara.
  const born = -(eye.x * fx + eye.y * fy + eye.z * fz);

  const come = smoothstep(SHIP_ARRIVAL.formed, SHIP_ARRIVAL.near, q);
  const fill = smoothstep(SHIP_ARRIVAL.near, 1, q);
  const leave = smoothstep(1, 2, q);
  const depth = lerp(
    lerp(lerp(born, near, come), near / cover, fill),
    near * SHIP_FRAME.far,
    leave,
  );
  // El centro de lo que se ve bajo la barra, a esa profundidad (en NDC, a `−barTop` del centro de la ventana).
  const lift = -view.barTop * tan * depth;
  out.position.x = lerp(0, eye.x + fx * depth + ux * lift, come);
  out.position.y = lerp(0, eye.y + fy * depth + uy * lift, come);
  out.position.z = lerp(0, eye.z + fz * depth + uz * lift, come);
  out.scale = lerp(SHIP_FRAME.birthScale, 1, come);
  const turn = (1 - come) * (1 - come);
  out.yaw = turn * SHIP_FRAME.turn.yaw;
  out.pitch = turn * SHIP_FRAME.turn.pitch;

  // La bandera que cruza: la mitad de lo que se ve a su profundidad (en unidades de la nave), más su ancho.
  const half = (out.vertical ? out.screen.x : out.screen.y) / 2;
  const { behind, gap, margin } = SHIP_FRAME.flag;
  const flagDepth = depth + (behind * half + gap) * out.scale;
  out.flagSpan = (tan * flagDepth * view.aspect) / out.scale + margin * half;
  return out;
}
