import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import Journey from './journey';

const Stub = createRoutesStub([
  { path: '/', Component: Journey },
  { path: '/es', Component: Journey },
]);

describe('Journey', () => {
  it('el nombre es el único h1', async () => {
    render(<Stub initialEntries={['/']} />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Víctor Pérez');
  });

  it('frase del hero en inglés en /', async () => {
    render(<Stub initialEntries={['/']} />);
    expect(await screen.findByText(/So did my code\./)).toBeInTheDocument();
  });

  it('frase del hero en español en /es', async () => {
    render(<Stub initialEntries={['/es']} />);
    expect(await screen.findByText(/Mi código también\./)).toBeInTheDocument();
  });

  it('/ES (mayúsculas) es la 404 en inglés, aunque el cliente case la ruta de /es', async () => {
    render(<Stub initialEntries={['/ES']} />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Lost in space');
  });
});
