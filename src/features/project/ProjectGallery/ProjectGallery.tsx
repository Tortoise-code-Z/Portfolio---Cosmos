import { useRef, useState, type ReactNode } from 'react';

import type { ImageAsset } from '~/content/types';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { Lightbox, type LightboxImage } from '~/ui/Lightbox/Lightbox';
import { Picture } from '~/ui/Picture/Picture';
import { VisuallyHidden } from '~/ui/VisuallyHidden/VisuallyHidden';

import styles from './ProjectGallery.module.css';

/**
 * Ancho de cada miniatura (atributo `sizes`): tres columnas en la columna de lectura (720 px) desde 760 px
 * de ventana, dos desde 500 px y una por debajo (rejilla de `--project-col-min`). Aproximado por arriba.
 */
const THUMB_SIZES = '(min-width: 760px) 240px, (min-width: 500px) 50vw, 100vw';

interface ProjectGalleryProps {
  readonly images: readonly ImageAsset[];
}

/**
 * Galería de la página de proyecto (pagina-proyecto.md → «Estructura», punto 9): miniaturas que abren
 * el visor a pantalla completa (`ui/Lightbox`). Cada miniatura es un botón que dice qué abre («Open
 * image 2 of 5» + su texto alternativo). Al cerrar el visor, el foco vuelve a la miniatura de la imagen
 * que se estaba viendo.
 */
export function ProjectGallery({ images }: ProjectGalleryProps): ReactNode {
  const t = useT();
  const locale = useLocale();
  const [active, setActive] = useState<number | null>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const total = images.length;

  const localized: readonly LightboxImage[] = images.map((image) => ({
    src: image.src,
    width: image.width,
    height: image.height,
    sources: image.sources,
    alt: image.alt[locale],
  }));

  function onClose(): void {
    const last = active;
    setActive(null);
    if (last !== null) thumbs.current[last]?.focus();
  }

  return (
    <>
      <ul role="list" className={styles.grid}>
        {localized.map((image, index) => (
          <li key={image.src}>
            <button
              ref={(element) => {
                thumbs.current[index] = element;
              }}
              type="button"
              className={styles.thumb}
              aria-haspopup="dialog"
              onClick={() => {
                setActive(index);
              }}
            >
              {/* Un espacio de texto real entre los dos: todos los motores leen «Open image 2 of 5 Courses». */}
              <VisuallyHidden>
                {t('project.gallery.open', { n: String(index + 1), total: String(total) })}
              </VisuallyHidden>{' '}
              <Picture
                image={image}
                alt={image.alt}
                sizes={THUMB_SIZES}
                loading="lazy"
                className={styles.image}
              />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox
        label={t('project.gallery')}
        images={localized}
        index={active}
        onIndexChange={setActive}
        onClose={onClose}
      />
    </>
  );
}
