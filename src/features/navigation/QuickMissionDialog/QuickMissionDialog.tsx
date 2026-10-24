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
import { QUICK_HASH, QUICK_OPENER_ID } from '../quickMission/quickMission';
import styles from './QuickMissionDialog.module.css';

const TITLE_ID = 'quick-mission-title';

/** Si la dirección pide el modo (`/#quick`), lo abre. */
function openFromHash(): void {
  if (window.location.hash === QUICK_HASH) openQuickMission();
}

/**
 * Modo misión rápida (docs/02-experiencia/navegacion.md → «Modo misión rápida»; componentes.md): un
 * `<dialog>` modal a pantalla completa con todo el contenido en una página. El botón de la barra o
 * `/#quick` lo abren; «Back to the journey» y `Esc` lo cierran.
 *
 * - Al abrir, el foco va a «Back to the journey» y la URL pasa a `#quick` sin entrada nueva en el
 *   historial (se puede copiar y enviar); al cerrar, vuelve el ancla que había y el foco al botón de la
 *   barra, también si se entró por `/#quick`.
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

  // `/#quick` al cargar y si el ancla cambia a `#quick` con la página abierta. Al salir del viaje (un
  // enlace del propio modo lleva a un proyecto) se olvida que estaba abierto: al volver no reaparece
  // solo, salvo que la dirección lo pida.
  useEffect(() => {
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => {
      window.removeEventListener('hashchange', openFromHash);
      closeQuickMission();
    };
  }, []);

  // Antes de pintar: el modo aparece ya abierto y con el foco dentro, sin un frame intermedio.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    backRef.current?.focus();
    const { hash } = window.location;
    hashBefore.current = hash === QUICK_HASH ? '' : hash;
    replaceHash(QUICK_HASH);
  }, [open]);

  /** Cierre por `Esc` o por «Back to the journey»: el diálogo ya está cerrado al llegar aquí. */
  function onClose(): void {
    closeQuickMission();
    // Si la dirección ya no es `#quick` (se fue a otra página), no se toca.
    if (window.location.hash === QUICK_HASH) replaceHash(hashBefore.current);
    document.getElementById(QUICK_OPENER_ID)?.focus();
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={TITLE_ID} onClose={onClose}>
      {open ? (
        <div className={styles.inner}>
          <div className={styles.head}>
            <p className={styles.eyebrow}>{t('quick.title')}</p>
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
