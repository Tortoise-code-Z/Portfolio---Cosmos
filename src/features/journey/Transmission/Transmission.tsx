import { useEffect, useRef, type ReactNode, type RefObject } from 'react';

import { CHAPTER_ANCHORS, EPILOGUE, INTERLUDE, type InterludeId } from '~/content/chapters';
import { cx } from '~/lib/css/cx/cx';
import { prefersReducedMotion } from '~/lib/device/reducedMotion/reducedMotion';
import { useT } from '~/lib/i18n/useT/useT';
import { stageFocusScroll } from '~/lib/scroll/stageFocus/stageFocus';
import { LANDING_SELECTOR } from '~/lib/scroll/jumpToChapter/jumpToChapter';
import { VisuallyHidden } from '~/ui/VisuallyHidden/VisuallyHidden';

import { ChapterJumpLink } from '../ChapterJumpLink/ChapterJumpLink';
import {
  isTabFocus,
  useArrivalChoreography,
} from '../useArrivalChoreography/useArrivalChoreography';
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
 * desde el principio. Solo decoración: el texto está entero en el DOM siempre (y al imprimir se ve). Una sección con
 * llegada no la usa (`enabled`): la arma y la enciende su coreografía, al encajar (`useArrivalChoreography`).
 */
function useTransmissionEntry(enabled: boolean): RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = ref.current;
    if (
      !enabled ||
      section === null ||
      prefersReducedMotion() ||
      typeof IntersectionObserver === 'undefined'
    ) {
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
  }, [enabled]);
  return ref;
}

/** Un número de un estilo calculado, o 0 si no lo es. */
function cssNumber(value: string): number {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

/** Cómo se encuentra el escenario de una sección con llegada (lo que se queda fijo mientras dura). */
const STAGE_SELECTOR = '[data-stage]';

/** Cuántos frames se mira después del foco (medio segundo a 60 fps): ver `useArrivalFocus`. */
const ARRIVAL_FOCUS_FRAMES = 30;

/** Lo que hace el usuario que corta esa vigilancia: mover la página o tocar otra cosa (una tecla que no sea Tab). */
const USER_MOVES = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;

/**
 * El foco con Tab en una sección con llegada (ADR-039): mientras dura la llegada su escenario está pegado bajo la barra
 * y lo que cae por debajo de la ventana no sube con el scroll, así que el navegador no consigue enseñar lo que se
 * enfoca allí. Si queda fuera de la vista (con su anillo y el `scroll-padding` de arriba y de abajo), se va al final de
 * la llegada (donde el escenario se suelta) y lo justo más allá para que se vea entero (`stageFocusScroll`). Se mira en
 * los frames que siguen al foco (`ARRIVAL_FOCUS_FRAMES`), no solo en el primero: WebKit hace su propio scroll del foco
 * después (en el CI, a ~3 fps, lo dejaba justo en el borde de abajo, con el anillo fuera). Si el usuario mueve la
 * página entre tanto (`USER_MOVES`), se deja de mirar. Solo actúa con el Tab (`isTabFocus`) y si hay llegada: con
 * movimiento reducido el hueco mide 0 (lo decide el CSS) y el escenario nunca se pega.
 */
function useArrivalFocus(ref: RefObject<HTMLElement | null>, arriving: boolean): void {
  useEffect(() => {
    const section = ref.current;
    if (!arriving || section === null) return undefined;
    let frame = 0;
    const stop = (): void => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const place = (): void => {
      const element = document.activeElement;
      const stage = section.querySelector<HTMLElement>(STAGE_SELECTOR);
      const landing = section.querySelector<HTMLElement>(LANDING_SELECTOR);
      if (!isTabFocus(element) || stage === null || landing === null) return;
      if (!stage.contains(element) || landing.offsetTop === 0) return;
      const root = getComputedStyle(document.documentElement);
      const bar = cssNumber(root.scrollPaddingBlockStart);
      const end = cssNumber(root.scrollPaddingBlockEnd);
      const margin =
        cssNumber(root.getPropertyValue('--focus-offset')) +
        cssNumber(root.getPropertyValue('--focus-width'));
      const box = element.getBoundingClientRect();
      if (box.top - margin >= bar && box.bottom + margin <= window.innerHeight - end) return;
      const top = stageFocusScroll({
        landingY: landing.getBoundingClientRect().top + window.scrollY,
        offset: box.top - stage.getBoundingClientRect().top,
        height: box.height,
        bar,
        end,
        viewport: window.innerHeight,
        margin,
      });
      // `auto` y no `instant` (que no todos los motores entienden): el CSS no pide scroll suave.
      window.scrollTo({ top, behavior: 'auto' });
    };
    const onFocus = (event: FocusEvent): void => {
      stop();
      if (!isTabFocus(event.target instanceof Element ? event.target : null)) return;
      let left = ARRIVAL_FOCUS_FRAMES;
      const tick = (): void => {
        place();
        left -= 1;
        frame = left > 0 ? requestAnimationFrame(tick) : 0;
      };
      frame = requestAnimationFrame(tick);
    };
    const onUserMove = (event: Event): void => {
      if (event instanceof KeyboardEvent && event.key === 'Tab') return;
      stop();
    };
    section.addEventListener('focusin', onFocus);
    for (const type of USER_MOVES) {
      window.addEventListener(type, onUserMove, { passive: true });
    }
    return () => {
      section.removeEventListener('focusin', onFocus);
      for (const type of USER_MOVES) window.removeEventListener(type, onUserMove);
      stop();
    };
  }, [ref, arriving]);
}

/**
 * Una transmisión (fase C · ADR-034; docs/02-experiencia/capitulos/interludio-*.md y 05-crew-file.md): toma la pantalla
 * en el color de su canal, con la franja del canal arriba y el pie con la onda abajo. Un interludio va entre capítulos:
 * detrás, la forma del capítulo de antes, quieta y atenuada (su velo); «Skip transmission» lleva al capítulo que sigue
 * (`INTERLUDE[id].next`), y le sigue su cola, un tramo vacío y sin puntero en el que la escena cambia a la forma
 * siguiente (`JOURNEY_SEGMENTS`). El epílogo es un capítulo (`data-chapter`): sin salto ni cola, pero con su llegada
 * (ADR-039): su contenido va en un escenario fijo mientras pasa un hueco (la escena trae el retrato) y su ancla está en
 * el marcador del final de la llegada (`data-landing`), donde aterrizan el ancla y los saltos. Mientras llega, el haz la
 * revela y las esquinas se cierran sobre su destino (`useArrivalChoreography`, C.7). Es hija directa de `<main>`:
 * recoge el puntero (las estrellas no).
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
  const interlude = props.id ?? null;
  const ref = useTransmissionEntry(interlude !== null);
  useArrivalFocus(ref, interlude === null);
  useArrivalChoreography(ref, interlude === null);

  const content = (
    <>
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
    </>
  );

  return (
    <>
      <section
        ref={ref}
        id={props.id === undefined ? undefined : INTERLUDE[props.id].anchor}
        aria-labelledby={titleId}
        className={cx(
          styles.transmission,
          styles[channel],
          open && styles.open,
          props.id === undefined && styles.arriving,
          className,
        )}
        data-interlude={interlude ?? undefined}
        data-chapter={props.chapter}
      >
        {props.id !== undefined ? (
          content
        ) : (
          <>
            {/*
             * El final de la llegada, con el ancla del capítulo: aquí aterrizan el ancla y los saltos. Cae donde acaba
             * el hueco (posición absoluta), pero va primero en el DOM: quien entra por el ancla (`/#crew-file`) sigue con
             * Tab por el escenario, no después de él.
             */}
            <span
              id={CHAPTER_ANCHORS[props.chapter] ?? undefined}
              className={styles.landing}
              data-landing=""
              aria-hidden="true"
            />
            {/*
             * La llegada (ADR-039): el escenario se queda fijo mientras pasa el hueco de debajo. Dentro, la pantalla de
             * la transmisión (lo que el haz revela, `data-screen`) y, encima, lo que pinta la coreografía sin recortarse:
             * la línea del haz y las esquinas que se cierran sobre el destino (`useArrivalChoreography`).
             */}
            <div className={styles.stage} data-stage="">
              <div className={styles.screen} data-screen="">
                {content}
              </div>
              <div className={styles.arrivalMarks} aria-hidden="true">
                <div className={styles.beam} />
                <div className={styles.corners}>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
            <div className={styles.arrivalSpace} aria-hidden="true" />
          </>
        )}
      </section>
      {interlude === null ? null : (
        <div className={styles.tail} data-interlude-tail={interlude} aria-hidden="true" />
      )}
    </>
  );
}
