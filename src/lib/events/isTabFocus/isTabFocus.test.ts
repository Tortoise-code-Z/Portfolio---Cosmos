import { afterEach, describe, expect, it, vi } from 'vitest';

import { isTabFocus } from './isTabFocus';

/** `Element.prototype.matches` de jsdom, antes de espiarlo. */
const ELEMENT_MATCHES = Object.getOwnPropertyDescriptor(Element.prototype, 'matches')?.value as (
  this: Element,
  selector: string,
) => boolean;

/** El foco se ve como con Tab (`:focus-visible`) o no (un clic). */
function focusVisible(visible: boolean): void {
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector) {
    return selector === ':focus-visible' ? visible : ELEMENT_MATCHES.call(this, selector);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isTabFocus', () => {
  it('an element reached with the keyboard, with its focus in sight', () => {
    focusVisible(true);
    const link = document.createElement('a');
    link.href = '/cv.pdf';
    expect(isTabFocus(link)).toBe(true);
  });

  it('not a focus from a click (no :focus-visible)', () => {
    focusVisible(false);
    const button = document.createElement('button');
    expect(isTabFocus(button)).toBe(false);
  });

  it('not a heading that the jumps focus (tabindex -1)', () => {
    focusVisible(true);
    const heading = document.createElement('h2');
    heading.tabIndex = -1;
    expect(isTabFocus(heading)).toBe(false);
  });

  it('nothing, or something that is not an HTML element', () => {
    focusVisible(true);
    expect(isTabFocus(null)).toBe(false);
    expect(isTabFocus(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))).toBe(false);
  });
});
