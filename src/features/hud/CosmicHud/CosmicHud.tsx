import { useEffect, useRef, type ReactNode } from 'react';

import { useLocale } from '~/lib/i18n/useT/useT';
import { activeChapter, sceneStore, type SceneState } from '~/stores/sceneStore/sceneStore';

import { cosmicClock, cosmicScale } from '../cosmicClock/cosmicClock';
import styles from './CosmicHud.module.css';

/**
 * HUD: reloj cósmico y escala del capítulo (docs/02-experiencia/navegacion.md → «HUD»). Es decorativo
 * (`aria-hidden`): cada capítulo dice lo mismo en su eyebrow. Lee `m` de `sceneStore` por suscripción y
 * escribe en el DOM solo cuando cambia el texto, sin re-renderizar (ADR-004). El HTML pre-renderizado
 * trae el de la singularidad, que es lo que se ve al cargar arriba del todo.
 */
export function CosmicHud(): ReactNode {
  const locale = useLocale();
  const before = useRef<HTMLSpanElement>(null);
  const value = useRef<HTMLSpanElement>(null);
  const after = useRef<HTMLSpanElement>(null);
  const scale = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let painted = '';
    const paint = ({ m }: SceneState): void => {
      const clock = cosmicClock(locale, m);
      const scaleText = cosmicScale(locale, activeChapter(m));
      const next = [clock.before, clock.value, clock.after, scaleText].join('\n');
      if (next === painted) return;
      painted = next;
      if (before.current !== null) before.current.textContent = clock.before;
      if (value.current !== null) value.current.textContent = clock.value;
      if (after.current !== null) after.current.textContent = clock.after;
      if (scale.current !== null) scale.current.textContent = scaleText;
    };
    paint(sceneStore.getState());
    return sceneStore.subscribe(paint);
  }, [locale]);

  const initial = cosmicClock(locale, 0);

  return (
    <div className={styles.hud} aria-hidden="true">
      <p className={styles.clock}>
        <span ref={before}>{initial.before}</span>
        <span ref={value} className={styles.value}>
          {initial.value}
        </span>
        <span ref={after}>{initial.after}</span>
      </p>
      <p ref={scale}>{cosmicScale(locale, 0)}</p>
    </div>
  );
}
