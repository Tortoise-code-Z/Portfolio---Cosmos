import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { useLocale, useT, type Translate } from './useT';

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

describe('tipos de t (los comprueba tsc)', () => {
  it('exige exactamente los huecos de la clave, con valores de texto', () => {
    const errors = (t: Translate): void => {
      // @ts-expect-error -- `nav.skip` no tiene huecos.
      t('nav.skip', { x: '1' });
      // @ts-expect-error -- faltan los huecos.
      t('meta.project.title');
      // @ts-expect-error -- los números se formatean antes (formatNumber o String(year)).
      t('footer.line', { year: 2026 });
    };
    expect(errors).toBeTypeOf('function');
  });
});
