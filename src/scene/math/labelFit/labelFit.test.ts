import { describe, expect, it } from 'vitest';

import { STAR_LABEL_KEEP_OUT } from '../../config/constellationLayout/constellationLayout';
import {
  createLabelBox,
  fitLabels,
  keepOutZones,
  type KeepOutZone,
  type LabelBox,
} from './labelFit';

function box(left: number, top: number, width = 100, wanted = true): LabelBox {
  return { ...createLabelBox(), left, top, right: left + width, bottom: top + 22, wanted };
}

/** El nombre de la zona donde cae el punto, o nada. */
const inside = (zones: readonly KeepOutZone[], x: number, y: number): string | undefined =>
  zones.find(({ rect: [l, t, r, b] }) => x > l && x < r && y > t && y < b)?.name;

describe('keepOutZones', () => {
  it('on desktop: the panel, the bar, the rail (centred), the HUD and the edges, with a margin', () => {
    const zones = keepOutZones(1265, 720, true);
    const m = STAR_LABEL_KEEP_OUT.marginPx;
    expect(inside(zones, 564 + m - 1, 400)).toBe('panel');
    expect(inside(zones, 564 + m + 1, 400)).toBeUndefined();
    expect(inside(zones, 800, 64 + m - 1)).toBe('top bar');
    expect(inside(zones, 1265 - 154 - m + 1, 360)).toBe('rail'); // a media altura
    expect(inside(zones, 1265 - 154 - m + 1, 150)).toBeUndefined(); // por encima del raíl
    expect(inside(zones, 1265 - 247 - m + 1, 720 - 62 - m + 1)).toBe('HUD');
    expect(inside(zones, 1265 - m + 1, 150)).toBe('right edge');
    expect(inside(zones, 800, 720 - m + 1)).toBe('bottom edge');
  });

  it('below 900 px: no panel beside the scene, the HUD at the bottom left', () => {
    const zones = keepOutZones(600, 900, false);
    expect(inside(zones, 300, 400)).toBeUndefined();
    expect(inside(zones, 100, 900 - 62)).toBe('HUD');
    expect(inside(zones, 400, 900 - 62)).toBeUndefined();
    expect(inside(zones, 600 - 52, 450)).toBe('rail');
  });
});

describe('fitLabels', () => {
  const nothing: KeepOutZone[] = [];

  it('shows the labels that fit and are wanted', () => {
    const boxes = [box(10, 10), box(10, 40), box(10, 70, 100, false)];
    fitLabels(boxes, nothing);
    expect(boxes.map(({ visible }) => visible)).toEqual([true, true, false]);
  });

  it('hides a label over a covered zone', () => {
    const boxes = [box(10, 10), box(300, 10)];
    fitLabels(boxes, [{ name: 'zone', rect: [250, 0, 500, 100] }]);
    expect(boxes.map(({ visible }) => visible)).toEqual([true, false]);
  });

  it('between two that overlap, the later one goes (the panel order wins), and a hidden one does not block', () => {
    const boxes = [box(10, 10, 100, false), box(50, 15), box(60, 20), box(500, 20)];
    fitLabels(boxes, nothing);
    expect(boxes.map(({ visible }) => visible)).toEqual([false, true, false, true]);
  });

  it('decides again every time (a label that fits again comes back)', () => {
    const boxes = [box(10, 10), box(50, 15)];
    fitLabels(boxes, nothing);
    expect(boxes[1]?.visible).toBe(false);
    const second = boxes[1];
    if (second !== undefined) Object.assign(second, { top: 200, bottom: 222 });
    fitLabels(boxes, nothing);
    expect(boxes[1]?.visible).toBe(true);
  });
});
