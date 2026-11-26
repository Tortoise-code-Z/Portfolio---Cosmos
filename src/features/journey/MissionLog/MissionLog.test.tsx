import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { experience } from '~/content/experience';
import { localize } from '~/lib/i18n/localize/localize';

import { MissionLog } from './MissionLog';

function renderAt(path: string): HTMLElement {
  render(
    <MemoryRouter initialEntries={[path]}>
      <MissionLog />
    </MemoryRouter>,
  );
  return screen.getByRole('region', { name: path.startsWith('/es') ? 'Misión 01' : 'Mission 01' });
}

describe('MissionLog', () => {
  it('is the region #mission-log named by its title, the screen of the interlude, between the gaps of its satellite and followed by its tail', () => {
    const region = renderAt('/');
    expect(region).toHaveAccessibleName('Mission 01');
    expect(region).toHaveAttribute('id', 'mission-log');
    expect(region).toHaveAttribute('data-interlude', 'mission-log');
    // La nave llega en un hueco antes de la pantalla (el ancla, en la sección: se aterriza al final de la llegada) y se
    // va en otro después; luego, la cola.
    const arrival = region.previousElementSibling;
    const exit = region.nextElementSibling;
    const tail = exit?.nextElementSibling;
    expect(arrival).toHaveAttribute('data-interlude-arrival', 'mission-log');
    expect(exit).toHaveAttribute('data-interlude-exit', 'mission-log');
    expect(tail).toHaveAttribute('data-interlude-tail', 'mission-log');
    for (const gap of [arrival, exit, tail]) {
      expect(gap).toHaveAttribute('aria-hidden', 'true');
      expect(gap?.textContent).toBe('');
    }
  });

  it.each([
    [
      '/',
      'Software Developer Intern',
      'Remote · Tenerife, Spain',
      'Jul 2026 – Oct 2026',
      'Mission complete',
    ],
    [
      '/es',
      'Desarrollador de software en prácticas',
      'En remoto · Tenerife, España',
      'jul 2026 – oct 2026',
      'Misión cumplida',
    ],
  ] as const)('%s: the mission record, as the CV says it', (path, role, place, window, status) => {
    const region = renderAt(path);
    for (const value of ['Studios Demanzon', role, place, window, status]) {
      expect(within(region).getByText(value).tagName).toBe('DD');
    }
  });

  it('the manifest: one module per tool, with what it was for and the log entries it links to', () => {
    const region = renderAt('/');
    const manifest = within(region).getByRole('list', { name: 'Payload manifest' });
    const modules = within(manifest).getAllByRole('listitem');
    expect(modules).toHaveLength(experience.modules.length);
    expect(modules[0]).toHaveTextContent('Next.js · React · TypeScript');
    expect(modules[0]).toHaveTextContent('Log entries 01, 02, and 04');
    expect(modules[2]).toHaveTextContent('State and rendering');
  });

  it('the flight log: the six entries, numbered and tagged, and the end of the transmission', () => {
    const region = renderAt('/es');
    const log = within(region).getByRole('list', { name: 'Diario de vuelo' });
    const entries = within(log).getAllByRole('listitem');
    expect(entries).toHaveLength(6);
    expect(entries[2]).toHaveTextContent(/^03ARREGLADOArreglé bugs de estado/);
    expect(within(region).getByText('Fin de la transmisión')).toBeInTheDocument();
  });

  it.each(['/', '/es'] as const)(
    '%s: paints only the content of `experience`, in its order (the text itself is reviewed there)',
    (path) => {
      const locale = path === '/' ? 'en' : 'es';
      const region = renderAt(path);
      expect(region).toHaveTextContent(localize(locale, experience.summary));
      const modules = within(
        within(region).getByRole('list', { name: /Payload manifest|Manifiesto de carga/ }),
      ).getAllByRole('listitem');
      expect(modules.map((item) => item.firstElementChild?.textContent)).toEqual(
        experience.modules.map((module) => localize(locale, module.name)),
      );
      expect(modules.map((item) => item.children[1]?.textContent)).toEqual(
        experience.modules.map((module) => localize(locale, module.purpose)),
      );
      const entries = within(
        within(region).getByRole('list', { name: /Flight log|Diario de vuelo/ }),
      ).getAllByRole('listitem');
      expect(entries.map((item) => item.lastElementChild?.textContent)).toEqual(
        experience.log.map((entry) => localize(locale, entry.text)),
      );
    },
  );

  it.each([
    ['/', '“', '”', 'Ángel González, CTO, Studios Demanzon'],
    ['/es', '«', '»', 'Ángel González, CTO de Studios Demanzon'],
  ] as const)(
    '%s: the reference, quoted in the language of its letter',
    (path, open, close, by) => {
      const region = renderAt(path);
      const reference = within(region).getByRole('figure', { name: /Reference|Referencia/ });
      const quote = reference.querySelector('blockquote');
      expect(quote?.textContent.startsWith(`${open}…`)).toBe(true);
      expect(quote?.textContent.endsWith(`.${close}`)).toBe(true);
      expect(reference).toHaveTextContent(by);
    },
  );
});
