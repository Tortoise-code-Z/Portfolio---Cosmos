import { describe, expect, it } from 'vitest';

import { PLATE_SLOTS } from '../../config/plateSlots/plateSlots';
import { SHELL } from '../../config/sceneConfig';
import type { KeepOutZone } from '../labelFit/labelFit';
import { createScreenPoint } from '../projection/projection';
import {
  createPinBox,
  fitPins,
  pinTagWidth,
  placePinBox,
  plateAnchor,
  swayTurtlePoint,
  type PinBox,
} from './platePins';

/** El balanceo del shader de F3 escrito a mano, con sus cifras (las de la especificación, no las de la config). */
function swayLikeTheShader(
  [x, y, z]: readonly [number, number, number],
  t: number,
  motion: number,
): number[] {
  const a = Math.sin(t * 0.25) * 0.18 * motion;
  return [
    Math.cos(a) * x + Math.sin(a) * z,
    y + Math.sin(t * 0.7) * 0.15 * motion,
    -Math.sin(a) * x + Math.cos(a) * z,
  ];
}

describe('plateAnchor', () => {
  it('the centre plate: on top of the shell, 0.06 above', () => {
    const [x, y, z] = plateAnchor({ q: 0, r: 0 });
    expect(x).toBe(0);
    expect(z).toBe(0);
    expect(y).toBeCloseTo(SHELL.AY + 0.06, 10);
  });

  it('every plate sits on the ellipsoid of the shell, at the centre of its hex cell', () => {
    for (const slot of PLATE_SLOTS) {
      const [x, y, z] = plateAnchor(slot);
      expect(x).toBeCloseTo(0.95 * Math.sqrt(3) * (slot.q + slot.r / 2), 10);
      expect(z).toBeCloseTo(0.95 * 1.5 * slot.r, 10);
      const h = y - 0.06;
      expect((x / SHELL.AX) ** 2 + (h / SHELL.AY) ** 2 + (z / SHELL.AZ) ** 2).toBeCloseTo(1, 10);
    }
  });

  it('a cell beyond the shell stays at its rim (never a NaN height)', () => {
    expect(plateAnchor({ q: 4, r: 0 })[1]).toBeCloseTo(0.06, 10);
  });
});

describe('swayTurtlePoint', () => {
  it('sways exactly like the particles shader (turn on Y, then up and down), at any time', () => {
    const base = plateAnchor({ q: 1, r: -1 });
    const out: [number, number, number] = [0, 0, 0];
    for (const t of [0, 1.3, 7, 42.5, 1000]) {
      const expected = swayLikeTheShader(base, t, 1);
      const got = swayTurtlePoint(base, t, 1, out);
      expect(got).toBe(out);
      got.forEach((value, i) => {
        expect(value).toBeCloseTo(expected[i] ?? Number.NaN, 12);
      });
    }
  });

  it('without motion (reduced), it stays where it is', () => {
    const base = plateAnchor({ q: -1, r: 1 });
    expect(swayTurtlePoint(base, 12.3, 0, [0, 0, 0])).toEqual([...base]);
  });
});

describe('the pin box', () => {
  it('the tag is as wide as its letters (0.6 em plus 0.1 em of tracking), its padding and its border', () => {
    expect(pinTagWidth('Cosmos', 11)).toBeCloseTo(6 * 11 * 0.7 + 18, 10);
    expect(pinTagWidth('Cosmos', 10)).toBeCloseTo(6 * 10 * 0.7 + 18, 10);
    // En NFC, una «é» es una letra.
    expect(pinTagWidth('Café', 11)).toBe(pinTagWidth('Café', 11));
  });

  it('stands on the plate: its foot on the point, the tag 50 px above, starting 2 px left of the stem', () => {
    const point = createScreenPoint();
    point.x = 400;
    point.y = 300;
    const pin = createPinBox();
    placePinBox(point, 80, pin);
    expect(pin.floor).toBe(0);
    expect(pin.tag).toMatchObject({
      left: 398,
      right: 478,
      bottom: 300 - 46 - 4,
      top: 300 - 46 - 4 - 26,
    });
    expect(pin.stem).toEqual({ left: 400, right: 401, top: 300 - 46, bottom: 300 });
  });
});

describe('fitPins', () => {
  /** Un pin con el pie en `(x, y)` y una etiqueta de `width`, que quiere verse. */
  function pinAt(x: number, y: number, width = 80): PinBox {
    const point = createScreenPoint();
    point.x = x;
    point.y = y;
    const pin = createPinBox();
    placePinBox(point, width, pin);
    pin.tag.wanted = true;
    return pin;
  }

  const floorsOf = (pins: readonly PinBox[]): (number | false)[] =>
    pins.map(({ floor, tag }) => (tag.visible ? floor : false));

  it('pins apart all show on the ground floor; the order array is reused', () => {
    const pins = [pinAt(100, 300), pinAt(300, 300)];
    const order: PinBox[] = [];
    fitPins(pins, [], order);
    expect(floorsOf(pins)).toEqual([0, 0]);
    expect(order).toEqual([pins[1], pins[0]]);
    fitPins(pins, [], order);
    expect(order).toHaveLength(2);
  });

  it('when two tags meet, the left pin goes up a floor (its stem grows a tag and its gap), whatever their order', () => {
    for (const pins of [
      [pinAt(240, 305), pinAt(200, 300)],
      [pinAt(200, 300), pinAt(240, 305)],
    ]) {
      fitPins(pins, [], []);
      const left = pins.find(({ x }) => x === 200);
      expect(left?.floor).toBe(1);
      expect(left?.tag.visible).toBe(true);
      expect(left?.stem.top).toBe(300 - 46 - 30);
      expect(left?.tag.bottom).toBe(300 - 46 - 30 - 4);
      expect(pins.find(({ x }) => x === 240)?.floor).toBe(0);
    }
  });

  it('three that meet stand as a staircase, the rightmost on the ground', () => {
    const pins = [pinAt(230, 300), pinAt(200, 300), pinAt(260, 300)];
    fitPins(pins, [], []);
    expect(floorsOf(pins)).toEqual([1, 2, 0]);
  });

  it('a stem may not cross another tag: two feet almost in line cannot share the space', () => {
    // El de la izquierda está 1 px a la izquierda: su tallo cruzaría la etiqueta del otro en cualquier piso.
    const pins = [pinAt(201, 300), pinAt(200, 300)];
    fitPins(pins, [], []);
    expect(floorsOf(pins)).toEqual([0, false]);
  });

  it('one that fits on no floor hides, and does not stop the next', () => {
    const pins = [
      pinAt(260, 300),
      pinAt(230, 300),
      pinAt(200, 300),
      pinAt(170, 300),
      pinAt(600, 300),
    ];
    fitPins(pins, [], []);
    expect(floorsOf(pins)).toEqual([0, 1, 2, false, 0]);
  });

  it('a pin over what the interface covers climbs to clear it, or hides; unwanted ones hide', () => {
    const panel: KeepOutZone = { name: 'panel', rect: [0, 200, 1000, 230] };
    const climbs = [pinAt(200, 340)];
    fitPins(climbs, [panel], []);
    // En el piso de abajo la etiqueta (264–290) y el tallo (294–340) no tocan la zona: se queda.
    expect(floorsOf(climbs)).toEqual([0]);
    // Una zona que la etiqueta pisa y el tallo no: sube un piso. Una que pisaría el tallo en cualquier piso: se oculta.
    const corner: KeepOutZone = { name: 'HUD', rect: [220, 225, 300, 250] };
    const over = [pinAt(200, 290)];
    fitPins(over, [corner], []);
    expect(floorsOf(over)).toEqual([1]);
    const under = [pinAt(200, 290)];
    fitPins(under, [panel], []);
    expect(floorsOf(under)).toEqual([false]);
    const bar: KeepOutZone = { name: 'top bar', rect: [-Infinity, -Infinity, Infinity, 120] };
    const low = [pinAt(200, 180)];
    fitPins(low, [bar], []);
    expect(floorsOf(low)).toEqual([false]);
    const unwanted = pinAt(500, 500);
    unwanted.tag.wanted = false;
    unwanted.tag.visible = true;
    fitPins([unwanted], [], []);
    expect(unwanted.tag.visible).toBe(false);
  });
});
