import { PLATE_PIN, type PlateSlot } from '../../config/plateSlots/plateSlots';
import { HEX_SIZE, SHELL, TURTLE_SWAY, type ScenePoint } from '../../config/sceneConfig';
import { hexCenterX, hexCenterZ } from '../../shapes/hexGrid/hexGrid';
import {
  createLabelBox,
  overlapsRect,
  type KeepOutZone,
  type LabelBox,
} from '../labelFit/labelFit';
import type { ScreenPoint } from '../projection/projection';

/**
 * Los pins de las placas (docs/04-escena/constelaciones-y-placas.md → «Pins»): dónde se clavan en el caparazón, cómo
 * se mecen con la tortuga (la misma cuenta que el shader de las partículas), qué ocupan en pantalla y cuáles caben. Puras:
 * `scene/PlatePins` las aplica en cada frame.
 */

/** El centro de la placa sobre el caparazón (el elipsoide de `SHELL`), un poco por encima: `liftY`. */
export function plateAnchor({ q, r }: Pick<PlateSlot, 'q' | 'r'>): ScenePoint {
  const x = hexCenterX(q, r, HEX_SIZE);
  const z = hexCenterZ(r, HEX_SIZE);
  const y = SHELL.AY * Math.sqrt(Math.max(0, 1 - (x / SHELL.AX) ** 2 - (z / SHELL.AZ) ** 2));
  return [x, y + PLATE_PIN.liftY, z];
}

/**
 * El punto de la tortuga `base`, mecido como en el shader en el instante `time` (`uTime`): gira sobre Y y después
 * sube o baja; sin movimiento (`motion` 0, movimiento reducido), quieto. Escribe en `out`.
 */
export function swayTurtlePoint(
  base: ScenePoint,
  time: number,
  motion: number,
  out: [number, number, number],
): [number, number, number] {
  const yaw = Math.sin(time * TURTLE_SWAY.yawRate) * TURTLE_SWAY.yaw * motion;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const [x, y, z] = base;
  out[0] = c * x + s * z;
  out[1] = y + Math.sin(time * TURTLE_SWAY.bobRate) * TURTLE_SWAY.bob * motion;
  out[2] = -s * x + c * z;
  return out;
}

/** Lo que ocupa a lo ancho la etiqueta de un pin con el nombre `name`, en píxeles CSS, con su tamaño de letra. */
export function pinTagWidth(name: string, fontPx: number): number {
  const { advanceEm, trackingEm, padInlinePx, borderPx } = PLATE_PIN;
  return (
    name.normalize('NFC').length * fontPx * (advanceEm + trackingEm) + 2 * (padInlinePx + borderPx)
  );
}

/** Un rectángulo que se reutiliza: izquierda, arriba, derecha y abajo, en píxeles CSS del lienzo. */
export interface PinRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Un pin en un frame: su pie en pantalla, el ancho de su etiqueta, su piso y lo que ocupan la etiqueta y el tallo. */
export interface PinBox {
  x: number;
  y: number;
  width: number;
  floor: number;
  /** La etiqueta: su esquina de arriba a la izquierda es la del pin en el DOM; `wanted` y `visible`, los del pin. */
  readonly tag: LabelBox;
  readonly stem: PinRect;
}

export function createPinBox(): PinBox {
  return {
    x: 0,
    y: 0,
    width: 0,
    floor: 0,
    tag: createLabelBox(),
    stem: { left: 0, top: 0, right: 0, bottom: 0 },
  };
}

/** El pie del pin en `point` (la placa en pantalla), con una etiqueta de `width` px, en el piso de abajo. */
export function placePinBox(point: Readonly<ScreenPoint>, width: number, pin: PinBox): void {
  pin.x = point.x;
  pin.y = point.y;
  pin.width = width;
  raisePin(pin, 0);
}

/**
 * El pin en el piso `floor`: el tallo (46 px en el de abajo) crece una etiqueta y su hueco por piso; encima, la
 * etiqueta, que empieza `tagLeftPx` a la izquierda del tallo.
 */
function raisePin(pin: PinBox, floor: number): void {
  const { stemPx, gapPx, tagHeightPx, tagLeftPx, borderPx } = PLATE_PIN;
  const { tag, stem } = pin;
  pin.floor = floor;
  stem.left = pin.x;
  stem.right = pin.x + borderPx;
  stem.bottom = pin.y;
  stem.top = pin.y - stemPx - floor * (tagHeightPx + gapPx);
  tag.left = pin.x - tagLeftPx;
  tag.right = tag.left + pin.width;
  tag.bottom = stem.top - gapPx;
  tag.top = tag.bottom - tagHeightPx;
}

function meet(a: Readonly<PinRect>, b: Readonly<PinRect>): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/** ¿Cabe `pin` en su piso? Ni lo que tapa la interfaz ni los pins visibles que van antes en `order`. */
function clearOf(
  pin: Readonly<PinBox>,
  order: readonly PinBox[],
  zones: readonly KeepOutZone[],
): boolean {
  for (const zone of zones) {
    if (overlapsRect(pin.tag, zone.rect) || overlapsRect(pin.stem, zone.rect)) return false;
  }
  for (const other of order) {
    if (other === pin) return true;
    if (!other.tag.visible) continue;
    if (meet(pin.tag, other.tag) || meet(pin.tag, other.stem) || meet(pin.stem, other.tag))
      return false;
  }
  return true;
}

/** De derecha a izquierda en pantalla (el orden estable de `sort` deja como estaban los que comparten `x`). */
function rightToLeft(a: Readonly<PinBox>, b: Readonly<PinBox>): number {
  return b.x - a.x;
}

/**
 * Decide qué pins se ven y en qué piso (como `fitLabels` con las etiquetas de las estrellas): de derecha a izquierda
 * en pantalla, el que pisa lo que tapa la interfaz, el borde o un pin ya visible sube un piso, y otro, hasta `floors`;
 * si aun así choca, se oculta. De derecha a izquierda porque la etiqueta sale hacia la derecha de su tallo: el pin de
 * la izquierda sube por encima de la etiqueta del de la derecha sin que su tallo la cruce. `order` es un array que se
 * reutiliza (los mismos pins, en ese orden). Corre en cada frame y no crea nada (ADR-004).
 */
export function fitPins(
  pins: readonly PinBox[],
  zones: readonly KeepOutZone[],
  order: PinBox[],
): void {
  order.length = 0;
  for (const pin of pins) order.push(pin);
  order.sort(rightToLeft);
  for (const pin of order) {
    pin.tag.visible = false;
    if (!pin.tag.wanted) continue;
    for (let floor = 0; floor < PLATE_PIN.floors; floor += 1) {
      raisePin(pin, floor);
      if (clearOf(pin, order, zones)) {
        pin.tag.visible = true;
        break;
      }
    }
  }
}
