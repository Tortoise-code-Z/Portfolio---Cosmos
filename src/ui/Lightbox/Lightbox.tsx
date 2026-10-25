import { useId, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

import { useT } from '~/lib/i18n/useT/useT';

import { ButtonOutline } from '../ButtonOutline/ButtonOutline';
import { Icon } from '../Icon/Icon';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './Lightbox.module.css';

/** Una imagen del visor, ya en el idioma de la página. */
export interface LightboxImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
}

interface LightboxProps {
  /** Nombre del diálogo para el lector («Gallery»). */
  readonly label: string;
  readonly images: readonly LightboxImage[];
  /** Imagen abierta, o `null` con el visor cerrado. */
  readonly index: number | null;
  /** Pide otra imagen (flechas o botones). El índice ya llega dentro de la lista, con vuelta. */
  readonly onIndexChange: (index: number) => void;
  /** El visor se ha cerrado (`Esc` o «Close»). Quien lo abrió devuelve el foco a su sitio. */
  readonly onClose: () => void;
}

/** Índice dentro de la lista, con vuelta: después de la última va la primera y antes de la primera, la última. */
export function wrapIndex(index: number, length: number): number {
  return ((index % length) + length) % length;
}

/**
 * Visor de galería (docs/03-diseno/componentes.md → «Visor de galería»): `<dialog>` modal a pantalla
 * completa con la imagen centrada, contador «3 / 9», flechas y cerrar.
 *
 * - Modal nativo: el resto de la página queda inerte (el foco no sale) y `Esc` lo cierra.
 * - Al abrir, el foco va a «Close»; ← y → cambian de imagen desde cualquier sitio del visor, con vuelta.
 * - La imagen activa se anuncia en una región `status` («3 of 9: texto alternativo»); el contador
 *   visible es solo para la vista. Esa región es también la descripción del diálogo: al abrir, el
 *   lector dice qué imagen es (una región que nace ya llena no se anuncia).
 * - El contenido solo se monta abierto: el HTML pre-renderizado no lleva las imágenes grandes.
 */
export function Lightbox({
  label,
  images,
  index,
  onIndexChange,
  onClose,
}: LightboxProps): ReactNode {
  const t = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const statusId = useId();
  const open = index !== null && images.length > 0;
  const current = open ? images[wrapIndex(index, images.length)] : undefined;
  const position = open ? wrapIndex(index, images.length) + 1 : 0;
  const total = images.length;

  // Antes de pintar: el visor aparece ya abierto y con el foco dentro, sin un frame intermedio.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) {
      dialog.showModal();
      closeRef.current?.focus();
    }
  }, [open]);

  function go(step: number): void {
    if (index === null) return;
    onIndexChange(wrapIndex(index + step, total));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(1);
    }
  }

  const counter = t('lightbox.counter', { n: String(position), total: String(total) });

  return (
    // El teclado del visor (← →) vive en el propio diálogo: funciona tenga el foco el botón que tenga.
    // eslint-disable-next-line jsx-a11y-x/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label={label}
      aria-describedby={statusId}
      onClose={onClose}
      onKeyDown={onKeyDown}
    >
      {current === undefined ? null : (
        <div className={styles.inner}>
          <div className={styles.head}>
            <p className={styles.counter} aria-hidden="true">
              {`${String(position)} / ${String(total)}`}
            </p>
            <ButtonOutline
              ref={closeRef}
              onClick={() => {
                dialogRef.current?.close();
              }}
            >
              {t('lightbox.close')}
            </ButtonOutline>
          </div>
          <figure className={styles.figure}>
            <img
              key={current.src}
              src={current.src}
              width={current.width}
              height={current.height}
              alt={current.alt}
              className={styles.image}
            />
          </figure>
          <VisuallyHidden
            id={statusId}
            role="status"
          >{`${counter}: ${current.alt}`}</VisuallyHidden>
          {total > 1 ? (
            <div className={styles.nav}>
              <ButtonOutline
                aria-label={t('lightbox.prev')}
                onClick={() => {
                  go(-1);
                }}
              >
                <Icon name="arrow-left" size={20} />
              </ButtonOutline>
              <ButtonOutline
                aria-label={t('lightbox.next')}
                onClick={() => {
                  go(1);
                }}
              >
                <Icon name="arrow-right" size={20} />
              </ButtonOutline>
            </div>
          ) : null}
        </div>
      )}
    </dialog>
  );
}
