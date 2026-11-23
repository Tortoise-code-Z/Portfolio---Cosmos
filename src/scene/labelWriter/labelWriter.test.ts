import { describe, expect, it } from 'vitest';

import { createLabelBox } from '../math/labelFit/labelFit';
import { createWrittenLabel, writeLabel, type WritableLabel } from './labelWriter';

function slot(visible = true): WritableLabel {
  const box = createLabelBox();
  box.left = 10.4;
  box.top = 20.6;
  box.visible = visible;
  return { box, written: createWrittenLabel() };
}

describe('writeLabel', () => {
  it('writes a visible label whole the first time: where, how bright, lit and live', () => {
    const element = document.createElement('span');
    writeLabel(element, slot(), 0.804, true, true);
    expect(element.style.visibility).toBe('visible');
    expect(element.style.transform).toBe('translate(10px, 21px)');
    expect(element.style.opacity).toBe('0.8');
    expect(element).toHaveAttribute('data-hot', '');
    expect(element).toHaveAttribute('data-live', '');
  });

  it('writes only what changed', () => {
    const element = document.createElement('span');
    const label = slot();
    writeLabel(element, label, 0.5, false, false);
    element.style.transform = 'none';
    element.style.opacity = '0';
    writeLabel(element, label, 0.5, false, false);
    expect(element.style.transform).toBe('none');
    expect(element.style.opacity).toBe('0');
    label.box.left = 30;
    writeLabel(element, label, 0.5, false, false);
    expect(element.style.transform).toBe('translate(30px, 21px)');
  });

  it('a label that never showed stays as its CSS left it (hidden), dead: its position and opacity wait', () => {
    const element = document.createElement('span');
    writeLabel(element, slot(false), 1, true, true);
    expect(element.style.visibility).toBe('');
    expect(element).not.toHaveAttribute('data-live');
    expect(element.style.transform).toBe('');
    expect(element).not.toHaveAttribute('data-hot');
    const label = slot();
    writeLabel(element, label, 1, false, false);
    label.box.visible = false;
    writeLabel(element, label, 1, false, true);
    expect(element.style.visibility).toBe('hidden');
    expect(element).not.toHaveAttribute('data-live');
  });

  it('without an element nothing is written and the old one is let go; a new element is written whole', () => {
    const label = slot();
    const first = document.createElement('span');
    writeLabel(first, label, 1, false, false);
    writeLabel(undefined, label, 1, false, false);
    expect(label.written.element).toBeNull();
    const again = document.createElement('span');
    writeLabel(again, label, 1, false, false);
    expect(again.style.visibility).toBe('visible');
    expect(again.style.transform).toBe('translate(10px, 21px)');
    expect(again.style.opacity).toBe('1');
  });
});
