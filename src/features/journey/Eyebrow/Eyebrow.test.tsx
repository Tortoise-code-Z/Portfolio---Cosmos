import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Eyebrow } from './Eyebrow';

describe('Eyebrow', () => {
  it('splits the section from the rest at the first « · »', () => {
    const { container } = render(<Eyebrow text="About · nebula · t ≈ 200 million years" />);
    const spans = container.querySelectorAll('span');
    expect([...spans].map((span) => span.textContent)).toEqual([
      'About',
      ' · nebula · t ≈ 200 million years',
    ]);
    expect(container.textContent).toBe('About · nebula · t ≈ 200 million years');
  });

  it('a text without separator is all section', () => {
    const { container } = render(<Eyebrow text="Contact" />);
    expect(container.querySelectorAll('span')).toHaveLength(1);
    expect(container.textContent).toBe('Contact');
  });
});
