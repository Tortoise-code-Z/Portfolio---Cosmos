import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fireEvent, render, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setReadingInterlude } from '~/stores/sceneStore/sceneStore';
import { selectActiveProject, setActiveProject, useUiStore } from '~/stores/uiStore/uiStore';

import { PLATE_PIN } from '../config/plateSlots/plateSlots';
import { cameraFov, cameraPose, createParallax } from '../math/camera/camera';
import {
  createPinBox,
  pinTagWidth,
  placePinBox,
  swayTurtlePoint,
} from '../math/platePins/platePins';
import { createScreenPoint, projectToScreen } from '../math/projection/projection';
import { createSceneFrame, type SceneFrame } from '../sceneMaterials/sceneMaterials';
import {
  createPinElements,
  createPinWork,
  PINS,
  pinWidths,
  PlatePins,
  PlatePinsFrame,
  stepPlatePins,
  type PinElements,
} from './PlatePins';

/** `useFrame` necesita el lienzo de R3F: aquí se guarda el callback y se le da el tamaño del lienzo a mano. */
const frameCallbacks = vi.hoisted(
  (): ((state: { size: { width: number; height: number } }) => void)[] => [],
);
vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: (state: { size: { width: number; height: number } }) => void) => {
    frameCallbacks.push(callback);
  },
}));

/** Su CSS, del disco (con jsdom, `new URL` no lleva a rutas `file:`). */
const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'PlatePins.module.css'),
  'utf8',
);

/** El cuerpo de la regla cuya cabecera, al principio de una línea, es `selector`. */
function rule(selector: string): string {
  const start = css.indexOf(`\n${selector} {`);
  if (start === -1) throw new Error(`No está la regla «${selector}»`);
  return css.slice(start, css.indexOf('}', start));
}

const NAMES = { chessmate: 'Chessmate', astrohub: 'AstroHub', cosmos: 'Cosmos' };
const SIZE = { width: 1280, height: 720 };

afterEach(() => {
  frameCallbacks.length = 0;
  useUiStore.setState(useUiStore.getInitialState(), true);
});

function pointed(): string | null {
  return selectActiveProject(useUiStore.getState());
}

/** La tortuga en escritorio (1280×720), con la pose que dejaría la cámara. */
function turtleFrame(m = 3, wide = true): SceneFrame {
  const frame = createSceneFrame();
  frame.m = m;
  frame.wide = wide;
  frame.time = 4.2;
  frame.aspect = SIZE.width / SIZE.height;
  frame.fov = cameraFov(frame.aspect);
  cameraPose(m, wide, createParallax(), frame.camera);
  return frame;
}

function mountPins(onOpen: (slug: string) => void = vi.fn()): PinElements {
  const elements = createPinElements();
  render(<PlatePins names={NAMES} elements={elements} onOpen={onOpen} />);
  return elements;
}

const pin = (elements: PinElements, slug: string): HTMLElement => {
  const element = elements.get(slug);
  if (element === undefined) throw new Error(`No pin ${slug}`);
  return element;
};

describe('PlatePins (the layer)', () => {
  it('one decorative pin per project with a plate, featured first, with its name, in a layer of its own in body', () => {
    const elements = mountPins();
    const layer = document.body.querySelector('[data-plate-pins]');
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer?.parentElement).toBe(document.body);
    expect(
      [...(layer?.querySelectorAll('[data-pin]') ?? [])].map((el) => el.getAttribute('data-pin')),
    ).toEqual(['chessmate', 'astrohub', 'cosmos']);
    expect(PINS.map(({ label }) => label)).toEqual([20, 21, 22]);
    expect(pin(elements, 'astrohub').textContent).toBe('AstroHub');
  });

  it('without names (outside the journey), no layer; a pin without its name is empty', () => {
    const elements = createPinElements();
    const { rerender } = render(<PlatePins names={null} elements={elements} onOpen={vi.fn()} />);
    expect(document.body.querySelector('[data-plate-pins]')).toBeNull();
    rerender(<PlatePins names={{}} elements={elements} onOpen={vi.fn()} />);
    expect(pin(elements, 'cosmos').textContent).toBe('');
  });

  it('the mouse over a pin points at its project; leaving lets it go (only if it is still the pointed one)', () => {
    const elements = mountPins();
    const cosmos = pin(elements, 'cosmos');
    fireEvent.pointerEnter(cosmos, { pointerType: 'touch' });
    expect(pointed()).toBeNull();
    fireEvent.pointerEnter(cosmos, { pointerType: 'mouse' });
    expect(pointed()).toBe('cosmos');
    fireEvent.pointerLeave(cosmos, { pointerType: 'touch' });
    expect(pointed()).toBe('cosmos');
    setActiveProject('astrohub');
    fireEvent.pointerLeave(cosmos, { pointerType: 'mouse' });
    expect(pointed()).toBe('astrohub');
    fireEvent.pointerLeave(pin(elements, 'astrohub'), { pointerType: 'mouse' });
    expect(pointed()).toBeNull();
  });

  it('a mouse click opens its project at once', () => {
    const onOpen = vi.fn();
    const elements = mountPins(onOpen);
    fireEvent.pointerDown(pin(elements, 'chessmate'), { pointerType: 'mouse' });
    fireEvent.click(pin(elements, 'chessmate'));
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('chessmate');
  });

  it('on touch, the first tap points at its project and the second opens it', () => {
    const onOpen = vi.fn();
    const elements = mountPins(onOpen);
    const astrohub = pin(elements, 'astrohub');
    const tap = (): void => {
      fireEvent.pointerDown(astrohub, { pointerType: 'touch' });
      // El toque limpio fuera de Projects apaga antes del `click` (en la captura del documento).
      setActiveProject(null);
      fireEvent.click(astrohub);
    };
    tap();
    expect(pointed()).toBe('astrohub');
    expect(onOpen).not.toHaveBeenCalled();
    tap();
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('astrohub');
  });

  it('on touch, a pin whose plate the cycle lit, or another one pointed, takes a first tap to point', () => {
    const onOpen = vi.fn();
    const elements = mountPins(onOpen);
    setActiveProject('chessmate');
    fireEvent.pointerDown(pin(elements, 'cosmos'), { pointerType: 'touch' });
    fireEvent.click(pin(elements, 'cosmos'));
    expect(pointed()).toBe('cosmos');
    // Un `click` sin `pointerdown` antes (sintético) solo señala.
    fireEvent.click(pin(elements, 'astrohub'));
    expect(pointed()).toBe('astrohub');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('its box is PLATE_PIN: padding, line, border, the stem 46 px below a gap of 4, 2 px in; hidden until placed', () => {
    const { padBlockPx, padInlinePx, lineHeightPx, stemPx, gapPx, tagLeftPx } = PLATE_PIN;
    expect(rule('.tag')).toContain(`padding: ${String(padBlockPx)}px ${String(padInlinePx)}px;`);
    expect(rule('.tag')).toContain('border: var(--border-width) solid var(--color-faint);');
    expect(rule('.pin')).toContain(`line-height: ${String(lineHeightPx)}px;`);
    expect(rule('.pin')).toContain('font-size: var(--text-star-label);');
    expect(rule('.pin')).toContain('letter-spacing: var(--tracking-micro);');
    expect(rule('.pin')).toContain('text-transform: uppercase;');
    expect(rule('.pin')).toContain('visibility: hidden;');
    expect(rule('.stem')).toContain(
      `block-size: calc(${String(stemPx)}px + var(--_pin-floor, 0) * ${String(PLATE_PIN.tagHeightPx + gapPx)}px);`,
    );
    expect(rule('.stem')).toContain(`inset-block-start: calc(100% + ${String(gapPx)}px);`);
    expect(rule('.stem')).toContain(`inset-inline-start: ${String(tagLeftPx)}px;`);
    expect(rule('.pin[data-live]')).toContain('pointer-events: auto;');
    expect(rule('.pin[data-hot] .tag')).toContain('color: var(--color-star);');
    expect(css).toMatch(
      /@media \(width < 900px\) \{\s+\.pin \{\s+font-size: var\(--text-star-label-narrow\);/,
    );
    expect(css).toMatch(/@media \(forced-colors: active\) \{\s+\.layer \{\s+display: none;/);
  });

  it('its letters: 11 and 10 px tokens like the star labels, and --tracking-micro is the 0.1 em of the box', () => {
    const tokens = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../../styles/tokens.css'),
      'utf8',
    );
    const value = (name: string): number =>
      Number(new RegExp(`${name}:\\s*([\\d.]+)(?:px|em);`).exec(tokens)?.[1]);
    expect(value('--text-star-label')).toBe(PLATE_PIN.fontPx);
    expect(value('--text-star-label-narrow')).toBe(PLATE_PIN.narrowFontPx);
    expect(value('--tracking-micro')).toBe(PLATE_PIN.trackingEm);
  });
});

describe('stepPlatePins', () => {
  /** Monta los pins y corre un frame. */
  function step(
    frame: SceneFrame,
    size = SIZE,
  ): { elements: PinElements; work: ReturnType<typeof createPinWork> } {
    const elements = mountPins();
    const work = createPinWork();
    stepPlatePins(work, frame, elements, size, pinWidths(NAMES));
    return { elements, work };
  }

  it('at the turtle on a desktop, every pin stands on its swayed plate, fully there, live; the lit plate marks its pin', () => {
    const frame = turtleFrame();
    frame.plate = 21;
    const { elements } = step(frame);
    const point = createScreenPoint();
    const box = createPinBox();
    const at: [number, number, number] = [0, 0, 0];
    for (const { slug, base } of PINS) {
      projectToScreen(
        swayTurtlePoint(base, frame.time, 1, at),
        frame.camera,
        { ...SIZE, fov: frame.fov },
        point,
      );
      placePinBox(point, pinTagWidth(NAMES[slug as keyof typeof NAMES], 11), box);
      const element = pin(elements, slug);
      expect(element.style.visibility, slug).toBe('visible');
      expect(element.style.transform).toBe(
        `translate(${String(Math.round(box.tag.left))}px, ${String(Math.round(box.tag.top))}px)`,
      );
      expect(element.style.opacity).toBe('1');
      expect(element).toHaveAttribute('data-live', '');
      expect(element.hasAttribute('data-hot')).toBe(slug === 'astrohub');
    }
  });

  it('with reduced motion they stand still (the turtle does not sway)', () => {
    const still = turtleFrame();
    still.reducedMotion = true;
    const later = turtleFrame();
    later.reducedMotion = true;
    later.time = 30;
    const a = step(still).elements;
    const b = step(later).elements;
    expect(pin(b, 'cosmos').style.transform).toBe(pin(a, 'cosmos').style.transform);
  });

  it('coming in, they fade in with the chapter and take the mouse only past 0.6', () => {
    const { elements } = step(turtleFrame(2.6));
    const cosmos = pin(elements, 'cosmos');
    expect(Number(cosmos.style.opacity)).toBeCloseTo(1 - 0.4 * 1.8, 2);
    expect(cosmos).not.toHaveAttribute('data-live');
  });

  it('far from the turtle nothing is written; leaving it hides them all', () => {
    const { elements, work } = step(turtleFrame(1));
    expect(pin(elements, 'chessmate').style.visibility).toBe('');
    const frame = turtleFrame();
    stepPlatePins(work, frame, elements, SIZE, pinWidths(NAMES));
    expect(pin(elements, 'chessmate').style.visibility).toBe('visible');
    frame.m = 1;
    stepPlatePins(work, frame, elements, SIZE, pinWidths(NAMES));
    expect(pin(elements, 'chessmate').style.visibility).toBe('hidden');
    expect(work.shown).toBe(false);
  });

  it('on a phone the pins meet: they climb floors (--_pin-floor, written only when it changes) and all three show', () => {
    const phone = { width: 390, height: 844 };
    const frame = turtleFrame(3, false);
    frame.aspect = phone.width / phone.height;
    frame.fov = cameraFov(frame.aspect);
    cameraPose(3, false, createParallax(), frame.camera);
    frame.reducedMotion = true;
    const elements = mountPins();
    const work = createPinWork();
    stepPlatePins(work, frame, elements, phone, pinWidths(NAMES));
    const floors = PINS.map(({ slug }) =>
      pin(elements, slug).style.getPropertyValue('--_pin-floor'),
    );
    expect(PINS.every(({ slug }) => pin(elements, slug).style.visibility === 'visible')).toBe(true);
    // Una escalera: cada uno en su piso, el de más a la derecha en el de abajo.
    expect([...floors].sort()).toEqual(['0', '1', '2']);
    const cosmos = pin(elements, 'cosmos');
    cosmos.style.removeProperty('--_pin-floor');
    stepPlatePins(work, frame, elements, phone, pinWidths(NAMES));
    expect(cosmos.style.getPropertyValue('--_pin-floor')).toBe('');
  });

  it('while a transmission is read (Mission control, the turtle behind its veil), they hide', () => {
    const { elements, work } = step(turtleFrame());
    stepPlatePins(work, turtleFrame(), elements, SIZE, pinWidths(NAMES), true);
    expect(PINS.map(({ slug }) => pin(elements, slug).style.visibility)).toEqual([
      'hidden',
      'hidden',
      'hidden',
    ]);
  });

  it('a canvas without a size places nothing (never a NaN position)', () => {
    const { elements } = step(turtleFrame(), { width: 0, height: 0 });
    expect(pin(elements, 'chessmate').style.transform).toBe('');
  });

  it('a pin that covers the interface hides (here, the panel of a narrow desktop window)', () => {
    const frame = turtleFrame();
    const narrow = { width: 900, height: 720 };
    frame.aspect = narrow.width / narrow.height;
    frame.fov = cameraFov(frame.aspect);
    cameraPose(3, true, createParallax(), frame.camera);
    const elements = mountPins();
    const work = createPinWork();
    stepPlatePins(work, frame, elements, narrow, pinWidths(NAMES));
    const shown = PINS.filter(({ slug }) => pin(elements, slug).style.visibility === 'visible');
    expect(shown.length).toBeLessThan(PINS.length);
  });

  it('narrow layouts measure the tags with the smaller letter', () => {
    const widths = pinWidths(NAMES);
    expect(widths.wide[0]).toBeCloseTo(pinTagWidth('Chessmate', 11), 10);
    expect(widths.narrow[0]).toBeCloseTo(pinTagWidth('Chessmate', 10), 10);
    expect(pinWidths(null).wide[0]).toBeCloseTo(pinTagWidth('', 11), 10);
  });
});

describe('PlatePinsFrame', () => {
  it('places the pins on every frame of the canvas, and paints nothing of its own; none while a transmission is read', () => {
    const elements = mountPins();
    const frame = turtleFrame();
    const { result } = renderHook(() => PlatePinsFrame({ frame, names: NAMES, elements }));
    expect(result.current).toBeNull();
    frameCallbacks.at(-1)?.({ size: SIZE });
    expect(pin(elements, 'chessmate').style.visibility).toBe('visible');
    setReadingInterlude('mission-control');
    frameCallbacks.at(-1)?.({ size: SIZE });
    expect(pin(elements, 'chessmate').style.visibility).toBe('hidden');
    setReadingInterlude(null);
  });
});
