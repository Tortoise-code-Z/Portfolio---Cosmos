import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import { stepCharge } from '../charge/charge';

/** Variable CSS privada donde se escribe la carga (0–1) para que el anillo la dibuje. */
export const CHARGE_VAR = '--_charge';

/** Scroll máximo (px) que cuenta como «de vuelta arriba del todo» para volver a armar la detonación. */
export const REARM_SCROLL_PX = 0;

export interface HoldCharge {
  /** Ya detonó: no se puede volver a cargar hasta volver arriba del todo. */
  readonly detonated: boolean;
  /** Empieza a cargar (pulsar, tocar o mantener la tecla). */
  readonly press: () => void;
  /** Deja de cargar: la carga baja sola hasta 0. */
  readonly release: () => void;
}

/**
 * Carga de «mantén pulsado para detonar» (docs/02-experiencia/capitulos/00-singularidad.md).
 * La carga avanza en un bucle de `requestAnimationFrame` y se escribe como variable CSS en `target`:
 * nada que cambie en cada frame pasa por el estado de React (ADR-004); solo `detonated` lo hace, una
 * vez. Al llegar a 1 llama a `onDetonate`; volver arriba del todo la deja lista otra vez.
 */
export function useHoldCharge(
  target: RefObject<HTMLElement | null>,
  onDetonate: () => void,
): HoldCharge {
  const [detonated, setDetonated] = useState(false);
  const charge = useRef(0);
  const holding = useRef(false);
  const detonatedRef = useRef(false);
  const frame = useRef<number | null>(null);
  const lastTime = useRef<number | null>(null);
  const onDetonateRef = useRef(onDetonate);

  useEffect(() => {
    onDetonateRef.current = onDetonate;
  }, [onDetonate]);

  const write = useCallback(
    (value: number): void => {
      target.current?.style.setProperty(CHARGE_VAR, String(value));
    },
    [target],
  );

  const stop = useCallback((): void => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    lastTime.current = null;
  }, []);

  const tickRef = useRef<FrameRequestCallback | null>(null);

  const schedule = useCallback((): void => {
    frame.current = requestAnimationFrame((time) => {
      tickRef.current?.(time);
    });
  }, []);

  // Un paso del bucle: avanza la carga, la escribe y decide si sigue, detona o se detiene.
  useEffect(() => {
    tickRef.current = (now: number): void => {
      const dt = lastTime.current === null ? 0 : (now - lastTime.current) / 1000;
      lastTime.current = now;
      charge.current = stepCharge(charge.current, dt, holding.current);
      write(charge.current);

      if (charge.current >= 1) {
        holding.current = false;
        detonatedRef.current = true;
        stop();
        setDetonated(true);
        onDetonateRef.current();
        return;
      }
      if (!holding.current && charge.current <= 0) {
        stop();
        return;
      }
      schedule();
    };
  }, [schedule, stop, write]);

  const press = useCallback((): void => {
    if (detonatedRef.current) return;
    holding.current = true;
    if (frame.current === null) schedule();
  }, [schedule]);

  const release = useCallback((): void => {
    holding.current = false;
  }, []);

  // Detonado: se vuelve a armar al regresar arriba del todo.
  useEffect(() => {
    if (!detonated) return undefined;
    const onScroll = (): void => {
      if (window.scrollY > REARM_SCROLL_PX) return;
      detonatedRef.current = false;
      charge.current = 0;
      write(0);
      setDetonated(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [detonated, write]);

  useEffect(() => stop, [stop]);

  return { detonated, press, release };
}
