import { useEffect, type RefObject } from 'react';

import { watchReducedMotion } from '~/lib/device/reducedMotion/reducedMotion';
import { HOLD_MAX_STEP_SECONDS } from '~/lib/hold/charge/charge';
import { arrivalProgress } from '~/lib/scroll/arrival/arrival';
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
  /** 1 mientras la línea cruza la ventana; 0 antes y después. */
  beamOn: '--_beam-on',
  /** Lo que se ven las esquinas que viajan (`arrivalCornersShow`). */
  cornersShow: '--_corners-show',
  /** Lo que se han cerrado (`arrivalCorners`: 0, las de la ventana → 1, las del destino). */
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
} as const;

/** Lo que busca el bucle dentro de la sección: su escenario (lo que se queda fijo) y el destino de las esquinas. */
const STAGE_SELECTOR = '[data-stage]';
export const ARRIVAL_TARGET_SELECTOR = '[data-arrival-target]';

/**
 * Lo que se enfoca con Tab: alcanzable con el teclado (`tabIndex` ≥ 0) y con el foco a la vista (`:focus-visible`).
 * Fuera quedan los títulos que enfocan los saltos (`tabindex="-1"`: de su scroll ya se encarga `jumpToChapter`) y lo
 * que se enfoca con un clic.
 */
export function isTabFocus(element: Element | null): element is HTMLElement {
  return (
    element instanceof HTMLElement && element.tabIndex >= 0 && element.matches(':focus-visible')
  );
}

/** Una caja, desde la esquina de arriba del escenario. */
interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Lo que pide el escenario de la coreografía en un frame (las cuentas, sin tocar el DOM). */
interface Measure {
  /** Dónde está arriba el escenario, en la ventana. */
  readonly stageTop: number;
  /** El alto de la ventana: el de la escena (`position: fixed; inset: 0`). */
  readonly viewport: number;
  /** El destino de las esquinas, desde la esquina de arriba del escenario (o `null` si la sección no tiene). */
  readonly target: Box | null;
}

function px(value: number): string {
  return `${value.toFixed(1)}px`;
}

function unit(value: number): string {
  return value.toFixed(4);
}

/**
 * La coreografía de la página en la llegada de un capítulo (C.7 · ADR-039; 05-crew-file.md → «Transición»): el haz
 * baja por la pantalla y revela la sección por encima de él, las esquinas del visor salen de las de la ventana y se
 * cierran sobre el destino (`[data-arrival-target]`), al encajar se escribe la ficha (el teletipo, `data-on`) y las
 * líneas guía salen del visor. Lo pinta el CSS con lo que escribe aquí un bucle de `requestAnimationFrame` en la
 * sección (`ARRIVAL_VARS`, `ARRIVAL_FLAGS`; nada por frame en el estado de React, ADR-004).
 *
 * Sigue su propia `m`, suavizada desde `mTarget` como la de la escena (`smoothM`, como el Big Bang, ADR-030), y lo
 * mide todo con lo que lleva la llegada (`arrivalProgress`): va a la par que la escena y, subiendo, se deshace. Solo
 * corre mientras `m` persigue a `mTarget` (lo despiertan el store, el tamaño del escenario y el de la ventana), y solo
 * mide el escenario mientras dura la llegada. Si el foco entra con Tab antes de que acabe, la sección se revela entera
 * hasta que se vuelve por encima de la llegada. Sin JavaScript o con movimiento reducido no pone nada: la sección se
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
    /** Lo que llevaba la llegada en el frame de antes: el Tab revela hasta que se vuelve a cruzar hacia arriba. */
    let lastProgress = 0;
    let frame: number | null = null;

    const write = (name: string, value: string): void => {
      if (written.get(name) === value) return;
      written.set(name, value);
      section.style.setProperty(name, value);
    };
    // `toggleAttribute` no toca nada si ya está como se pide: no invalida estilos en cada frame.
    const flag = (name: string, on: boolean): void => {
      section.toggleAttribute(`data-${name}`, on);
    };

    const measure = (): Measure | null => {
      const stage = section.querySelector<HTMLElement>(STAGE_SELECTOR);
      if (stage === null) return null;
      const box = stage.getBoundingClientRect();
      const target = stage
        .querySelector<HTMLElement>(ARRIVAL_TARGET_SELECTOR)
        ?.getBoundingClientRect();
      return {
        stageTop: box.top,
        viewport: document.documentElement.clientHeight,
        target:
          target === undefined
            ? null
            : {
                x: target.left - box.left,
                y: target.top - box.top,
                w: target.width,
                h: target.height,
              },
      };
    };

    const paint = (progress: number): void => {
      const locked = arrivalLocked(progress);
      const beam = arrivalBeam(progress);
      flag(ARRIVAL_FLAGS.locked, locked);
      flag(ARRIVAL_FLAGS.on, locked);
      flag(ARRIVAL_FLAGS.revealed, beam >= 1);
      write(ARRIVAL_VARS.guides, unit(arrivalGuides(progress)));
      write(ARRIVAL_VARS.corners, unit(arrivalCorners(progress)));
      // Fuera de la llegada no hace falta medir: antes, todo tapado y sin esquinas; después, todo a la vista.
      const box = progress > 0 && progress < 1 ? measure() : null;
      if (box === null) {
        write(ARRIVAL_VARS.beamY, px(0));
        write(ARRIVAL_VARS.beamOn, '0');
        write(ARRIVAL_VARS.cornersShow, '0');
        return;
      }
      const line = arrivalBeamLine(progress);
      write(ARRIVAL_VARS.beamY, px(line * box.viewport - box.stageTop));
      write(ARRIVAL_VARS.beamOn, beam > 0 && line < 1 ? '1' : '0');
      write(ARRIVAL_VARS.visibleH, px(box.viewport - box.stageTop));
      write(
        ARRIVAL_VARS.cornersShow,
        box.target === null ? '0' : unit(arrivalCornersShow(progress)),
      );
      if (box.target !== null) {
        write(ARRIVAL_VARS.targetX, px(box.target.x));
        write(ARRIVAL_VARS.targetY, px(box.target.y));
        write(ARRIVAL_VARS.targetW, px(box.target.w));
        write(ARRIVAL_VARS.targetH, px(box.target.h));
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
      // Las marcas, en el primer frame: hasta entonces la sección se ve entera, como sin JavaScript.
      if (previous === null) {
        flag(ARRIVAL_FLAGS.active, true);
        flag(ARRIVAL_FLAGS.armed, true);
      }
      m = previous === null ? mTarget : smoothM(previous, mTarget, dt, false);
      const progress = arrivalProgress(m);
      // Revelada con Tab, hasta volver por encima de la llegada (cruzando hacia arriba: un Tab antes de que empiece
      // también vale, y el scroll del foco ya la trae).
      if (progress <= 0 && lastProgress > 0) forced = false;
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
      for (const name of Object.values(ARRIVAL_FLAGS)) flag(name, false);
    };

    // Se revela ya, en el mismo evento (si el bucle está en marcha, lo hace su frame).
    const onFocus = (event: FocusEvent): void => {
      if (!active || !isTabFocus(event.target instanceof Element ? event.target : null)) return;
      forced = true;
      if (frame === null) tick(performance.now());
    };

    const unsubscribe = sceneStore.subscribe(wake);
    const stage = section.querySelector<HTMLElement>(STAGE_SELECTOR);
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(wake);
    if (stage !== null) resize?.observe(stage);
    window.addEventListener('resize', wake, { passive: true });
    section.addEventListener('focusin', onFocus);
    // Avisa al empezar y cada vez que cambia la preferencia: con movimiento reducido, nada.
    const stopReduced = watchReducedMotion((reduced) => {
      if (reduced) stop();
      else if (!active) start();
    });

    return () => {
      unsubscribe();
      resize?.disconnect();
      window.removeEventListener('resize', wake);
      section.removeEventListener('focusin', onFocus);
      stopReduced();
      stop();
    };
  }, [ref, enabled]);
}
