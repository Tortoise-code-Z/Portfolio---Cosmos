import { useEffect, useRef, type ReactNode, type RefObject } from 'react';

import { CHAPTER_ANCHORS, EPILOGUE, INTERLUDE, type InterludeId } from '~/content/chapters';
import { cx } from '~/lib/css/cx/cx';
import { prefersReducedMotion } from '~/lib/device/reducedMotion/reducedMotion';
import { useT } from '~/lib/i18n/useT/useT';
import { VisuallyHidden } from '~/ui/VisuallyHidden/VisuallyHidden';

import { ChapterJumpLink } from '../ChapterJumpLink/ChapterJumpLink';
import styles from './Transmission.module.css';

/** Canal de color de una transmisión (docs/03-diseno/design-system.md → «Transmisiones»). */
export type TransmissionChannel = 'amber' | 'blue' | 'green';

/**
 * Dónde va la transmisión: un interludio (con «Skip transmission» al capítulo siguiente, el reloj parado en el pie y su
 * cola) o un capítulo que se lee como transmisión, el epílogo (sin salto ni cola: la franja cierra con `stripEnd` y el
 * pie dice `footer`).
 */
type TransmissionPlace =
  | {
      readonly id: InterludeId;
      /** El reloj cósmico, parado: «t ≈ 200 million years». */
      readonly clock: string;
      readonly chapter?: never;
      readonly stripEnd?: never;
      readonly footer?: never;
    }
  | {
      /** Solo el epílogo se lee como transmisión (cualquier otro capítulo repetiría su ancla). */
      readonly chapter: typeof EPILOGUE;
      /** Lo que cierra la franja del canal, en el sitio de «Skip transmission». */
      readonly stripEnd: string;
      /** El pie, entero: «End of journey · 13.8 billion years + now». */
      readonly footer: string;
      readonly id?: never;
      readonly clock?: never;
    };

type TransmissionProps = TransmissionPlace & {
  readonly channel: TransmissionChannel;
  /** «Channel 01 · amber». */
  readonly channelLabel: string;
  /** «Incoming transmission · source located». */
  readonly incoming: string;
  readonly titleId: string;
  /** El título: el nombre de la sección para el lector de pantalla y el destino del foco al llegar. */
  readonly title: string;
  /**
   * Lo que se ve en el sitio del título, si no es el título («T-0» en Mission control): decorativo, con el título
   * escondido para el lector de pantalla. Lleva su propio estilo (lo pinta quien lo pasa).
   */
  readonly titleDisplay?: ReactNode;
  /**
   * Clase propia de la sección, para su composición: puede dar al cuerpo otras columnas con `--_body-columns` (Mission
   * control pone la telemetría a la derecha en escritorio).
   */
  readonly className?: string | undefined;
  /**
   * Sin el velo del canal sobre la escena: la escena se ve entre los bloques, y cada bloque de texto lleva su velo
   * detrás (la franja, el aviso, el título, el pie y lo que pinte quien la usa). El epílogo: el retrato en el centro.
   */
  readonly open?: boolean;
  readonly children: ReactNode;
};

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
 * Una transmisión (fase C · ADR-034; docs/02-experiencia/capitulos/interludio-*.md y 05-crew-file.md): toma la pantalla
 * en el color de su canal, con la franja del canal arriba y el pie con la onda abajo. Un interludio va entre capítulos:
 * detrás, la forma del capítulo de antes, quieta y atenuada (su velo); «Skip transmission» lleva al capítulo que sigue
 * (`INTERLUDE[id].next`), y le sigue su cola, un tramo vacío y sin puntero en el que la escena cambia a la forma
 * siguiente (`JOURNEY_SEGMENTS`). El epílogo es un capítulo (`data-chapter`, con su ancla): sin salto ni cola. Es hija
 * directa de `<main>`: recoge el puntero (las estrellas no).
 */
export function Transmission(props: TransmissionProps): ReactNode {
  const {
    channel,
    channelLabel,
    incoming,
    titleId,
    title,
    titleDisplay,
    className,
    open = false,
    children,
  } = props;
  const t = useT();
  const ref = useTransmissionEntry();
  const interlude = props.id ?? null;

  return (
    <>
      <section
        ref={ref}
        id={
          props.id === undefined
            ? (CHAPTER_ANCHORS[props.chapter] ?? undefined)
            : INTERLUDE[props.id].anchor
        }
        aria-labelledby={titleId}
        className={cx(styles.transmission, styles[channel], open && styles.open, className)}
        data-interlude={interlude ?? undefined}
        data-chapter={props.chapter}
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
          {props.id !== undefined ? (
            // «Skip transmission»: al capítulo siguiente, con el foco en su título.
            <ChapterJumpLink chapter={INTERLUDE[props.id].next} className={styles.skip}>
              {t('interlude.skip')}
              <span aria-hidden="true">↓</span>
            </ChapterJumpLink>
          ) : (
            <span className={styles.stripEnd}>{props.stripEnd}</span>
          )}
        </div>
        <div className={styles.body}>
          <p className={styles.incoming}>
            {/* Un triángulo dibujado: «▸» no está en el subconjunto de IBM Plex Mono (design-system.md → «Iconos»). */}
            <svg className={styles.caret} viewBox="0 0 8 8" aria-hidden="true">
              <path d="M1 0 L8 4 L1 8 Z" />
            </svg>
            {incoming}
          </p>
          {titleDisplay === undefined ? (
            <h2 id={titleId} className={styles.title} tabIndex={-1}>
              {title}
            </h2>
          ) : (
            <h2 id={titleId} className={styles.titleDisplay} tabIndex={-1}>
              <VisuallyHidden>{title}</VisuallyHidden>
              <span aria-hidden="true">{titleDisplay}</span>
            </h2>
          )}
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
          <p>
            {props.id === undefined ? props.footer : t('interlude.clock', { clock: props.clock })}
          </p>
        </footer>
      </section>
      {interlude === null ? null : (
        <div className={styles.tail} data-interlude-tail={interlude} aria-hidden="true" />
      )}
    </>
  );
}
