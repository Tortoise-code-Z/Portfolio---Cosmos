import type { ReactNode } from 'react';

import styles from './Picture.module.css';

/** Una imagen con sus variantes: la forma de `ResponsiveImage` (content/types), que llega por props. */
export interface PictureImage {
  /** Respaldo del `<img>` (la WebP mayor). */
  readonly src: string;
  readonly width: number;
  readonly height: number;
  /** `srcset` de cada formato, del más ligero al más compatible. */
  readonly sources: {
    readonly avif: string;
    readonly webp: string;
  };
}

interface PictureProps {
  readonly image: PictureImage;
  readonly alt: string;
  /** Ancho que ocupa en pantalla (atributo `sizes`): con él, el navegador elige la variante. */
  readonly sizes: string;
  /** Clase del `<img>` (las de CSS Modules pueden llegar `undefined`). */
  readonly className?: string | undefined;
  /** `lazy` para lo que queda lejos al cargar (la galería); por defecto, `eager`. */
  readonly loading?: 'eager' | 'lazy';
  /** `high` para la imagen mayor de la primera vista (la portada: el LCP de la ficha). */
  readonly fetchPriority?: 'high' | 'auto';
}

/**
 * `<picture>` con AVIF y WebP en varios anchos (docs/01-contenido/assets.md → «Capturas de proyectos»):
 * el navegador elige el primer formato que entiende y, con `sizes`, el ancho justo. `width` y `height`
 * reservan el hueco antes de que llegue la imagen (sin saltos de layout). El `<picture>` no genera caja
 * propia: las clases van al `<img>`, como si no estuviera.
 */
export function Picture({
  image,
  alt,
  sizes,
  className,
  loading = 'eager',
  fetchPriority = 'auto',
}: PictureProps): ReactNode {
  return (
    <picture className={styles.picture}>
      <source type="image/avif" srcSet={image.sources.avif} sizes={sizes} />
      <source type="image/webp" srcSet={image.sources.webp} sizes={sizes} />
      <img
        src={image.src}
        width={image.width}
        height={image.height}
        alt={alt}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        className={className}
      />
    </picture>
  );
}
