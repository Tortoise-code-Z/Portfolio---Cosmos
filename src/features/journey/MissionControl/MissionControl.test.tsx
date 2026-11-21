import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { siteTelemetry } from '~/content/telemetry';
import { formatMonth, formatNumber } from '~/lib/i18n/format/format';

import { MissionControl } from './MissionControl';

function renderMissionControl(path = '/'): HTMLElement {
  render(
    <MemoryRouter initialEntries={[path]}>
      <MissionControl />
    </MemoryRouter>,
  );
  return screen.getByRole('region', {
    name: path.startsWith('/es') ? 'Cómo trabajo' : 'How I work',
  });
}

describe('MissionControl', () => {
  it('is the blue transmission titled «How I work»: the huge «T-0» is decoration, hidden from screen readers', () => {
    const region = renderMissionControl();
    expect(region).toHaveAttribute('id', 'mission-control');
    expect(region).toHaveAttribute('data-interlude', 'mission-control');
    expect(region).toHaveTextContent('Channel 02 · blue');
    const title = screen.getByRole('heading', { level: 2, name: 'How I work' });
    expect(title).toHaveAttribute('tabindex', '-1');
    const countdown = within(title).getByText('T-0');
    expect(countdown.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(region).toHaveTextContent('t = mythic time · cosmic clock paused');
  });

  it('the launch sequence is a real ordered list, T-4 to T-0, and the audit loop is in its text', () => {
    renderMissionControl();
    const list = screen.getByRole('list', { name: 'Schematic · launch sequence' });
    expect(list.tagName).toBe('OL');
    const steps = within(list).getAllByRole('listitem');
    // Con espacios entre las piezas: se leen separadas al copiar o sin CSS.
    expect(steps.map((step) => step.querySelector('[data-line]')?.textContent)).toEqual([
      'T-4 Plan Steps, files and risks. No code yet.',
      'T-3 Green light The plan is approved before anything is built.',
      'T-2 Build One branch and one PR per task, strict TypeScript.',
      'T-1 Audit A fresh-eyes review in a separate session; its fixes ship before the next task. Fixes from the audit go back to build.',
      'T-0 Launch Checks green in Chromium, Firefox, and WebKit.',
    ]);
    // El texto del bucle, en el paso de Audit, llega al lector de pantalla (no queda bajo un `aria-hidden`).
    expect(
      within(list)
        .getByText('Fixes from the audit go back to build.')
        .closest('[aria-hidden="true"]'),
    ).toBeNull();
  });

  it('the drawing (the «no code yet» bracket, the loop and its mobile note) is hidden from screen readers', () => {
    const region = renderMissionControl();
    const hidden = [...region.querySelectorAll('[aria-hidden="true"]')].map(
      (node) => node.textContent,
    );
    expect(hidden).toEqual(
      expect.arrayContaining([
        'No code yet',
        '↓ · ↑ Fixes from the audit go back to build',
        'Fixes from the audit go back to build',
      ]),
    );
  });

  it('the telemetry shows the figures counted from the repo at build time, with the month, formatted per language', () => {
    renderMissionControl('/es');
    const month = formatMonth('es', siteTelemetry.month);
    const telemetry = screen.getByRole('region', { name: `Telemetría · este sitio · ${month}` });
    // Solo el mes va marcado para la captura (cambia con el tiempo); el rótulo, no.
    expect(
      [...telemetry.querySelectorAll('h3 [data-telemetry]')].map((node) => node.textContent),
    ).toEqual([month]);
    const figures = within(telemetry)
      .getAllByRole('definition')
      .map((figure) => figure.textContent);
    expect(figures).toEqual([
      formatNumber('es', siteTelemetry.unitTests),
      formatNumber('es', siteTelemetry.e2eTests),
      String(siteTelemetry.browsers.length),
      formatNumber('es', siteTelemetry.decisions),
    ]);
    expect(
      within(telemetry)
        .getAllByRole('term')
        .map((term) => term.textContent),
    ).toEqual([
      'Tests unitarios · Vitest',
      'Tests e2e · Playwright',
      'Navegadores en el CI',
      'Decisiones registradas',
    ]);
    expect(telemetry).toHaveTextContent('Copiloto: Claude Code con skills que escribí yo');
  });

  it('«Touchdown» and «Skip transmission» are real links to Contact', () => {
    renderMissionControl('/es');
    expect(screen.getByRole('link', { name: 'Aterrizaje · Contacto' })).toHaveAttribute(
      'href',
      '/es#contact',
    );
    expect(screen.getByRole('link', { name: /Saltar transmisión/ })).toHaveAttribute(
      'href',
      '/es#contact',
    );
  });

  it('every step and figure is a teletype line, in order: the countdown first, then the telemetry', () => {
    const region = renderMissionControl();
    const lines = [...region.querySelectorAll<HTMLElement>('[data-line]')].map((line) =>
      line.style.getPropertyValue('--_line'),
    );
    expect(lines).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
  });
});
