import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Lightbox, wrapIndex, type LightboxImage } from './Lightbox';

/**
 * jsdom no implementa `showModal` ni `close`: lo mínimo del navegador. `showModal` pone `open`;
 * `close` lo quita y lanza `close`, que es lo que hace también `Esc` en un navegador de verdad.
 */
const showModal = vi.fn(function (this: HTMLDialogElement) {
  this.setAttribute('open', '');
});
const close = vi.fn(function (this: HTMLDialogElement) {
  if (!this.hasAttribute('open')) return;
  this.removeAttribute('open');
  this.dispatchEvent(new Event('close'));
});

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = showModal;
  HTMLDialogElement.prototype.close = close;
});

afterEach(() => {
  showModal.mockClear();
  close.mockClear();
});

const IMAGES: readonly LightboxImage[] = [
  { src: '/a.webp', width: 1600, height: 900, alt: 'Home page' },
  { src: '/b.webp', width: 1600, height: 900, alt: 'Course list' },
  { src: '/c.webp', width: 900, height: 1600, alt: 'Dashboard on a phone' },
];

const onClose = vi.fn();

/** Visor controlado como lo usa la galería: el padre guarda el índice. */
function Harness({
  start,
  images,
}: {
  readonly start: number | null;
  readonly images: readonly LightboxImage[];
}): ReactNode {
  const [index, setIndex] = useState<number | null>(start);
  return (
    <Lightbox
      label="Gallery"
      images={images}
      index={index}
      onIndexChange={setIndex}
      onClose={() => {
        setIndex(null);
        onClose();
      }}
    />
  );
}

function renderAt(path: string, start: number | null, images = IMAGES): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Harness start={start} images={images} />
    </MemoryRouter>,
  );
}

const dialog = (): HTMLDialogElement => {
  const element = document.querySelector('dialog');
  if (element === null) throw new Error('No <dialog> rendered');
  return element;
};

const status = (): string => screen.getByRole('status').textContent;

afterEach(() => {
  onClose.mockClear();
});

describe('wrapIndex', () => {
  it('con vuelta en los dos sentidos', () => {
    expect(wrapIndex(0, 3)).toBe(0);
    expect(wrapIndex(3, 3)).toBe(0);
    expect(wrapIndex(-1, 3)).toBe(2);
    expect(wrapIndex(5, 3)).toBe(2);
  });
});

describe('Lightbox', () => {
  it('cerrado: el diálogo existe vacío y no se abre', () => {
    renderAt('/', null);
    expect(dialog()).not.toHaveAttribute('open');
    expect(dialog()).toBeEmptyDOMElement();
    expect(showModal).not.toHaveBeenCalled();
  });

  it('abierto: modal con nombre, imagen con sus medidas, contador y foco en «Close»', () => {
    renderAt('/', 1);
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog', { name: 'Gallery' })).toBe(dialog());
    const image = screen.getByRole('img', { name: 'Course list' });
    expect(image).toHaveAttribute('src', '/b.webp');
    expect(image).toHaveAttribute('width', '1600');
    expect(dialog()).toHaveTextContent('2 / 3');
    expect(status()).toBe('2 of 3: Course list');
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('→ y ← cambian de imagen con vuelta y lo anuncian', () => {
    renderAt('/', 2);
    fireEvent.keyDown(dialog(), { key: 'ArrowRight' });
    expect(status()).toBe('1 of 3: Home page');
    fireEvent.keyDown(dialog(), { key: 'ArrowLeft' });
    expect(status()).toBe('3 of 3: Dashboard on a phone');
    fireEvent.keyDown(dialog(), { key: 'ArrowLeft' });
    expect(status()).toBe('2 of 3: Course list');
  });

  it('las flechas con un modificador no hacen nada (atajos del navegador)', () => {
    renderAt('/', 0);
    fireEvent.keyDown(dialog(), { key: 'ArrowRight', altKey: true });
    expect(status()).toBe('1 of 3: Home page');
    fireEvent.keyDown(dialog(), { key: 'ArrowLeft', metaKey: true });
    fireEvent.keyDown(dialog(), { key: 'ArrowRight', ctrlKey: true });
    fireEvent.keyDown(dialog(), { key: 'ArrowRight', shiftKey: true });
    expect(status()).toBe('1 of 3: Home page');
  });

  it('los botones de flecha hacen lo mismo y el foco se queda en ellos', async () => {
    const user = userEvent.setup();
    renderAt('/', 0);
    const next = screen.getByRole('button', { name: 'Next image' });
    await user.click(next);
    expect(status()).toBe('2 of 3: Course list');
    expect(next).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Previous image' }));
    await user.click(screen.getByRole('button', { name: 'Previous image' }));
    expect(status()).toBe('3 of 3: Dashboard on a phone');
  });

  it('«Close» y Esc cierran (el evento close) y avisan al dueño', async () => {
    const user = userEvent.setup();
    renderAt('/', 0);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(dialog()).not.toHaveAttribute('open');
    expect(dialog()).toBeEmptyDOMElement();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('con una sola imagen no hay flechas', () => {
    renderAt('/', 0, IMAGES.slice(0, 1));
    expect(screen.queryByRole('button', { name: 'Next image' })).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(status()).toBe('1 of 1: Home page');
  });

  it('en español', () => {
    renderAt('/es/projects/x', 0);
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Imagen siguiente' })).toBeInTheDocument();
    expect(status()).toBe('1 de 3: Home page');
  });

  it('sin imágenes no se abre aunque llegue un índice', () => {
    renderAt('/', 0, []);
    expect(showModal).not.toHaveBeenCalled();
    expect(dialog()).toBeEmptyDOMElement();
  });
});
