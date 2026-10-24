import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Icon, type IconName } from './Icon';

const NAMES: readonly IconName[] = [
  'arrow-down',
  'arrow-left',
  'arrow-right',
  'external',
  'download',
  'info',
  'warning',
];

describe('Icon', () => {
  it.each(NAMES)('%s is decorative, inline SVG with a path', (name) => {
    const { container } = render(<Icon name={name} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg?.querySelector('path')?.getAttribute('d')).toMatch(/^M/);
  });

  it('the stroke does not scale with the size (1.5 px at 16 and 20 px)', () => {
    const { container } = render(<Icon name="external" size={20} />);
    expect(container.querySelector('path')).toHaveAttribute('vector-effect', 'non-scaling-stroke');
  });

  it('defaults to 16 px and accepts 20 px', () => {
    const { container, rerender } = render(<Icon name="external" />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '16');
    rerender(<Icon name="external" size={20} />);
    expect(container.querySelector('svg')).toHaveAttribute('height', '20');
  });
});
