import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { useLocale, useT } from './useT';

function Probe(): ReactNode {
  const t = useT();
  return (
    <p data-locale={useLocale()}>
      {t('nav.skip')} · {t('meta.project.title', { project: 'Chessmate' })}
    </p>
  );
}

describe('useT', () => {
  it.each([
    ['/', 'en', 'Skip to content · Chessmate · Víctor Pérez'],
    ['/projects/chessmate', 'en', 'Skip to content · Chessmate · Víctor Pérez'],
    ['/es', 'es', 'Saltar al contenido · Chessmate · Víctor Pérez'],
    ['/es/projects/chessmate', 'es', 'Saltar al contenido · Chessmate · Víctor Pérez'],
  ])('%s → %s', (path, locale, text) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Probe />
      </MemoryRouter>,
    );
    const probe = screen.getByText(text);
    expect(probe).toHaveAttribute('data-locale', locale);
  });
});
