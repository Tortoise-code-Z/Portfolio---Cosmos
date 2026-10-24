import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import { ProjectNote } from './ProjectNote';

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
      expect(container.querySelector(`[data-kind="${kind}"] svg`)).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    },
  );
});
