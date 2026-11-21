import { useEffect, useRef, type MouseEvent, type ReactNode, type RefObject } from 'react';
import { Link } from 'react-router';

import { chapterHash, INTERLUDE, type InterludeId } from '~/content/chapters';
import { cx } from '~/lib/css/cx/cx';
import { prefersReducedMotion } from '~/lib/device/reducedMotion/reducedMotion';
import { isPlainClick } from '~/lib/events/isPlainClick/isPlainClick';
import { homePath } from '~/lib/i18n/paths/paths';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { jumpToChapter } from '~/lib/scroll/jumpToChapter/jumpToChapter';

import { findChapter } from '../chapterDom/chapterDom';
import styles from './Transmission.module.css';

/** Canal de color de una transmisión (docs/03-diseno/design-system.md → «Transmisiones»). */
export type TransmissionChannel = 'amber';

interface TransmissionProps {
  readonly id: InterludeId;
  /** Ancla de la sección (la misma en los dos idiomas). */
  readonly anchor: string;
  readonly channel: TransmissionChannel;
  /** «Channel 01 · amber». */
  readonly channelLabel: string;
  /** «Incoming transmission · source located». */
  readonly incoming: string;
  readonly titleId: string;
  readonly title: string;
  /** El reloj cósmico, parado: «t ≈ 200 million years». */
  readonly clock: string;
  readonly children: ReactNode;
}

/**
 * Cuándo se enciende una transmisión: cuando su borde de arriba pasa el 80 % de la ventana (un 20 % de la ventana
 * dentro), mida lo que mida la sección. Con un umbral en proporción de la sección, una muy alta (móvil apaisado, texto
 * al 200 %) no llegaría nunca y su texto se quedaría tapado.
 */
export const TRANSMISSION_ENTRY: IntersectionObserverInit = {
  threshold: 0,
  rootMargin: '0px 0px -20% 0px',
};

/**
 * La entrada de la transmisión, una vez: con JavaScript y sin movimiento reducido, la sección se «arma» al montar
 * (`data-armed`: el teletipo esconde sus líneas) y se «enciende» al entrar en la pantalla (`data-on`: barrido y
 * líneas una a una; `TRANSMISSION_ENTRY`). Sin JavaScript o con movimiento reducido no se arma: todo se ve quieto
 * desde el principio. Solo decoración: el texto está entero en el DOM siempre (y al imprimir se ve).
 */
function useTransmissionEntry(): RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = ref.current;
    if (section === null || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    section.dataset.armed = '';
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        section.dataset.on = '';
        observer.disconnect();
      }
    }, TRANSMISSION_ENTRY);
    observer.observe(section);
    return () => {
      observer.disconnect();
      delete section.dataset.armed;
      delete section.dataset.on;
    };
  }, []);
  return ref;
}

/**
 * Una transmisión entre capítulos (interludio, fase C · ADR-034; docs/02-experiencia/capitulos/interludio-*.md):
 * toma la pantalla en el color de su canal, con la franja del canal y «Skip transmission», y detrás la forma del
 * capítulo de antes, quieta y atenuada (su velo). «Skip transmission» lleva al capítulo que sigue (`INTERLUDE[id].next`).
 * Le sigue su cola: un tramo vacío y sin puntero en el que la escena cambia a la forma siguiente (`JOURNEY_SEGMENTS`).
 * Es hija directa de `<main>`: recoge el puntero (las estrellas no).
 */
export function Transmission({
  id,
  anchor,
  channel,
  channelLabel,
  incoming,
  titleId,
  title,
  clock,
  children,
}: TransmissionProps): ReactNode {
  const t = useT();
  const locale = useLocale();
  const ref = useTransmissionEntry();
  const { next } = INTERLUDE[id];
  const skipHash = chapterHash(next);

  /** «Skip transmission»: salta al capítulo siguiente con el foco en su título; con otro clic, el enlace navega. */
  const onSkip = (event: MouseEvent): void => {
    if (!isPlainClick(event)) return;
    const chapter = findChapter(next);
    if (chapter === null) return;
    event.preventDefault();
    jumpToChapter(chapter, { hash: skipHash });
  };

  return (
    <>
      <section
        ref={ref}
        id={anchor}
        aria-labelledby={titleId}
        className={cx(styles.transmission, styles[channel])}
        data-interlude={id}
      >
        <div className={styles.strip}>
          <span className={styles.channel}>
            <span className={styles.signal} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            {channelLabel}
          </span>
          <Link to={`${homePath(locale)}${skipHash}`} className={styles.skip} onClick={onSkip}>
            {t('interlude.skip')}
            <span aria-hidden="true">↓</span>
          </Link>
        </div>
        <div className={styles.body}>
          <p className={styles.incoming}>
            {/* Un triángulo dibujado: «▸» no está en el subconjunto de IBM Plex Mono (design-system.md → «Iconos»). */}
            <svg className={styles.caret} viewBox="0 0 8 8" aria-hidden="true">
              <path d="M1 0 L8 4 L1 8 Z" />
            </svg>
            {incoming}
          </p>
          <h2 id={titleId} className={styles.title} tabIndex={-1}>
            {title}
          </h2>
          {children}
        </div>
        <footer className={styles.footer}>
          <svg
            className={styles.wave}
            viewBox="0 0 240 24"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 12 Q 10 2 20 12 T 40 12 T 60 12 T 80 12 T 100 12 T 120 12 T 140 12 T 160 12 T 180 12 T 200 12 T 220 12 T 240 12" />
          </svg>
          <p>{t('interlude.clock', { clock })}</p>
        </footer>
      </section>
      <div className={styles.tail} data-interlude-tail={id} aria-hidden="true" />
    </>
  );
}
