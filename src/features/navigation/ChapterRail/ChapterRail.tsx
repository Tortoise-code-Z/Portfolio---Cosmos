import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useStore } from 'zustand';

import { CHAPTER_INDICES, type ChapterIndex } from '~/content/chapters';
import type { UiKey } from '~/content/types';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { sceneStore, selectActiveChapter } from '~/stores/sceneStore/sceneStore';

import { chapterHref, onChapterLinkClick } from '../goToChapter/goToChapter';
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
 * un `<nav>` con una lista ordenada de enlaces, uno por capítulo (`/#about`…). Son enlaces de verdad,
 * como los de la barra: sin JavaScript llevan al ancla y con Ctrl/Cmd abren otra pestaña; en el viaje,
 * un clic normal salta con el foco en el título. El activo es `round(m)`: punto ámbar más grande y
 * `aria-current="step"` (nunca solo el color). Solo se repinta cuando cambia de capítulo. En
 * escritorio cada enlace lleva sección y escena; en móvil, solo el punto: el nombre accesible es
 * siempre el texto completo («About · Nebula»).
 */
export function ChapterRail(): ReactNode {
  const t = useT();
  const locale = useLocale();
  const active = useStore(sceneStore, selectActiveChapter);

  return (
    <nav aria-label={t('rail.label')} className={styles.rail}>
      {/* `role="list"`: Safari quita el rol a una lista sin viñetas (estados-y-accesibilidad.md). */}
      <ol role="list" className={styles.list}>
        {CHAPTER_INDICES.map((index) => {
          const label = t(LABEL_KEYS[index]);
          const { section, scene } = splitChapterLabel(label);
          return (
            <li key={index}>
              <Link
                to={chapterHref(locale, index)}
                className={styles.link}
                aria-label={label}
                aria-current={index === active ? 'step' : undefined}
                onClick={onChapterLinkClick(index)}
              >
                <span className={styles.text}>
                  <span className={styles.section}>{section}</span>
                  <span className={styles.scene}>{scene}</span>
                </span>
                <span className={styles.dot} />
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
