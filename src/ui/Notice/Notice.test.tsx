import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import { Notice } from './Notice';

describe('Notice', () => {
  it('keeps its live region even when closed, so what appears later is announced', () => {
    const { rerender } = render(
      <Notice open={false}>
        <p>Hello</p>
      </Notice>,
    );
    const region = screen.getByRole('status');
    expect(region).toBeEmptyDOMElement();

    rerender(
      <Notice open>
        <p>Hello</p>
      </Notice>,
    );
    expect(screen.getByRole('status')).toBe(region);
    expect(region).toHaveTextContent('Hello');
  });

  it('speaks its own language when it is not the page one', () => {
    render(
      <Notice open lang="es">
        <p>Hola</p>
      </Notice>,
    );
    expect(screen.getByRole('status')).toHaveAttribute('lang', 'es');
  });
});

describe('Notice · focus behind it', () => {
  function rect(top: number, bottom: number, left = 16, right = 374): DOMRect {
    return { top, bottom, left, right, width: right - left, height: bottom - top } as DOMRect;
  }

  function setup(focusedRect: DOMRect): MockInstance<typeof window.scrollBy> {
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(844);
    document.documentElement.style.scrollPaddingBlockEnd = '143px';
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined);
    render(
      <>
        <button type="button">Behind</button>
        <Notice open>
          <p>Hola</p>
        </Notice>
      </>,
    );
    const box = screen.getByText('Hola').parentElement;
    if (box === null) throw new Error('No notice box');
    vi.spyOn(box, 'getBoundingClientRect').mockReturnValue(rect(733, 828));
    const button = screen.getByRole('button', { name: 'Behind' });
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue(focusedRect);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 0;
    });
    button.focus();
    return scrollBy;
  }

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.style.removeProperty('scroll-padding-block-end');
  });

  it('scrolls up just enough when what gets the focus lies under it (Firefox does not)', () => {
    const scrollBy = setup(rect(704, 748));
    expect(scrollBy).toHaveBeenCalledWith({ top: 748 - (844 - 143), behavior: 'instant' });
  });

  it('does nothing when it is already above it, or beside it', () => {
    expect(setup(rect(500, 544))).not.toHaveBeenCalled();
    document.body.replaceChildren();
    expect(setup(rect(704, 748, 380, 420))).not.toHaveBeenCalled();
  });
});
