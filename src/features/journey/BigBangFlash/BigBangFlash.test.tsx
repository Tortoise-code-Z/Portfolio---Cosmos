import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BIG_BANG_VARS } from '~/lib/bigBang/bigBang';

import { BigBangFlash } from './BigBangFlash';

/** Su CSS, del disco (con jsdom, `new URL` no lleva a rutas `file:`). */
const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'BigBangFlash.module.css'),
  'utf8',
);

describe('BigBangFlash', () => {
  it('is decorative', () => {
    const { container } = render(<BigBangFlash />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstElementChild).toHaveAttribute('data-big-bang', 'flash');
  });

  it('its opacity is the one the Big Bang loop writes, 0 until it does, and only with the scene', () => {
    expect(css).toContain(`opacity: var(${BIG_BANG_VARS.flash}, 0);`);
    expect(css).toMatch(/:global\(\.scene-on\) \.flash \{\s+display: block;/);
  });
});
