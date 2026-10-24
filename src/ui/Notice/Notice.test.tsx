import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
