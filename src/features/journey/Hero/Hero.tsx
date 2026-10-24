import { useCallback, useEffect, useRef, type ReactNode } from 'react';

import { CHAPTER_ANCHORS } from '~/content/chapters';
import { profile } from '~/content/profile';
import { useHoldCharge } from '~/lib/hold/useHoldCharge/useHoldCharge';
import { useT } from '~/lib/i18n/useT/useT';
import { jumpToChapter } from '~/lib/scroll/jumpToChapter/jumpToChapter';
import { HoldButton } from '~/ui/HoldButton/HoldButton';
import { Icon } from '~/ui/Icon/Icon';

import { ChapterSection } from '../ChapterSection/ChapterSection';
import { HERO_TITLE_ID } from '../chapterDom/chapterDom';
import { Eyebrow } from '../Eyebrow/Eyebrow';
import styles from './Hero.module.css';

const preventDefault = (event: Event): void => {
  event.preventDefault();
};

/**
 * Capítulo 0 · Singularidad (docs/02-experiencia/capitulos/00-singularidad.md). Sin escena: el punto
 * y su halo son CSS. Mantener pulsado el botón (o la zona vacía del hero) 1,5 s detona y lleva a
 * «About», con el foco en su título; los efectos (temblor, destello, eje `wdth`) llegan con la escena.
 */
export function Hero(): ReactNode {
  const t = useT();
  const areaRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const onDetonate = useCallback((): void => {
    const about = CHAPTER_ANCHORS[1];
    if (about === null) return;
    const chapter = document.getElementById(about);
    if (chapter === null) return;
    jumpToChapter(chapter);
  }, []);

  const { detonated, press, release } = useHoldCharge(buttonRef, onDetonate);

  // Mantener pulsado en la zona vacía del hero también carga. Solo la zona misma: sobre el texto se
  // selecciona (y en táctil el toque largo es del sistema) y lo pulsable tiene su propio gesto.
  useEffect(() => {
    const area = areaRef.current;
    if (area === null) return undefined;
    // Un gesto = un puntero: con varios dedos manda el que empezó. Sus escuchas de `window` se quitan
    // juntas al acabar (soltar o cancelar), así que ninguna queda colgada para el gesto siguiente.
    let gesture: AbortController | null = null;
    let pointerId: number | null = null;
    const endGesture = (event: PointerEvent): void => {
      if (event.pointerId !== pointerId) return;
      gesture?.abort();
      gesture = null;
      pointerId = null;
      release();
    };
    const onPointerDown = (event: PointerEvent): void => {
      if (event.button !== 0 || event.target !== area) return;
      if (pointerId !== null && pointerId !== event.pointerId) return;
      gesture?.abort();
      gesture = new AbortController();
      pointerId = event.pointerId;
      const { signal } = gesture;
      window.addEventListener('pointerup', endGesture, { signal });
      window.addEventListener('pointercancel', endGesture, { signal });
      // Mientras carga, el toque largo no abre el menú contextual.
      window.addEventListener('contextmenu', preventDefault, { signal });
      press();
    };
    area.addEventListener('pointerdown', onPointerDown);
    return () => {
      area.removeEventListener('pointerdown', onPointerDown);
      gesture?.abort();
    };
  }, [press, release]);

  const [firstName, ...rest] = profile.name.split(' ');

  return (
    <ChapterSection index={0} labelledBy={HERO_TITLE_ID}>
      <div className={styles.singularity} aria-hidden="true">
        <span className={styles.halo} />
        <span className={styles.core} />
      </div>
      <div ref={areaRef} className={styles.inner}>
        <Eyebrow text={t('hero.kicker')} />
        <h1 id={HERO_TITLE_ID} className={styles.name} tabIndex={-1}>
          <span className={styles.line}>{firstName ?? ''}</span>{' '}
          <span className={styles.indent}>{rest.join(' ')}</span>
        </h1>
        <div className={styles.row}>
          <p className={styles.lead}>{t('hero.lead')}</p>
          <HoldButton
            ref={buttonRef}
            className={styles.detonate}
            label={t('hero.detonate')}
            description={t('hero.detonate.aria')}
            done={detonated}
            onPress={press}
            onRelease={release}
          />
          <p className={styles.hint}>
            {t('hero.scroll')} <Icon name="arrow-down" />
          </p>
        </div>
      </div>
    </ChapterSection>
  );
}
