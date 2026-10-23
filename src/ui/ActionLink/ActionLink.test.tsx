import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { ActionLink } from './ActionLink';

function renderAt(path: string, link: ReactNode): void {
  render(<MemoryRouter initialEntries={[path]}>{link}</MemoryRouter>);
}

describe('ActionLink', () => {
  it('internal: same tab, router href and the optional icon', () => {
    renderAt(
      '/',
      <ActionLink href="/projects/chessmate" kind="internal" icon="arrow-right">
        View project
      </ActionLink>,
    );
    const link = screen.getByRole('link', { name: 'View project' });
    expect(link).toHaveAttribute('href', '/projects/chessmate');
    expect(link).not.toHaveAttribute('target');
    expect(link.querySelectorAll('svg')).toHaveLength(1);
  });

  it('internal without icon draws no SVG', () => {
    renderAt(
      '/',
      <ActionLink href="/es" kind="internal">
        ES
      </ActionLink>,
    );
    expect(screen.getByRole('link', { name: 'ES' }).querySelector('svg')).toBeNull();
  });

  it.each([
    ['/', 'Code (opens in a new tab)'],
    ['/es', 'Code (se abre en una pestaña nueva)'],
  ])('external at %s: new tab, safe rel and announced', (path, name) => {
    renderAt(
      path,
      <ActionLink href="https://github.com/x" kind="external">
        Code
      </ActionLink>,
    );
    const link = screen.getByRole('link', { name });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('download: same tab with the download attribute', () => {
    renderAt(
      '/',
      <ActionLink href="/cv/en.pdf" kind="download">
        Download CV (PDF)
      </ActionLink>,
    );
    const link = screen.getByRole('link', { name: 'Download CV (PDF)' });
    expect(link).toHaveAttribute('download');
    expect(link).not.toHaveAttribute('target');
  });
});
