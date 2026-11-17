import { useCallback, useEffect, useRef } from 'react';

import {
  BIG_BANG_VARS,
  decayHit,
  FLASH,
  flashOpacity,
  haloFade,
  haloScale,
  heroTracking,
  heroWidth,
  scrollHitFires,
  scrollHitRearms,
  shakeAmplitude,
  shakeOffset,
} from '~/lib/bigBang/bigBang';
import { watchReducedMotion } from '~/lib/device/reducedMotion/reducedMotion';
import { HOLD_MAX_STEP_SECONDS } from '~/lib/hold/charge/charge';
import { smoothM } from '~/lib/scroll/smoothM/smoothM';
import { sceneStore } from '~/stores/sceneStore/sceneStore';

/**
 * Clase de `<html>` desde el primer frame del bucle del Big Bang hasta que se desmonta el hero: con ella, el halo
 * pasa a fijo (como el prototipo). Antes de hidratar sigue en el hero: si la página se abre a mitad del viaje, no
 * queda un halo encima del texto.
 */
export const BIG_BANG_LIVE_CLASS = 'bang-live';

const MS_PER_SECOND = 1000;

export interface BigBang {
  /** La detonación: el destello fuerte, que se apaga en ≈ 0,6 s. */
  readonly detonate: () => void;
}

/**
 * Los efectos del Big Bang en el DOM (docs/03-diseno/movimiento.md → «Coreografía del Big Bang», ADR-030): el
 * destello, el temblor, el ancho y el espaciado del nombre y el halo, escritos como variables CSS en `<html>`
 * (`BIG_BANG_VARS`) por un bucle de `requestAnimationFrame` (nada por frame en el estado de React, ADR-004). Sigue
 * su propia `m`, suavizada desde `mTarget` como la de la escena (`smoothM`), para ir al paso de la explosión, y
 * la carga de `sceneStore`. Solo corre mientras algo se mueve (la carga, un golpe del destello o `m` persiguiendo
 * a `mTarget`); lo despiertan el store y `detonate`. También persigue pasado el hero, aunque ahí ya no escriba
 * nada (los valores están en su final y `write` no repite): así, al volver, su `m` va con la de la escena. Con
 * movimiento reducido, sin destello ni temblor. El CSS decide qué se ve sin escena (el destello y el temblor,
 * solo con `scene-on`).
 */
export function useBigBang(): BigBang {
  const wakeRef = useRef<(() => void) | null>(null);
  /** El golpe de la detonación (1 → 0). */
  const detonateHitRef = useRef(0);

  useEffect(() => {
    const root = document.documentElement;
    const written = new Map<string, string>();
    let reduced = false;
    let m: number | null = null;
    /** El golpe del scroll (1 → 0) y si puede saltar (ADR-031). */
    let scrollHit = 0;
    let armed = false;
    let lastTime: number | null = null;
    let step = 0;
    let frame: number | null = null;

    const write = (name: string, value: string): void => {
      if (written.get(name) === value) return;
      written.set(name, value);
      root.style.setProperty(name, value);
    };

    const tick = (now: number): void => {
      frame = null;
      const dt =
        lastTime === null ? 0 : Math.min((now - lastTime) / MS_PER_SECOND, HOLD_MAX_STEP_SECONDS);
      lastTime = now;
      const { mTarget, charge } = sceneStore.getState();
      // Sin una `m` buena (el primer frame, o una rota), empieza en el objetivo.
      const previous = m !== null && Number.isFinite(m) ? m : null;
      m = previous === null ? mTarget : smoothM(previous, mTarget, dt, reduced);
      detonateHitRef.current = decayHit(detonateHitRef.current, dt);
      scrollHit = decayHit(scrollHit, dt);
      // Al empezar, armado solo arriba: quien abre a mitad del viaje no ve un destello.
      if (previous === null) armed = m < FLASH.scrollFromM;
      if (scrollHitFires(armed, m)) {
        scrollHit = 1;
        armed = false;
      } else if (scrollHitRearms(m, scrollHit)) {
        armed = true;
      }

      const flash = reduced ? 0 : flashOpacity(scrollHit, detonateHitRef.current);
      const shake = reduced ? 0 : shakeAmplitude(flash, charge);
      step += 1;
      write(BIG_BANG_VARS.flash, flash.toFixed(3));
      write(BIG_BANG_VARS.shakeX, `${shakeOffset(shake, step, 0).toFixed(1)}px`);
      write(BIG_BANG_VARS.shakeY, `${shakeOffset(shake, step, 1).toFixed(1)}px`);
      write(BIG_BANG_VARS.heroWidth, `${heroWidth(charge, m).toFixed(1)}%`);
      write(BIG_BANG_VARS.heroTracking, `${heroTracking(m).toFixed(3)}em`);
      write(BIG_BANG_VARS.haloFade, haloFade(m).toFixed(3));
      write(BIG_BANG_VARS.haloScale, haloScale(charge).toFixed(3));
      root.classList.add(BIG_BANG_LIVE_CLASS);

      const moving = charge > 0 || detonateHitRef.current > 0 || scrollHit > 0 || m !== mTarget;
      if (moving) frame = requestAnimationFrame(tick);
      else lastTime = null;
    };

    const wake = (): void => {
      frame ??= requestAnimationFrame(tick);
    };
    wakeRef.current = wake;

    const unsubscribe = sceneStore.subscribe(wake);
    // Avisa al empezar (y así pinta el primer frame) y cada vez que cambia la preferencia.
    const stopReduced = watchReducedMotion((value) => {
      reduced = value;
      wake();
    });

    return () => {
      wakeRef.current = null;
      if (frame !== null) cancelAnimationFrame(frame);
      unsubscribe();
      stopReduced();
      for (const name of written.keys()) root.style.removeProperty(name);
      root.classList.remove(BIG_BANG_LIVE_CLASS);
    };
  }, []);

  const detonate = useCallback((): void => {
    detonateHitRef.current = 1;
    wakeRef.current?.();
  }, []);

  return { detonate };
}
