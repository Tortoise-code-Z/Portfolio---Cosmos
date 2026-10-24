import { useEffect, useRef, type ReactNode } from 'react';

import { useHeightVar } from '~/lib/css/useHeightVar/useHeightVar';

import styles from './Notice.module.css';

interface NoticeProps {
  /** Si se ve. La región viva existe siempre: lo que aparece dentro se anuncia sin mover el foco. */
  readonly open: boolean;
  /** Idioma del aviso si no es el de la página (la sugerencia de idioma habla en el que ofrece). */
  readonly lang?: string | undefined;
  /** Texto y acciones (un enlace, «No, thanks»). */
  readonly children: ReactNode;
}

/**
 * Aviso (docs/03-diseno/componentes.md → «Aviso»): barra flotante abajo, en mono, con velo y borde, y
 * descartable por quien lo usa. No roba el foco ni tapa la barra superior. Uso: sugerencia de idioma y,
 * desde F3, «sin WebGL».
 */
export function Notice({ open, lang, children }: NoticeProps): ReactNode {
  return (
    <div role="status" lang={lang}>
      {open ? <NoticeBox>{children}</NoticeBox> : null}
    </div>
  );
}

/**
 * La caja visible. Mientras existe, su altura va a `--_notice-h` en `<html>`: el documento la suma al
 * hueco de abajo que deja libre al llevar el foco, y nada enfocado queda debajo del aviso (WCAG 2.4.11).
 */
function NoticeBox({ children }: { readonly children: ReactNode }): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  useHeightVar(ref, '--_notice-h', 'root');
  useKeepFocusAbove(ref);
  return (
    <div ref={ref} className={styles.notice}>
      {children}
    </div>
  );
}

/**
 * Red para los navegadores que no miran el `scroll-padding` al decidir si lo enfocado ya se ve (Firefox:
 * un elemento dentro de la ventana, pero debajo del aviso, no hace scroll). Tras cada cambio de foco, si
 * lo enfocado queda dentro del hueco de abajo y a la altura del aviso, sube la página lo justo. Donde el
 * navegador ya lo hace (Chromium), no hay nada que subir.
 */
function useKeepFocusAbove(notice: { readonly current: HTMLElement | null }): void {
  useEffect(() => {
    let frame = 0;
    function check(): void {
      const box = notice.current?.getBoundingClientRect();
      const element = document.activeElement;
      if (box === undefined || !(element instanceof HTMLElement)) return;
      if (notice.current?.contains(element) === true) return;
      const rect = element.getBoundingClientRect();
      const room = Number.parseFloat(
        getComputedStyle(document.documentElement).scrollPaddingBlockEnd,
      );
      const limit = window.innerHeight - (Number.isNaN(room) ? 0 : room);
      const sideBySide = rect.right <= box.left || rect.left >= box.right;
      if (rect.bottom <= limit || rect.top >= box.bottom || sideBySide) return;
      window.scrollBy({ top: rect.bottom - limit, behavior: 'instant' });
    }
    function onFocusIn(): void {
      cancelAnimationFrame(frame);
      // Después del scroll que el propio navegador hace al enfocar.
      frame = requestAnimationFrame(check);
    }
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      cancelAnimationFrame(frame);
    };
  }, [notice]);
}
