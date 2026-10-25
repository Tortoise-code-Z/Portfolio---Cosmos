import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';

import { profile } from '~/content/profile';
import { replaceHash } from '~/lib/history/replaceHash/replaceHash';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import {
  closeQuickMission,
  openQuickMission,
  selectQuickMissionOpen,
  useUiStore,
} from '~/stores/uiStore/uiStore';
import { ButtonOutline } from '~/ui/ButtonOutline/ButtonOutline';

import { QuickMissionContent } from '../QuickMissionContent/QuickMissionContent';
import { QUICK_HASH, QUICK_OPENER_ID } from '../quickMission';
import styles from './QuickMissionDialog.module.css';

const TITLE_ID = 'quick-mission-title';
/** El rótulo «Quick mission · everything on one page»: descripción del diálogo (el nombre es el título). */
const EYEBROW_ID = 'quick-mission-eyebrow';

/** El ancla de una dirección (`#projects`, o nada); `''` si no se puede leer. */
function hashOf(url: string): string {
  try {
    return new URL(url).hash;
  } catch {
    return '';
  }
}

/**
 * Modo misión rápida (docs/02-experiencia/navegacion.md → «Modo misión rápida»; componentes.md): un
 * `<dialog>` modal a pantalla completa con todo el contenido en una página. El botón de la barra o
 * `/#quick` lo abren; «Close quick mission» y `Esc` lo cierran.
 *
 * - Al abrir, el foco va a «Close quick mission» y la URL pasa a `#quick` sin entrada nueva en el
 *   historial (se puede copiar y enviar); al cerrar, vuelve el ancla que había y el foco al botón de la
 *   barra, también si se entró por `/#quick`. Si se abrió escribiendo `#quick` en la dirección (entrada
 *   nueva), vuelve el ancla de antes; y si el ancla deja de ser `#quick` (Atrás), se cierra.
 * - El contenido solo se monta abierto: el HTML pre-renderizado no repite el texto del viaje.
 * - Mientras está abierto, el fondo no se desplaza (CSS) y, desde F3, la escena no pinta.
 */
export function QuickMissionDialog(): ReactNode {
  const t = useT();
  const locale = useLocale();
  const open = useUiStore(selectQuickMissionOpen);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  /** Ancla que había al abrir (`#about`, o nada), para dejarla igual al cerrar. */
  const hashBefore = useRef('');
  /** Ancla de antes cuando se abre por un cambio de ancla: al abrir, la dirección ya es `#quick`. */
  const hashBeforeChange = useRef<string | null>(null);

  // `/#quick` al cargar y si el ancla cambia a `#quick` con la página abierta (guardando la de antes);
  // si cambia a otra (Atrás con el modo abierto), se cierra. Al salir del viaje (un enlace del propio
  // modo lleva a un proyecto) se olvida que estaba abierto: al volver no reaparece solo, salvo que la
  // dirección lo pida.
  useEffect(() => {
    function onHashChange(event: HashChangeEvent): void {
      if (window.location.hash !== QUICK_HASH) {
        closeQuickMission();
        return;
      }
      const before = hashOf(event.oldURL);
      hashBeforeChange.current = before === QUICK_HASH ? '' : before;
      openQuickMission();
    }
    if (window.location.hash === QUICK_HASH) openQuickMission();
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      closeQuickMission();
    };
  }, []);

  /** Si este diálogo ya ha pasado por su primer efecto (ver abajo). */
  const mounted = useRef(false);

  // Antes de pintar: el modo aparece ya abierto y con el foco dentro, sin un frame intermedio.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    const firstRun = !mounted.current;
    mounted.current = true;
    // `open` es el del render; el estado vivo manda. En desarrollo, StrictMode repite el efecto recién
    // montado con el mismo `open`, cuando la primera pasada ya lo ha cerrado (abajo): no se reabre.
    if (!open || !useUiStore.getState().quickMissionOpen) {
      if (dialog.open) dialog.close();
      return;
    }
    // Un enlace del modo lleva a otra página que también lo monta (un proyecto): el estado sigue
    // abierto al pintarla, pero la dirección ya no pide el modo. Se cierra en vez de reabrirlo allí.
    if (firstRun && window.location.hash !== QUICK_HASH) {
      closeQuickMission();
      return;
    }
    if (!dialog.open) dialog.showModal();
    backRef.current?.focus();
    const { hash } = window.location;
    hashBefore.current = hashBeforeChange.current ?? (hash === QUICK_HASH ? '' : hash);
    hashBeforeChange.current = null;
    replaceHash(QUICK_HASH);
  }, [open]);

  /** Cierre por `Esc` o por «Close quick mission»: el diálogo ya está cerrado al llegar aquí. */
  function onClose(): void {
    closeQuickMission();
    // Si la dirección ya no es `#quick` (se fue a otra página), no se toca.
    if (window.location.hash === QUICK_HASH) replaceHash(hashBefore.current);
    document.getElementById(QUICK_OPENER_ID)?.focus();
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={TITLE_ID}
      aria-describedby={EYEBROW_ID}
      onClose={onClose}
    >
      {open ? (
        <div className={styles.inner}>
          <div className={styles.head}>
            <p id={EYEBROW_ID} className={styles.eyebrow}>
              {t('quick.title')}
            </p>
            <ButtonOutline
              ref={backRef}
              onClick={() => {
                dialogRef.current?.close();
              }}
            >
              {t('quick.back')}
            </ButtonOutline>
          </div>
          <h2 id={TITLE_ID} className={styles.title}>
            {`${profile.name} · ${profile.role[locale]}`}
          </h2>
          <QuickMissionContent />
        </div>
      ) : null}
    </dialog>
  );
}
