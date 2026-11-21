import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router';
import { useStore } from 'zustand';

import {
  CHAPTER_INDICES,
  CHAPTER_STOPS,
  INTERLUDES,
  type ChapterIndex,
  type InterludeId,
} from '~/content/chapters';
import type { UiKey } from '~/content/types';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { sceneStore, selectActiveStop } from '~/stores/sceneStore/sceneStore';

import {
  chapterHref,
  interludeHref,
  onChapterLinkClick,
  onInterludeLinkClick,
} from '../goToChapter/goToChapter';
import styles from './ChapterRail.module.css';

const LABEL_KEYS = {
  0: 'chapter.0',
  1: 'chapter.1',
  2: 'chapter.2',
  3: 'chapter.3',
  4: 'chapter.4',
} as const satisfies Readonly<Record<ChapterIndex, UiKey>>;

const INTERLUDE_LABEL_KEYS = {
  'mission-log': 'interlude.1',
  'mission-control': 'interlude.2',
} as const satisfies Readonly<Record<InterludeId, UiKey>>;

/** Separa «Projects · Cosmic turtle» en sección y escena (docs/01-contenido/textos-sitio.md → «Raíl»). */
export function splitChapterLabel(label: string): { section: string; scene: string } {
  const [section = label, scene = ''] = label.split(' · ');
  return { section, scene };
}

/**
 * Raíl de capítulos (docs/02-experiencia/navegacion.md → «Raíl»; docs/03-diseno/componentes.md):
 * un `<nav>` con una lista ordenada de enlaces, uno por capítulo (`/#about`…). Son enlaces de verdad,
 * como los de la barra: sin JavaScript llevan al ancla y con Ctrl/Cmd abren otra pestaña; en el viaje,
 * un clic normal salta con el foco en el título. Entre capítulos, un rombo por interludio (fase C). El activo
 * (`selectActiveStop`: el interludio mientras se lee o el capítulo `round(m)`) lleva el punto ámbar más grande y
 * `aria-current="step"` (nunca solo el color). Solo se repinta cuando cambia. En
 * escritorio cada enlace lleva sección y escena; en móvil, solo el punto: el nombre accesible es
 * siempre el texto completo («About · Nebula»).
 */
export function ChapterRail(): ReactNode {
  const t = useT();
  const locale = useLocale();
  const active = useStore(sceneStore, selectActiveStop);

  /** Un punto del raíl: sección y escena en escritorio, el punto (o el rombo de un interludio) siempre. */
  const stop = (
    key: string,
    label: string,
    href: string,
    current: boolean,
    onClick: (event: MouseEvent) => void,
    interlude: boolean,
  ): ReactNode => {
    const { section, scene } = splitChapterLabel(label);
    return (
      <li key={key}>
        <Link
          to={href}
          className={styles.link}
          aria-label={label}
          aria-current={current ? 'step' : undefined}
          onClick={onClick}
        >
          <span className={styles.text}>
            <span className={styles.section}>{section}</span>
            <span className={styles.scene}>{scene}</span>
          </span>
          <span className={interlude ? styles.diamond : styles.dot} />
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label={t('rail.label')} className={styles.rail}>
      {/* `role="list"`: Safari quita el rol a una lista sin viñetas (estados-y-accesibilidad.md). */}
      <ol role="list" className={styles.list}>
        {CHAPTER_INDICES.flatMap((index) => [
          stop(
            `chapter-${String(index)}`,
            t(LABEL_KEYS[index]),
            chapterHref(locale, index),
            active === CHAPTER_STOPS[index],
            onChapterLinkClick(index),
            false,
          ),
          ...INTERLUDES.filter((item) => item.after === index).map((item) =>
            stop(
              item.id,
              t(INTERLUDE_LABEL_KEYS[item.id]),
              interludeHref(locale, item.id),
              active === item.id,
              onInterludeLinkClick(item.id),
              true,
            ),
          ),
        ])}
      </ol>
    </nav>
  );
}
