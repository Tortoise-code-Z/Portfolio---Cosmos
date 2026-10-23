import type { ReactNode } from 'react';
import { useStore } from 'zustand';

import { CHAPTER_INDICES, type ChapterIndex } from '~/content/chapters';
import type { UiKey } from '~/content/types';
import { useT } from '~/lib/i18n/useT/useT';
import { sceneStore, selectActiveChapter } from '~/stores/sceneStore/sceneStore';

import { goToChapter } from '../goToChapter/goToChapter';
import styles from './ChapterRail.module.css';

const LABEL_KEYS = {
  0: 'chapter.0',
  1: 'chapter.1',
  2: 'chapter.2',
  3: 'chapter.3',
  4: 'chapter.4',
} as const satisfies Readonly<Record<ChapterIndex, UiKey>>;

/** Separa «Projects · Cosmic turtle» en sección y escena (docs/01-contenido/textos-sitio.md → «Raíl»). */
export function splitChapterLabel(label: string): { section: string; scene: string } {
  const [section = label, scene = ''] = label.split(' · ');
  return { section, scene };
}

/**
 * Raíl de capítulos (docs/02-experiencia/navegacion.md → «Raíl»; docs/03-diseno/componentes.md):
 * un `<nav>` con una lista ordenada de botones, uno por capítulo. El activo es `round(m)`: punto ámbar
 * más grande y `aria-current="step"` (nunca solo el color). Solo se repinta cuando cambia de capítulo.
 * En escritorio cada botón lleva sección y escena; en móvil, solo el punto: el nombre accesible es
 * siempre el texto completo («About · Nebula»).
 */
export function ChapterRail(): ReactNode {
  const t = useT();
  const active = useStore(sceneStore, selectActiveChapter);

  return (
    <nav aria-label={t('rail.label')} className={styles.rail}>
      <ol className={styles.list}>
        {CHAPTER_INDICES.map((index) => {
          const label = t(LABEL_KEYS[index]);
          const { section, scene } = splitChapterLabel(label);
          return (
            <li key={index}>
              <button
                type="button"
                className={styles.button}
                aria-label={label}
                aria-current={index === active ? 'step' : undefined}
                onClick={() => {
                  goToChapter(index);
                }}
              >
                <span className={styles.text}>
                  <span className={styles.section}>{section}</span>
                  <span className={styles.scene}>{scene}</span>
                </span>
                <span className={styles.dot} />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
