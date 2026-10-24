import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import { NotFoundPage } from './NotFoundPage';

const Stub = createRoutesStub([{ path: '*', Component: NotFoundPage }]);

describe('NotFoundPage', () => {
  it.each([
    [
      '/loquesea',
      'en',
      'Lost in space',
      'This page drifted out of orbit.',
      'Back to the start',
      '/',
    ],
    [
      '/es/loquesea',
      'es',
      'Perdido en el espacio',
      'Esta página se salió de su órbita.',
      'Volver al inicio',
      '/es',
    ],
  ])(
    '%s → título, frase y vuelta al inicio del idioma (%s)',
    async (path, _locale, title, body, cta, home) => {
      render(<Stub initialEntries={[path]} />);
      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(title);
      expect(screen.getByText(body)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: cta })).toHaveAttribute('href', home);
    },
  );

  it('es una sola región principal con un solo h1 y un solo enlace', async () => {
    render(<Stub initialEntries={['/x']} />);
    await screen.findByRole('main');
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});
