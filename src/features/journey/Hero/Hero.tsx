import { useCallback, useEffect, useRef, type ReactNode } from 'react';

import { CHAPTER_ANCHORS } from '~/content/chapters';
import { profile } from '~/content/profile';
import { jumpBehavior } from '~/lib/device/reducedMotion/reducedMotion';
import { useHoldCharge } from '~/lib/hold/useHoldCharge/useHoldCharge';
import { useT } from '~/lib/i18n/useT/useT';
import { HoldButton } from '~/ui/HoldButton/HoldButton';
import { Icon } from '~/ui/Icon/Icon';

import { ChapterSection } from '../ChapterSection/ChapterSection';
import { Eyebrow } from '../Eyebrow/Eyebrow';
import styles from './Hero.module.css';

const TITLE_ID = 'hero-title';

/** Lo pulsable del hero: mantener pulsado encima no carga la detonación (lo hace su propio gesto). */
const INTERACTIVE = 'a, button, input, select, textarea, [tabindex]';

/**
 * Capítulo 0 · Singularidad (docs/02-experiencia/capitulos/00-singularidad.md). Sin escena: el punto
 * y su halo son CSS. Mantener pulsado el botón (o una zona vacía del hero) 1,5 s detona y lleva a
 * «About»; los efectos (temblor, destello, eje `wdth`) llegan con la escena.
 */
export function Hero(): ReactNode {
  const t = useT();
  const areaRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const onDetonate = useCallback((): void => {
    const about = CHAPTER_ANCHORS[1];
    if (about === null) return;
    document.getElementById(about)?.scrollIntoView({ behavior: jumpBehavior(), block: 'start' });
  }, []);

  const { detonated, press, release } = useHoldCharge(buttonRef, onDetonate);

  // Mantener pulsado en una zona vacía del hero también carga (no sobre enlaces ni botones).
  useEffect(() => {
    const area = areaRef.current;
    if (area === null) return undefined;
    const onPointerDown = (event: PointerEvent): void => {
      if (event.button !== 0) return;
      if (event.target instanceof Element && event.target.closest(INTERACTIVE) !== null) return;
      press();
      window.addEventListener('pointerup', release, { once: true });
      window.addEventListener('pointercancel', release, { once: true });
    };
    area.addEventListener('pointerdown', onPointerDown);
    return () => {
      area.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, [press, release]);

  const [firstName, ...rest] = profile.name.split(' ');

  return (
    <ChapterSection index={0} labelledBy={TITLE_ID}>
      <div className={styles.singularity} aria-hidden="true">
        <span className={styles.halo} />
        <span className={styles.core} />
      </div>
      <div ref={areaRef} className={styles.inner}>
        <Eyebrow text={t('hero.kicker')} />
        <h1 id={TITLE_ID} className={styles.name}>
          <span className={styles.line}>{firstName ?? ''}</span>{' '}
          <span className={styles.indent}>{rest.join(' ')}</span>
        </h1>
        <div className={styles.row}>
          <p className={styles.lead}>{t('hero.lead')}</p>
          <HoldButton
            ref={buttonRef}
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
