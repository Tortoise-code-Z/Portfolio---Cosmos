import { act, render } from '@testing-library/react';
import { useRef, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { arrivalProgress } from '~/lib/scroll/arrival/arrival';
import {
  arrivalBeamLine,
  arrivalCorners,
  arrivalGuides,
} from '~/lib/scroll/arrivalChoreography/arrivalChoreography';
import { smoothM } from '~/lib/scroll/smoothM/smoothM';
import { sceneStore, setCharge, setScrollTarget } from '~/stores/sceneStore/sceneStore';

import { ARRIVAL_FLAGS, ARRIVAL_VARS, useArrivalChoreography } from './useArrivalChoreography';

/** Una sección con llegada: su escenario, el destino de las esquinas y un enlace (como «Download CV»). */
function Arrival({
  enabled = true,
  target = true,
  stage = true,
}: {
  readonly enabled?: boolean;
  readonly target?: boolean;
  readonly stage?: boolean;
}): ReactNode {
  const ref = useRef<HTMLElement>(null);
  useArrivalChoreography(ref, enabled);
  const content = (
    <>
      {target ? <div data-arrival-target="" /> : null}
      <a href="/cv.pdf">Download CV</a>
    </>
  );
  return (
    <section ref={ref} aria-label="Crew file">
      {stage ? <div data-stage="">{content}</div> : content}
    </section>
  );
}

/** La ventana mide 800 de alto; el escenario, pegado bajo la barra (64 px), y el destino en medio. */
const VIEWPORT = 800;
const STAGE = { top: 64, left: 0, width: 1280, height: 736 };
const TARGET = { top: 200, left: 500, width: 300, height: 400 };

/** Bucle de frames manual: una cola, como el navegador (cada frame con su id, para cancelarlo). */
let pending: { readonly id: number; readonly callback: FrameRequestCallback }[] = [];
let nextId = 1;
let now = 0;

function advance(ms: number, frames = 1): void {
  for (let index = 0; index < frames; index += 1) {
    now += ms;
    const callbacks = pending;
    pending = [];
    act(() => {
      for (const { callback } of callbacks) callback(now);
    });
  }
}

/** `matchMedia` falso de movimiento reducido, con su oyente de `change`. */
let reducedListener: ((event: { matches: boolean }) => void) | null = null;
function stubReducedMotion(matches: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: matches && query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      reducedListener = listener;
    },
    removeEventListener: () => {
      reducedListener = null;
    },
  }));
}

/** `Element.prototype.matches` de jsdom, antes de espiarlo. */
const ELEMENT_MATCHES = Object.getOwnPropertyDescriptor(Element.prototype, 'matches')?.value as (
  this: Element,
  selector: string,
) => boolean;

/** El foco se ve como con Tab (`:focus-visible`) o no (un clic): jsdom lo decide con eventos de otros tests. */
function focusVisible(visible: boolean): void {
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector) {
    return selector === ':focus-visible'
      ? visible && this === document.activeElement
      : ELEMENT_MATCHES.call(this, selector);
  });
}

function renderArrival(props: { enabled?: boolean; target?: boolean; stage?: boolean } = {}): {
  section: HTMLElement;
  unmount: () => void;
} {
  const { container, unmount } = render(<Arrival {...props} />);
  const section = container.querySelector('section');
  if (section === null) throw new Error('No section');
  // El primer frame: pinta con la `m` de la página (la del store, que el puente del scroll ya ha puesto).
  advance(16);
  return { section, unmount };
}

const read = (section: HTMLElement, name: string): string => section.style.getPropertyValue(name);
const px = (value: number): string => `${value.toFixed(1)}px`;
const unit = (value: number): string => value.toFixed(4);
const flags = (section: HTMLElement): string[] =>
  Object.values(ARRIVAL_FLAGS).filter((name) => section.hasAttribute(`data-${name}`));
/** Todas las marcas de una sección encajada: con `instant` si su primer frame ya llegó encajado. */
const LOCKED = [
  ARRIVAL_FLAGS.active,
  ARRIVAL_FLAGS.locked,
  ARRIVAL_FLAGS.revealed,
  ARRIVAL_FLAGS.armed,
  ARRIVAL_FLAGS.on,
];
const LOCKED_INSTANT = Object.values(ARRIVAL_FLAGS);

beforeEach(() => {
  pending = [];
  nextId = 1;
  now = 0;
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      const id = nextId;
      nextId += 1;
      pending.push({ id, callback });
      return id;
    }),
  );
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((id: number) => {
      pending = pending.filter((entry) => entry.id !== id);
    }),
  );
  stubReducedMotion(false);
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(VIEWPORT);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    return fakeRect(this);
  });
});

/** Las cajas de la prueba: el escenario, el destino y lo demás en 0. */
function fakeRect(element: HTMLElement): DOMRect {
  const box = element.hasAttribute('data-stage')
    ? STAGE
    : element.hasAttribute('data-arrival-target')
      ? TARGET
      : { top: 0, left: 0, width: 0, height: 0 };
  return {
    ...box,
    bottom: box.top + box.height,
    right: box.left + box.width,
    x: box.left,
    y: box.top,
  } as DOMRect;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sceneStore.setState(sceneStore.getInitialState(), true);
  reducedListener = null;
});

describe('useArrivalChoreography', () => {
  it('until its first frame it leaves the section whole and still (the scroll bridge has not set m yet)', () => {
    setScrollTarget(4.4);
    const { container } = render(<Arrival />);
    const section = container.querySelector('section');
    expect(section?.attributes).toHaveLength(1);
    expect(pending).toHaveLength(1);
    // El puente del scroll, en el efecto del padre, pone la `m` de la página antes del primer frame: no se repite.
    act(() => {
      setScrollTarget(5);
    });
    advance(16);
    expect(section).toHaveAttribute('data-revealed');
    expect(pending).toEqual([]);
  });

  it('before the arrival: running and armed, everything hidden under the beam, no corners, and asleep', () => {
    const { section } = renderArrival();
    expect(flags(section)).toEqual([ARRIVAL_FLAGS.active, ARRIVAL_FLAGS.armed]);
    expect(read(section, ARRIVAL_VARS.beamY)).toBe('0.0px');
    expect(read(section, ARRIVAL_VARS.beamOn)).toBe('0');
    expect(read(section, ARRIVAL_VARS.cornersShow)).toBe('0');
    expect(read(section, ARRIVAL_VARS.corners)).toBe(unit(0));
    expect(read(section, ARRIVAL_VARS.guides)).toBe(unit(0));
    // No se queda en marcha.
    expect(pending).toEqual([]);
  });

  it('halfway: the beam line on the screen (the shader’s), the corners closing on the target and nothing locked', () => {
    setScrollTarget(4.4);
    const { section } = renderArrival();
    const progress = arrivalProgress(4.4);
    expect(read(section, ARRIVAL_VARS.beamY)).toBe(
      px(arrivalBeamLine(progress) * VIEWPORT - STAGE.top),
    );
    expect(read(section, ARRIVAL_VARS.beamOn)).toBe('1');
    expect(read(section, ARRIVAL_VARS.visibleH)).toBe(px(VIEWPORT - STAGE.top));
    expect(read(section, ARRIVAL_VARS.cornersShow)).toBe(unit(1));
    expect(read(section, ARRIVAL_VARS.corners)).toBe(unit(arrivalCorners(progress)));
    // El destino, desde la esquina de arriba del escenario.
    expect(read(section, ARRIVAL_VARS.targetX)).toBe(px(TARGET.left - STAGE.left));
    expect(read(section, ARRIVAL_VARS.targetY)).toBe(px(TARGET.top - STAGE.top));
    expect(read(section, ARRIVAL_VARS.targetW)).toBe(px(TARGET.width));
    expect(read(section, ARRIVAL_VARS.targetH)).toBe(px(TARGET.height));
    expect(flags(section)).toEqual([ARRIVAL_FLAGS.active, ARRIVAL_FLAGS.armed]);
  });

  it('locked at 0.78: the file is written (teletype on), the beam is done and the guides come out', () => {
    setScrollTarget(4.85);
    const { section } = renderArrival();
    expect(flags(section)).toEqual(LOCKED_INSTANT);
    expect(read(section, ARRIVAL_VARS.beamOn)).toBe('0');
    expect(read(section, ARRIVAL_VARS.guides)).toBe(unit(arrivalGuides(arrivalProgress(4.85))));
  });

  it('entering by the anchor (the arrival done): all in sight and locked, without measuring the stage', () => {
    setScrollTarget(5);
    const { section } = renderArrival();
    expect(flags(section)).toEqual(LOCKED_INSTANT);
    expect(read(section, ARRIVAL_VARS.guides)).toBe(unit(1));
    expect(read(section, ARRIVAL_VARS.cornersShow)).toBe('0');
    expect(read(section, ARRIVAL_VARS.visibleH)).toBe('');
  });

  it('follows its own smoothed m (like the scene): scrolling in, it goes through the arrival and sleeps at the end', () => {
    setScrollTarget(4);
    const { section } = renderArrival();
    act(() => {
      setScrollTarget(5);
    });
    // Al despertar, el primer frame no cuenta tiempo; después, va persiguiendo.
    advance(16, 3);
    expect(section).not.toHaveAttribute('data-locked');
    expect(read(section, ARRIVAL_VARS.beamOn)).toBe('1');
    expect(pending).toHaveLength(1);
    advance(100, 40);
    // Encajada al pasar por la llegada: con el destello del visor (sin `instant`).
    expect(flags(section)).toEqual(LOCKED);
    expect(pending).toEqual([]);
  });

  it('goes at the pace of the scene: one frame of 100 ms moves its m like the scene’s (smoothM)', () => {
    setScrollTarget(4);
    const { section } = renderArrival();
    act(() => {
      setScrollTarget(5);
    });
    // El frame que despierta no cuenta tiempo; el siguiente, 100 ms.
    advance(16);
    advance(100);
    const m = smoothM(4, 5, 0.1, false);
    expect(read(section, ARRIVAL_VARS.beamY)).toBe(
      px(arrivalBeamLine(arrivalProgress(m)) * VIEWPORT - STAGE.top),
    );
  });

  it('the first frame already locked has no flash (instant); unlocking takes it away, and locking again flashes', () => {
    setScrollTarget(5);
    const { section } = renderArrival();
    expect(section).toHaveAttribute('data-instant');
    act(() => {
      setScrollTarget(4.5);
    });
    advance(100, 40);
    expect(section).not.toHaveAttribute('data-instant');
    act(() => {
      setScrollTarget(5);
    });
    advance(100, 40);
    expect(flags(section)).toEqual(LOCKED);
  });

  it('measures before it writes in a frame (no layout forced halfway)', () => {
    setScrollTarget(4.3);
    const { section } = renderArrival();
    const calls: string[] = [];
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      calls.push('read');
      return fakeRect(this);
    });
    vi.spyOn(section.style, 'setProperty').mockImplementation(() => {
      calls.push('write');
    });
    vi.spyOn(section, 'toggleAttribute').mockImplementation(() => {
      calls.push('write');
      return true;
    });
    act(() => {
      setScrollTarget(4.4);
    });
    // Un frame: lee las cajas y, después, escribe.
    advance(16);
    expect(calls).toContain('read');
    expect(calls.indexOf('write')).toBeGreaterThan(calls.lastIndexOf('read'));
  });

  it('does not write again what has not changed', () => {
    setScrollTarget(4.4);
    const { section } = renderArrival();
    const setProperty = vi.spyOn(section.style, 'setProperty');
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    advance(16);
    expect(setProperty).not.toHaveBeenCalled();
  });

  it('wakes only when mTarget changes (not with the charge of the Big Bang)', () => {
    setScrollTarget(4.4);
    renderArrival();
    act(() => {
      setCharge(0.5);
    });
    expect(pending).toEqual([]);
  });

  it('scrolling back up undoes it: unlocked, the teletype off and the file covered again', () => {
    setScrollTarget(5);
    const { section } = renderArrival();
    act(() => {
      setScrollTarget(3.5);
    });
    advance(100, 60);
    expect(flags(section)).toEqual([ARRIVAL_FLAGS.active, ARRIVAL_FLAGS.armed]);
    expect(read(section, ARRIVAL_VARS.beamY)).toBe('0.0px');
  });

  it('a Tab into it halfway reveals it whole until it goes back above the arrival', () => {
    focusVisible(true);
    setScrollTarget(4.3);
    const { section } = renderArrival();
    act(() => {
      section.querySelector('a')?.focus();
    });
    expect(flags(section)).toEqual(LOCKED);
    // Sigue revelada mientras la llegada se mueve…
    act(() => {
      setScrollTarget(4.2);
    });
    advance(100, 30);
    expect(section).toHaveAttribute('data-revealed');
    // …y vuelve la coreografía al cruzar por encima de la llegada y bajar otra vez.
    act(() => {
      setScrollTarget(3.9);
    });
    advance(100, 30);
    act(() => {
      setScrollTarget(4.3);
    });
    advance(100, 30);
    expect(section).not.toHaveAttribute('data-revealed');
    expect(section).not.toHaveAttribute('data-locked');
  });

  it('a Tab before it starts arriving also counts (the focus scroll brings it in)', () => {
    focusVisible(true);
    const { section } = renderArrival();
    act(() => {
      section.querySelector('a')?.focus();
    });
    expect(section).toHaveAttribute('data-revealed');
  });

  it('a Tab with the arrival done does not hold it: scrolling back up undoes it as always', () => {
    focusVisible(true);
    setScrollTarget(5);
    const { section } = renderArrival();
    act(() => {
      section.querySelector('a')?.focus();
    });
    act(() => {
      setScrollTarget(4.5);
    });
    advance(100, 40);
    expect(section).not.toHaveAttribute('data-revealed');
  });

  it('a Tab before the arrival is let go when the scroll goes above it: coming down again, the choreography', () => {
    focusVisible(true);
    setScrollTarget(3.9);
    const { section } = renderArrival();
    act(() => {
      section.querySelector('a')?.focus();
    });
    expect(section).toHaveAttribute('data-revealed');
    act(() => {
      setScrollTarget(3.5);
    });
    advance(100, 30);
    act(() => {
      setScrollTarget(4.3);
    });
    advance(100, 30);
    expect(section).not.toHaveAttribute('data-revealed');
  });

  it('a Tab while the loop is running reveals it in its next frame', () => {
    focusVisible(true);
    setScrollTarget(4);
    const { section } = renderArrival();
    act(() => {
      setScrollTarget(4.4);
    });
    expect(pending).toHaveLength(1);
    act(() => {
      section.querySelector('a')?.focus();
    });
    expect(section).not.toHaveAttribute('data-revealed');
    advance(16);
    expect(section).toHaveAttribute('data-revealed');
  });

  it('with reduced motion a Tab does nothing either', () => {
    focusVisible(true);
    stubReducedMotion(true);
    setScrollTarget(4.4);
    const { section } = renderArrival();
    act(() => {
      section.querySelector('a')?.focus();
    });
    expect(flags(section)).toEqual([]);
  });

  it('a click that focuses (no :focus-visible) leaves the choreography alone', () => {
    focusVisible(false);
    setScrollTarget(4.3);
    const { section } = renderArrival();
    act(() => {
      section.querySelector('a')?.focus();
    });
    expect(section).not.toHaveAttribute('data-revealed');
  });

  it('without a target the corners stay hidden (the beam still reveals)', () => {
    setScrollTarget(4.4);
    const { section } = renderArrival({ target: false });
    expect(read(section, ARRIVAL_VARS.cornersShow)).toBe('0');
    expect(read(section, ARRIVAL_VARS.targetX)).toBe('');
    expect(read(section, ARRIVAL_VARS.beamOn)).toBe('1');
  });

  it('without a stage nothing is measured: the beam stays up and no corners', () => {
    setScrollTarget(4.4);
    const { section } = renderArrival({ stage: false });
    expect(read(section, ARRIVAL_VARS.beamY)).toBe('0.0px');
    expect(read(section, ARRIVAL_VARS.cornersShow)).toBe('0');
    expect(read(section, ARRIVAL_VARS.visibleH)).toBe('');
  });

  it('a change of size of the stage (ResizeObserver) wakes it to measure again', () => {
    let observed: (() => void) | null = null;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          observed = callback;
        }
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    setScrollTarget(4.4);
    const { section } = renderArrival();
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(700);
    act(() => {
      observed?.();
    });
    advance(16);
    expect(read(section, ARRIVAL_VARS.visibleH)).toBe(px(700 - STAGE.top));
  });

  it('the fonts arriving late wake it to measure again (the target may have moved)', async () => {
    let loaded: () => void = () => undefined;
    vi.stubGlobal('document', document);
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: {
        ready: new Promise<void>((resolve) => {
          loaded = resolve;
        }),
      },
    });
    setScrollTarget(4.4);
    const { section } = renderArrival();
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(650);
    await act(async () => {
      loaded();
      await Promise.resolve();
    });
    advance(16);
    expect(read(section, ARRIVAL_VARS.visibleH)).toBe(px(650 - STAGE.top));
    Reflect.deleteProperty(document, 'fonts');
  });

  it('a resize wakes it to measure again', () => {
    setScrollTarget(4.4);
    const { section } = renderArrival();
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(600);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    advance(16);
    expect(read(section, ARRIVAL_VARS.visibleH)).toBe(px(600 - STAGE.top));
    expect(pending).toEqual([]);
  });

  it('with reduced motion it does nothing: the section shows whole and still', () => {
    stubReducedMotion(true);
    setScrollTarget(4.4);
    const { section } = renderArrival();
    expect(flags(section)).toEqual([]);
    expect(section.getAttribute('style')).toBeNull();
    expect(pending).toEqual([]);
  });

  it('turning reduced motion on halfway takes everything away; off again, it starts over', () => {
    setScrollTarget(4.4);
    const { section } = renderArrival();
    act(() => {
      reducedListener?.({ matches: true });
    });
    expect(flags(section)).toEqual([]);
    expect(section.style.length).toBe(0);
    act(() => {
      reducedListener?.({ matches: false });
    });
    advance(16);
    expect(section).toHaveAttribute('data-arrival');
    expect(read(section, ARRIVAL_VARS.beamOn)).toBe('1');
  });

  it('switched off (an interlude) it does nothing', () => {
    setScrollTarget(4.4);
    const { section } = renderArrival({ enabled: false });
    expect(flags(section)).toEqual([]);
    expect(section.getAttribute('style')).toBeNull();
  });

  it('unmounting cancels the frame, stops listening and takes its marks away', () => {
    setScrollTarget(4);
    const { section, unmount } = renderArrival();
    act(() => {
      setScrollTarget(5);
    });
    expect(pending).toHaveLength(1);
    unmount();
    expect(pending).toEqual([]);
    expect(flags(section)).toEqual([]);
    expect(section.style.length).toBe(0);
    act(() => {
      setScrollTarget(4.5);
    });
    expect(pending).toEqual([]);
  });
});
