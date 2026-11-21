import type { CSSProperties, ReactNode } from 'react';

import { INTERLUDE } from '~/content/chapters';
import { siteTelemetry } from '~/content/telemetry';
import { AUDIT_LOOP, browserName, LAUNCH_SEQUENCE, type LaunchStepId } from '~/content/workflow';
import { cx } from '~/lib/css/cx/cx';
import { formatList, formatMonth, formatNumber } from '~/lib/i18n/format/format';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { Icon } from '~/ui/Icon/Icon';
import { VisuallyHidden } from '~/ui/VisuallyHidden/VisuallyHidden';

import { BlinkCursor } from '../BlinkCursor/BlinkCursor';
import { ChapterJumpLink } from '../ChapterJumpLink/ChapterJumpLink';
import { Transmission } from '../Transmission/Transmission';
import styles from './MissionControl.module.css';

const TITLE_ID = 'mission-control-title';
const SEQUENCE_ID = 'mission-control-sequence';
const TELEMETRY_ID = 'mission-control-telemetry';
const SEPARATOR = ' · ';

/** Variables privadas de estilo (`--_x`): el orden del teletipo y dónde caen la cota y el bucle del esquema. */
function vars(values: Readonly<Record<string, number>>): CSSProperties {
  return Object.fromEntries(Object.entries(values).map(([name, value]) => [`--_${name}`, value]));
}

/** Posición de un paso en la secuencia (desde 1, como las columnas del esquema). */
function column(id: LaunchStepId): number {
  return LAUNCH_SEQUENCE.findIndex((step) => step.id === id) + 1;
}

/**
 * Interludio 2 · Mission control (docs/02-experiencia/capitulos/interludio-2-mission-control.md): cómo trabaja Víctor,
 * en el canal azul. Un «T-0» enorme (decorativo: el título es «How I work»), la frase, la secuencia de lanzamiento como
 * lista ordenada (la cota «no code yet» y el bucle de la auditoría son dibujo, con su texto en la lista), la telemetría
 * del propio repo (contada al construir, ADR-035) y «Touchdown», que lleva a Contacto.
 */
export function MissionControl(): ReactNode {
  const t = useT();
  const locale = useLocale();
  const { next } = INTERLUDE['mission-control'];
  const browsers = formatList(locale, siteTelemetry.browsers.map(browserName), 'conjunction');
  const figures = [
    [t('missionControl.unitTests'), siteTelemetry.unitTests],
    [t('missionControl.e2eTests'), siteTelemetry.e2eTests],
    [t('missionControl.browsers'), siteTelemetry.browsers.length],
    [t('missionControl.decisions'), siteTelemetry.decisions],
  ] as const;
  const firstFigureLine = LAUNCH_SEQUENCE.length;
  const beforeCode = LAUNCH_SEQUENCE.filter((step) => step.beforeCode).length;
  const loopStart = column(AUDIT_LOOP.to);

  return (
    <Transmission
      id="mission-control"
      anchor={INTERLUDE['mission-control'].anchor}
      channel="blue"
      channelLabel={t('missionControl.channel')}
      incoming={t('missionControl.incoming')}
      titleId={TITLE_ID}
      title={t('missionControl.title')}
      titleDisplay={
        <span className={styles.countdown}>{t('missionControl.countdown', { n: '0' })}</span>
      }
      clock={t('missionControl.clock')}
      className={styles.missionControl}
    >
      <p className={styles.lead}>{t('missionControl.lead')}</p>

      <section
        aria-labelledby={SEQUENCE_ID}
        className={styles.sequence}
        style={vars({ steps: LAUNCH_SEQUENCE.length })}
      >
        <h3 id={SEQUENCE_ID} className={styles.heading}>
          {t('missionControl.sequence')}
        </h3>
        {beforeCode === 0 ? null : (
          <div className={styles.bracket} aria-hidden="true" style={vars({ span: beforeCode })}>
            <span className={styles.bracketMark} />
            <span className={styles.bracketLabel}>{t('missionControl.noCode')}</span>
          </div>
        )}
        <ol role="list" aria-labelledby={SEQUENCE_ID} className={styles.steps}>
          {LAUNCH_SEQUENCE.map((step, index) => (
            <li
              key={step.id}
              className={cx(styles.step, step.id === AUDIT_LOOP.to && styles.loopsBack)}
            >
              <div
                className={cx(styles.box, step.countdown === 0 && styles.launch)}
                data-line=""
                style={vars({ line: index })}
              >
                {/* Los espacios separan las piezas al copiar, en modo lectura o sin CSS (P1); en la rejilla no se pintan. */}
                <span className={styles.stepCountdown}>
                  {t('missionControl.countdown', { n: String(step.countdown) })}
                </span>{' '}
                <span className={styles.stepName}>{t(step.name)}</span>{' '}
                <span className={styles.stepDetail}>{t(step.detail, { browsers })}</span>
                {step.id === AUDIT_LOOP.from ? (
                  <>
                    {' '}
                    <VisuallyHidden>{t('missionControl.loop')}.</VisuallyHidden>
                  </>
                ) : null}
              </div>
              {step.id === AUDIT_LOOP.to ? (
                <span className={styles.loopNote} aria-hidden="true">
                  ↓ · ↑ {t('missionControl.loop')}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        <div
          className={styles.loop}
          aria-hidden="true"
          style={vars({ from: loopStart, span: column(AUDIT_LOOP.from) - loopStart + 1 })}
        >
          <span className={styles.loopMark} />
          <span className={styles.loopLabel}>{t('missionControl.loop')}</span>
        </div>
      </section>

      <section aria-labelledby={TELEMETRY_ID} className={styles.telemetry}>
        {/* Solo el mes cambia con el tiempo: va aparte, y la captura tapa eso y no el rótulo (`data-telemetry`). */}
        <h3 id={TELEMETRY_ID} className={styles.heading}>
          {t('missionControl.telemetry')}
          {SEPARATOR}
          <span data-telemetry="">{formatMonth(locale, siteTelemetry.month)}</span>
        </h3>
        <dl className={styles.figures}>
          {figures.map(([label, value], index) => (
            <div
              key={label}
              className={styles.figure}
              data-line=""
              style={vars({ line: firstFigureLine + index })}
            >
              <dt>{label}</dt>
              <dd data-telemetry="">{formatNumber(locale, value)}</dd>
            </div>
          ))}
        </dl>
        <p
          className={styles.copilot}
          data-line=""
          style={vars({ line: firstFigureLine + figures.length })}
        >
          <span aria-hidden="true">&gt; </span>
          {t('missionControl.copilot')}
          <BlinkCursor />
        </p>
      </section>

      <p className={styles.touchdown}>
        <ChapterJumpLink chapter={next} className={styles.touchdownLink}>
          {/* «T-0 →»: dibujo (la flecha es el icono: «→» no está en el subconjunto de las fuentes, design-system.md →
              «Iconos»). El nombre del enlace es «Touchdown · Contact». */}
          <span className={styles.touchdownCountdown} aria-hidden="true">
            {t('missionControl.countdown', { n: '0' })}
            <Icon name="arrow-right" />
          </span>
          {t('missionControl.touchdown')}
          <span aria-hidden="true">↓</span>
        </ChapterJumpLink>
      </p>
    </Transmission>
  );
}
