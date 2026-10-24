import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRoutesStub } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ImageAsset } from '~/content/types';

import { ProjectGallery } from './ProjectGallery';

// jsdom no implementa `showModal` ni `close` (ver ui/Lightbox/Lightbox.test.tsx).
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  });
});

/** Imágenes de prueba: la galería real llega en F2.8. */
const GALLERY: readonly ImageAsset[] = [
  { src: '/g/1.webp', width: 1600, height: 900, alt: { en: 'Home page', es: 'Página de inicio' } },
  { src: '/g/2.webp', width: 1600, height: 900, alt: { en: 'Courses', es: 'Cursos' } },
  { src: '/g/3.webp', width: 1600, height: 900, alt: { en: 'Dashboard', es: 'Panel' } },
];

function renderAt(path: string): void {
  const Stub = createRoutesStub([
    { path: '*', Component: () => <ProjectGallery images={GALLERY} /> },
  ]);
  render(<Stub initialEntries={[path]} />);
}

describe('ProjectGallery', () => {
  it('una miniatura por imagen: un botón que dice qué abre, con su texto alternativo', async () => {
    renderAt('/projects/x');
    const thumbs = await screen.findAllByRole('button', { name: /^Open image/ });
    expect(
      thumbs.map((thumb) => thumb.textContent + (thumb.querySelector('img')?.alt ?? '')),
    ).toEqual([
      'Open image 1 of 3 Home page',
      'Open image 2 of 3 Courses',
      'Open image 3 of 3 Dashboard',
    ]);
    expect(screen.getByRole('button', { name: 'Open image 2 of 3 Courses' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );
    expect(thumbs[0]?.querySelector('img')).toHaveAttribute('loading', 'lazy');
  });

  it('abre el visor en la imagen pulsada y, al cerrar, devuelve el foco a la que se veía', async () => {
    const user = userEvent.setup();
    renderAt('/projects/x');
    await user.click(await screen.findByRole('button', { name: 'Open image 1 of 3 Home page' }));
    expect(screen.getByRole('status')).toHaveTextContent('1 of 3: Home page');

    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('status')).toHaveTextContent('3 of 3: Dashboard');

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByRole('button', { name: 'Open image 3 of 3 Dashboard' })).toHaveFocus();
  });

  it('en español', async () => {
    renderAt('/es/projects/x');
    expect(
      await screen.findByRole('button', { name: 'Abrir imagen 2 de 3 Cursos' }),
    ).toBeInTheDocument();
  });
});
