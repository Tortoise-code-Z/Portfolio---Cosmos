import { LinearSRGBColorSpace } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { readVoidColour, VOID_TOKEN } from './voidColour';

const root = document.documentElement;

afterEach(() => {
  vi.restoreAllMocks();
  root.style.removeProperty(VOID_TOKEN);
});

describe('readVoidColour', () => {
  it('keeps the numbers of the hex as they are, as the linear canvas clears with them', () => {
    root.style.setProperty(VOID_TOKEN, '#04050b');
    const colour = readVoidColour(root);
    // Lo que Three escribe al limpiar con la salida lineal (`WebGLBackground` → `getRGB(…, outputColorSpace)`).
    const cleared = colour?.getRGB({ r: 0, g: 0, b: 0 }, LinearSRGBColorSpace);
    expect(cleared?.r).toBeCloseTo(4 / 255, 6);
    expect(cleared?.g).toBeCloseTo(5 / 255, 6);
    expect(cleared?.b).toBeCloseTo(11 / 255, 6);
  });

  it.each([
    ['missing', ''],
    ['in another format', 'oklch(0.1 0.02 270)'],
  ])('a token %s is logged and gives no colour (the canvas keeps its default)', (_case, value) => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    if (value !== '') root.style.setProperty(VOID_TOKEN, value);
    expect(readVoidColour(root)).toBeNull();
    expect(consoleError).toHaveBeenCalledExactlyOnceWith(
      '[scene] --color-void is not a #rrggbb colour; the canvas keeps its default',
      value,
    );
  });
});
