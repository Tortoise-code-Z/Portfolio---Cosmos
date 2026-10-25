import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Picture, type PictureImage } from './Picture';

const IMAGE: PictureImage = {
  src: '/assets/home-1920.webp',
  width: 1920,
  height: 960,
  sources: {
    avif: '/assets/home-640.avif 640w, /assets/home-1920.avif 1920w',
    webp: '/assets/home-640.webp 640w, /assets/home-1920.webp 1920w',
  },
};

function sourcesOf(container: HTMLElement): Element[] {
  return [...container.querySelectorAll('picture > source')];
}

describe('Picture', () => {
  it('AVIF primero y WebP después, cada uno con su srcset y el mismo sizes', () => {
    const { container } = render(<Picture image={IMAGE} alt="Home" sizes="100vw" />);
    expect(
      sourcesOf(container).map((source) => [
        source.getAttribute('type'),
        source.getAttribute('srcset'),
        source.getAttribute('sizes'),
      ]),
    ).toEqual([
      ['image/avif', IMAGE.sources.avif, '100vw'],
      ['image/webp', IMAGE.sources.webp, '100vw'],
    ]);
  });

  it('el img es el último hijo: respaldo con sus medidas (sin saltos) y el texto alternativo', () => {
    const { container } = render(<Picture image={IMAGE} alt="Home" sizes="100vw" />);
    const image = screen.getByRole('img', { name: 'Home' });
    expect(container.querySelector('picture')?.lastElementChild).toBe(image);
    expect(image).toHaveAttribute('src', IMAGE.src);
    expect(image).toHaveAttribute('width', '1920');
    expect(image).toHaveAttribute('height', '960');
    expect(image).toHaveAttribute('decoding', 'async');
  });

  it('por defecto se pide al cargar y sin prioridad especial', () => {
    render(<Picture image={IMAGE} alt="Home" sizes="100vw" />);
    const image = screen.getByRole('img', { name: 'Home' });
    expect(image).toHaveAttribute('loading', 'eager');
    expect(image).toHaveAttribute('fetchpriority', 'auto');
  });

  it('lazy y prioridad alta cuando se piden; la clase va al img', () => {
    render(
      <>
        <Picture image={IMAGE} alt="Cover" sizes="720px" fetchPriority="high" className="cover" />
        <Picture image={IMAGE} alt="Thumb" sizes="240px" loading="lazy" />
      </>,
    );
    const cover = screen.getByRole('img', { name: 'Cover' });
    expect(cover).toHaveAttribute('fetchpriority', 'high');
    expect(cover).toHaveAttribute('loading', 'eager');
    expect(cover).toHaveClass('cover');
    expect(screen.getByRole('img', { name: 'Thumb' })).toHaveAttribute('loading', 'lazy');
  });
});
