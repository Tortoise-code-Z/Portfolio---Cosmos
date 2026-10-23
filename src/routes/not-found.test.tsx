import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import NotFound from './not-found';

const Stub = createRoutesStub([{ path: '*', Component: NotFound }]);

describe('NotFound', () => {
  it.each([
    ['/loquesea', 'Lost in space', 'Back to the start', '/'],
    ['/en/x', 'Lost in space', 'Back to the start', '/'],
    ['/es/loquesea', 'Perdido en el espacio', 'Volver al inicio', '/es'],
  ])('%s → 404 del idioma del prefijo', async (path, title, cta, home) => {
    render(<Stub initialEntries={[path]} />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(title);
    expect(screen.getByRole('link', { name: cta })).toHaveAttribute('href', home);
  });
});
