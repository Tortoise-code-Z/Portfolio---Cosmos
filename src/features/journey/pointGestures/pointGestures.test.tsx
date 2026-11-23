import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { pointGestures } from './pointGestures';

/** jsdom no sabe de dónde viene el foco: el test dice si `:focus-visible` casa. */
function focusFromKeyboard(fromKeyboard: boolean): void {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- el original, para llamarlo con su `this` (`call`)
  const matches = Element.prototype.matches;
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector) {
    // Como en un navegador: solo casa el que tiene el foco (un `<li>` que nunca lo recibe, no).
    return selector === ':focus-visible'
      ? fromKeyboard && this === document.activeElement
      : matches.call(this, selector);
  });
}

function setup(): { point: ReturnType<typeof vi.fn>; release: ReturnType<typeof vi.fn> } {
  const point = vi.fn();
  const release = vi.fn();
  render(
    <>
      <ul>
        <li data-testid="item" {...pointGestures(point, release)}>
          <a href="#a">A</a>
          <a href="#b">B</a>
        </li>
      </ul>
      <a href="#out">Out</a>
    </>,
  );
  return { point, release };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('pointGestures', () => {
  it('the mouse points on entering and releases on leaving; touch and pen do neither', () => {
    const { point, release } = setup();
    const item = screen.getByTestId('item');
    fireEvent.pointerEnter(item, { pointerType: 'touch' });
    fireEvent.pointerLeave(item, { pointerType: 'pen' });
    expect(point).not.toHaveBeenCalled();
    expect(release).not.toHaveBeenCalled();
    fireEvent.pointerEnter(item, { pointerType: 'mouse' });
    fireEvent.pointerLeave(item, { pointerType: 'mouse' });
    expect(point).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledOnce();
  });

  it('a click (a tap) points', () => {
    const { point } = setup();
    fireEvent.click(screen.getByTestId('item'));
    expect(point).toHaveBeenCalledOnce();
  });

  it('only the keyboard focus points; moving inside does not release, leaving does, another window does not', () => {
    const hasFocus = vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    focusFromKeyboard(true);
    const { point, release } = setup();
    act(() => {
      screen.getByRole('link', { name: 'A' }).focus();
    });
    expect(point).toHaveBeenCalledOnce();
    act(() => {
      screen.getByRole('link', { name: 'B' }).focus();
    });
    expect(release).not.toHaveBeenCalled();
    hasFocus.mockReturnValue(false);
    fireEvent.blur(screen.getByRole('link', { name: 'B' }));
    expect(release).not.toHaveBeenCalled();
    hasFocus.mockReturnValue(true);
    act(() => {
      screen.getByRole('link', { name: 'Out' }).focus();
    });
    expect(release).toHaveBeenCalledOnce();
  });

  it('the pointer focus does not point', () => {
    focusFromKeyboard(false);
    const { point } = setup();
    act(() => {
      screen.getByRole('link', { name: 'A' }).focus();
    });
    expect(point).not.toHaveBeenCalled();
  });
});
