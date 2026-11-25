import { useEffect, type RefObject } from 'react';

import { watchReducedMotion } from '~/lib/device/reducedMotion/reducedMotion';
import { isTabFocus } from '~/lib/events/isTabFocus/isTabFocus';
import { HOLD_MAX_STEP_SECONDS } from '~/lib/hold/charge/charge';
import { arrivalProgress, EPILOGUE_ARRIVAL } from '~/lib/scroll/arrival/arrival';
import {
  arrivalBeam,
  arrivalBeamLine,
  arrivalCorners,
  arrivalCornersShow,
  arrivalGuides,
  arrivalLocked,
} from '~/lib/scroll/arrivalChoreography/arrivalChoreography';
import { smoothM } from '~/lib/scroll/smoothM/smoothM';
import { sceneStore } from '~/stores/sceneStore/sceneStore';

const MS_PER_SECOND = 1000;

/**
 * Las variables CSS que escribe el bucle en la sección (las heredan su escenario y lo de dentro). Las medidas van en px
 * desde la esquina de arriba del escenario; el resto, de 0 a 1.
 */
export const ARRIVAL_VARS = {
  /** La línea del haz (`arrivalBeamLine`, la misma que el shader), en px desde arriba del escenario. */
  beamY: '--_beam-y',
  /** 1 mientras la línea cruza lo que se ve; 0 antes y después. */
  beamOn: '--_beam-on',
  /** Lo que se ven las esquinas que viajan (`arrivalCornersShow`). */
  cornersShow: '--_corners-show',
  /** Lo que se han cerrado (`arrivalCorners`: 0, las de lo que se ve del escenario → 1, las del destino). */
  corners: '--_corners',
  /** Lo que han salido las líneas guía (`arrivalGuides`). */
  guides: '--_guides',
  /** Lo que se ve del escenario bajo la barra: de dónde salen las esquinas. */
  visibleH: '--_visible-h',
  /** El destino de las esquinas (`[data-arrival-target]`). */
  targetX: '--_target-x',
  targetY: '--_target-y',
  targetW: '--_target-w',
  targetH: '--_target-h',
} as const;

/** Lo que marca la sección mientras dura la coreografía (`data-*`, sin valor). */
export const ARRIVAL_FLAGS = {
  /** La coreografía está en marcha (con JavaScript y sin movimiento reducido): sin ella, todo se ve quieto. */
  active: 'arrival',
  /** Las esquinas han encajado: la ficha se escribe (con el teletipo, `on`). */
  locked: 'locked',
  /** El haz ha acabado de bajar (o el Tab lo ha revelado todo): sin recorte. */
  revealed: 'revealed',
  /** El teletipo de la transmisión: armado (las líneas esperan tapadas) y encendido (se escriben). */
  armed: 'armed',
  on: 'on',
  /**
   * El primer frame ya llega encajado (por el ancla, al recargar, al cambiar de idioma o al quitar el movimiento
   * reducido): el visor no da el destello de encajar, porque no ha encajado nada. Se va al desencajar.
   */
  instant: 'instant',
} as const;

type ArrivalFlag = keyof typeof ARRIVAL_FLAGS;

/** El atributo de cada marca (`data-…`), hecho una vez y no en cada frame. */
const FLAG_ATTRIBUTES = Object.fromEntries(
  Object.entries(ARRIVAL_FLAGS).map(([key, name]) => [key, `data-${name}`]),
) as Readonly<Record<ArrivalFlag, string>>;

/**
 * Lo que busca el bucle dentro de la sección: su escenario (lo que se queda fijo; lo comparte el foco de la llegada,
 * `Transmission`) y el destino de las esquinas.
 */
export const STAGE_SELECTOR = '[data-stage]';
export const ARRIVAL_TARGET_SELECTOR = '[data-arrival-target]';

/**
 * Lo que pide el escenario de la coreografía en un frame (las cuentas, sin tocar el DOM). Un solo objeto para toda la
 * visita: el bucle lo rellena (`measure`) en vez de crear uno por frame.
 */
interface Measure {
  /** Dónde está arriba el escenario, en la ventana. */
  stageTop: number;
  /** El alto de la ventana: el de la escena (`position: fixed; inset: 0`). */
  viewport: number;
  /** Hay destino de las esquinas, y su caja desde la esquina de arriba del escenario. */
  hasTarget: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

function px(value: number): string {
  return `${value.toFixed(1)}px`;
}

function unit(value: number): string {
  return value.toFixed(4);
}

/**
 * La coreografía de la página en la llegada de un capítulo (C.7 · ADR-039; 05-crew-file.md → «Transición»): el haz
 * baja por la pantalla y revela la sección por encima de él, las esquinas del visor salen de las de lo que se ve del
 * escenario y se cierran sobre el destino (`[data-arrival-target]`), al encajar se escribe la ficha (el teletipo, `data-on`) y las
 * líneas guía salen del visor. Lo pinta el CSS con lo que escribe aquí un bucle de `requestAnimationFrame` en la
 * sección (`ARRIVAL_VARS`, `ARRIVAL_FLAGS`; nada por frame en el estado de React, ADR-004).
 *
 * Sigue su propia `m`, suavizada desde `mTarget` como la de la escena (`smoothM`, como el Big Bang, ADR-030), y lo
 * mide todo con lo que lleva la llegada (`arrivalProgress`): va a la par que la escena y, subiendo, se deshace. Solo
 * corre mientras `m` persigue a `mTarget` (lo despiertan `mTarget`, el tamaño del escenario, el de la ventana y las
 * fuentes al llegar), y solo mide el escenario mientras dura la llegada: primero mide y después escribe, para no
 * obligar al navegador a recalcular el layout a mitad de frame. Si el foco entra con Tab antes de que acabe, la sección
 * se revela entera hasta que se vuelve por encima de la llegada. Sin JavaScript o con movimiento reducido no pone nada: la sección se
 * ve quieta y entera (con movimiento reducido no hay llegada). Sin WebGL, igual que con escena: solo lee el scroll.
 */
export function useArrivalChoreography(ref: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    const section = ref.current;
    if (!enabled || section === null) return undefined;
    const written = new Map<string, string>();
    let active = false;
    let m: number | null = null;
    let lastTime: number | null = null;
    let forced = false;
    /** El `mTarget` del Tab que la reveló: si el scroll sube de ahí estando por encima de la llegada, se suelta. */
    let forcedAt = 0;
    /** Lo que llevaba la llegada en el frame de antes: el Tab revela hasta que se vuelve a cruzar hacia arriba. */
    let lastProgress = 0;
    let frame: number | null = null;

    const box: Measure = { stageTop: 0, viewport: 0, hasTarget: false, x: 0, y: 0, w: 0, h: 0 };

    const write = (name: string, value: string): void => {
      if (written.get(name) === value) return;
      written.set(name, value);
      section.style.setProperty(name, value);
    };
    // `toggleAttribute` no toca nada si ya está como se pide: no invalida estilos en cada frame.
    const flag = (name: ArrivalFlag, on: boolean): void => {
      section.toggleAttribute(FLAG_ATTRIBUTES[name], on);
    };

    /** Rellena `box` con el escenario y su destino; `false` si la sección no tiene escenario. */
    const measure = (): boolean => {
      const stage = section.querySelector<HTMLElement>(STAGE_SELECTOR);
      if (stage === null) return false;
      const rect = stage.getBoundingClientRect();
      box.stageTop = rect.top;
      box.viewport = document.documentElement.clientHeight;
      const target = stage.querySelector<HTMLElement>(ARRIVAL_TARGET_SELECTOR);
      box.hasTarget = target !== null;
      if (target !== null) {
        const targetRect = target.getBoundingClientRect();
        box.x = targetRect.left - rect.left;
        box.y = targetRect.top - rect.top;
        box.w = targetRect.width;
        box.h = targetRect.height;
      }
      return true;
    };

    const paint = (progress: number): void => {
      // Primero se mide (fuera de la llegada no hace falta: antes, todo tapado y sin esquinas; después, todo a la
      // vista) y después se escribe: medir tras escribir obligaría a recalcular el layout a mitad de frame.
      const measured = progress > 0 && progress < 1 && measure();
      const locked = arrivalLocked(progress);
      const beam = arrivalBeam(progress);
      flag('locked', locked);
      flag('on', locked);
      flag('revealed', beam >= 1);
      if (!locked) flag('instant', false);
      write(ARRIVAL_VARS.guides, unit(arrivalGuides(progress)));
      write(ARRIVAL_VARS.corners, unit(arrivalCorners(progress)));
      if (!measured) {
        write(ARRIVAL_VARS.beamY, px(0));
        write(ARRIVAL_VARS.beamOn, '0');
        write(ARRIVAL_VARS.cornersShow, '0');
        return;
      }
      const line = arrivalBeamLine(progress);
      write(ARRIVAL_VARS.beamY, px(line * box.viewport - box.stageTop));
      write(ARRIVAL_VARS.beamOn, beam > 0 && line < 1 ? '1' : '0');
      write(ARRIVAL_VARS.visibleH, px(box.viewport - box.stageTop));
      write(ARRIVAL_VARS.cornersShow, box.hasTarget ? unit(arrivalCornersShow(progress)) : '0');
      if (box.hasTarget) {
        write(ARRIVAL_VARS.targetX, px(box.x));
        write(ARRIVAL_VARS.targetY, px(box.y));
        write(ARRIVAL_VARS.targetW, px(box.w));
        write(ARRIVAL_VARS.targetH, px(box.h));
      }
    };

    const tick = (now: number): void => {
      frame = null;
      if (!active) return;
      const dt =
        lastTime === null ? 0 : Math.min((now - lastTime) / MS_PER_SECOND, HOLD_MAX_STEP_SECONDS);
      lastTime = now;
      const { mTarget } = sceneStore.getState();
      // Sin una `m` buena (el primer frame, o una rota), empieza en el objetivo: quien entra por el ancla no la repite.
      const previous = m !== null && Number.isFinite(m) ? m : null;
      m = previous === null ? mTarget : smoothM(previous, mTarget, dt, false);
      const progress = arrivalProgress(m);
      // Las marcas, en el primer frame: hasta entonces la sección se ve entera, como sin JavaScript. Si ya llega
      // encajada, sin destello (`instant`).
      if (previous === null) {
        flag('active', true);
        flag('armed', true);
        flag('instant', arrivalLocked(progress));
      }
      // Revelada con Tab, hasta volver por encima de la llegada: cruzando hacia arriba o, si el Tab fue antes de que
      // empezara (el scroll del foco ya la trae), subiendo más arriba de donde estaba.
      if (
        (progress <= 0 && lastProgress > 0) ||
        mTarget < Math.min(EPILOGUE_ARRIVAL.base, forcedAt)
      ) {
        forced = false;
      }
      lastProgress = progress;
      paint(forced ? 1 : progress);
      if (m !== mTarget) frame = requestAnimationFrame(tick);
      else lastTime = null;
    };

    const wake = (): void => {
      if (active) frame ??= requestAnimationFrame(tick);
    };

    // El primer frame, en el siguiente del navegador y no aquí: el efecto del puente del scroll (en la ruta, el padre)
    // corre después de este, así que aquí `mTarget` aún no es el de la página y la llegada se repetiría al entrar.
    const start = (): void => {
      active = true;
      wake();
    };
    const stop = (): void => {
      active = false;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      m = null;
      lastTime = null;
      forced = false;
      lastProgress = 0;
      for (const name of written.keys()) section.style.removeProperty(name);
      written.clear();
      for (const name of Object.keys(FLAG_ATTRIBUTES) as ArrivalFlag[]) flag(name, false);
    };

    // Solo antes de que acabe la llegada (con la `m` de la página): se revela ya, en el mismo evento (si el bucle está
    // en marcha, lo hace su frame). Con la llegada hecha no hace falta, y subiendo se deshace como siempre.
    const onFocus = (event: FocusEvent): void => {
      if (!active || !isTabFocus(event.target instanceof Element ? event.target : null)) return;
      const { mTarget } = sceneStore.getState();
      if (arrivalProgress(m ?? mTarget) >= 1) return;
      forced = true;
      forcedAt = mTarget;
      if (frame === null) tick(performance.now());
    };

    // Solo `mTarget` mueve la coreografía (no la carga del Big Bang ni el interludio que se lee).
    const unsubscribe = sceneStore.subscribe((state, previous) => {
      if (state.mTarget !== previous.mTarget) wake();
    });
    const stage = section.querySelector<HTMLElement>(STAGE_SELECTOR);
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(wake);
    if (stage !== null) resize?.observe(stage);
    window.addEventListener('resize', wake, { passive: true });
    // Una fuente que llega tarde mueve el destino sin cambiar el tamaño del escenario (en escritorio mide justo lo que
    // se ve): se vuelve a medir al llegar. `fonts` falta en jsdom aunque el tipo diga que siempre está.
    let mounted = true;
    const fonts = document.fonts as FontFaceSet | undefined;
    fonts?.ready.then(
      () => {
        if (mounted) wake();
      },
      (error: unknown) => {
        console.error(
          '[journey] Fonts failed to load; the arrival measures with fallback fonts',
          error,
        );
      },
    );
    section.addEventListener('focusin', onFocus);
    // Avisa al empezar y cada vez que cambia la preferencia: con movimiento reducido, nada.
    const stopReduced = watchReducedMotion((reduced) => {
      if (reduced) stop();
      else if (!active) start();
    });

    return () => {
      mounted = false;
      unsubscribe();
      resize?.disconnect();
      window.removeEventListener('resize', wake);
      section.removeEventListener('focusin', onFocus);
      stopReduced();
      stop();
    };
  }, [ref, enabled]);
}
