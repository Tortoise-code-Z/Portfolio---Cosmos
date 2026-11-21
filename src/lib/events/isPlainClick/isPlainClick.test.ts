import { describe, expect, it } from 'vitest';

import { isPlainClick } from './isPlainClick';

const click = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };

describe('isPlainClick', () => {
  it('is the main button with no modifier', () => {
    expect(isPlainClick(click)).toBe(true);
  });

  it('is not another button, nor a click that asks for another tab or window', () => {
    expect(isPlainClick({ ...click, button: 1 })).toBe(false);
    for (const key of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'] as const) {
      expect(isPlainClick({ ...click, [key]: true }), key).toBe(false);
    }
  });
});
