import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import { Icon } from '~/ui/Icon/Icon';

import { ProjectNote } from './ProjectNote';

/** El dibujo del icono `name` (su `<path>`), para saber cuál lleva la nota. */
function iconPath(name: 'info' | 'warning'): string | null {
  const { container } = render(<Icon name={name} />);
  const path = container.querySelector('path')?.getAttribute('d') ?? null;
  container.remove();
  return path;
}

function renderAt(path: string, kind: 'info' | 'warning'): HTMLElement {
  const Stub = createRoutesStub([
    { path: '*', Component: () => <ProjectNote kind={kind}>Local setup only.</ProjectNote> },
  ]);
  const { container } = render(<Stub initialEntries={[path]} />);
  return container;
}

describe('ProjectNote', () => {
  it.each([
    ['/projects/x', 'info', 'Note: Local setup only.'],
    ['/projects/x', 'warning', 'Warning: Local setup only.'],
    ['/es/projects/x', 'info', 'Nota: Local setup only.'],
    ['/es/projects/x', 'warning', 'Atención: Local setup only.'],
  ] as const)(
    '%s · %s: el tipo se lee delante del texto, no solo con color',
    async (path, kind, text) => {
      const container = renderAt(path, kind);
      const paragraph = await screen.findByText('Local setup only.', { exact: false });
      expect(paragraph).toHaveTextContent(text);
      const icon = container.querySelector(`[data-kind="${kind}"] svg`);
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      // El icono de su tipo (ⓘ o ⚠), no uno cualquiera.
      expect(icon?.querySelector('path')?.getAttribute('d')).toBe(iconPath(kind));
    },
  );
});
