import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fireEvent, render, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { selectActiveProject, setActiveProject, useUiStore } from '~/stores/uiStore/uiStore';

import { PLATE_PIN } from '../config/plateSlots/plateSlots';
import { cameraFov, cameraPose, createParallax } from '../math/camera/camera';
import { keepOutZones, overlapsRect, type KeepOutZone } from '../math/labelFit/labelFit';
import {
  createPinBox,
  pinTagWidth,
  placePinBox,
  swayTurtlePoint,
  type PinBox,
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
/** Los pins que la interfaz tapa a 900×720 (una ventana de escritorio estrecha), y qué parte los tapa. */
const HIDDEN_AT_900: Readonly<Record<string, string>> = { astrohub: 'panel', cosmos: 'rail' };
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
  // Las partículas ya pintadas: antes, los pins no tienen tortuga sobre la que estar.
  frame.painted = true;
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

  it('a pin with no project of its own (no data-pin, or an unknown one) neither points nor opens', () => {
    const onOpen = vi.fn();
    const elements = mountPins(onOpen);
    const chessmate = pin(elements, 'chessmate');
    for (const value of [undefined, 'unknown']) {
      if (value === undefined) delete chessmate.dataset.pin;
      else chessmate.dataset.pin = value;
      fireEvent.pointerEnter(chessmate, { pointerType: 'mouse' });
      fireEvent.pointerDown(chessmate, { pointerType: 'mouse' });
      fireEvent.click(chessmate);
      fireEvent.pointerLeave(chessmate, { pointerType: 'mouse' });
      expect(pointed(), String(value)).toBeNull();
    }
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('a click that opens keeps its project pointed while the project page arrives (the tap-outside capture let it go)', () => {
    const onOpen = vi.fn();
    const elements = mountPins(onOpen);
    // Projects apaga lo señalado en la captura de cada `click` del documento (useTapOutsideTurnsOff).
    const turnOff = (): void => {
      setActiveProject(null);
    };
    document.addEventListener('click', turnOff, { capture: true });
    try {
      const astrohub = pin(elements, 'astrohub');
      fireEvent.pointerEnter(astrohub, { pointerType: 'mouse' });
      fireEvent.pointerDown(astrohub, { pointerType: 'mouse' });
      fireEvent.click(astrohub);
      expect(onOpen).toHaveBeenCalledExactlyOnceWith('astrohub');
      expect(pointed()).toBe('astrohub');
      // Igual con el segundo toque en táctil.
      const cosmos = pin(elements, 'cosmos');
      fireEvent.pointerDown(cosmos, { pointerType: 'touch' });
      fireEvent.click(cosmos);
      fireEvent.pointerDown(cosmos, { pointerType: 'touch' });
      fireEvent.click(cosmos);
      expect(onOpen).toHaveBeenLastCalledWith('cosmos');
      expect(pointed()).toBe('cosmos');
    } finally {
      document.removeEventListener('click', turnOff, { capture: true });
    }
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

  it('a gesture that does not end on its own pin does not count: the next click elsewhere only points', () => {
    const onOpen = vi.fn();
    const elements = mountPins(onOpen);
    const astrohub = pin(elements, 'astrohub');
    const cosmos = pin(elements, 'cosmos');
    // El ratón baja en AstroHub y el gesto se cancela (deslizar): un `click` después en Cosmos solo señala.
    fireEvent.pointerDown(astrohub, { pointerType: 'mouse' });
    fireEvent.pointerCancel(astrohub, { pointerType: 'mouse' });
    fireEvent.click(cosmos);
    expect(pointed()).toBe('cosmos');
    // Baja en AstroHub y el `click` llega a Cosmos (el pin se movió bajo el dedo): solo señala.
    fireEvent.pointerDown(astrohub, { pointerType: 'mouse' });
    fireEvent.click(cosmos);
    expect(pointed()).toBe('cosmos');
    expect(onOpen).not.toHaveBeenCalled();
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
    // Solo la etiqueta recibe el puntero: el tallo (1 px) no, o cruzarlo encendería y apagaría la placa.
    expect(rule('.stem')).toContain('pointer-events: none;');
    expect(rule('.pin[data-hot] .tag')).toContain('color: var(--color-star);');
    // Las medidas en que se apoya `pinTagWidth`: la mono (0,6 em por letra), en una línea, y el borde de `borderPx`.
    expect(rule('.pin')).toContain('font-family: var(--font-mono);');
    expect(rule('.pin')).toContain('white-space: nowrap;');
    // El tallo: el degradado ámbar, con su 70 % en el token (componentes.md → «Pin de placa»).
    expect(rule('.stem')).toContain('background-image: var(--gradient-pin-stem);');
    expect(rule('.stem')).not.toContain('opacity');
    // La etiqueta, sobre el velo de los paneles: `styles.test.ts` prueba su texto (`--color-ink-soft` y, encendida,
    // `--color-star`) con AA sobre ese velo encima de una escena blanca.
    expect(rule('.tag')).toContain('background-color: var(--color-veil);');
    // Tocarlo en un móvil no pinta el resaltado del sistema.
    expect(rule('.pin')).toContain('-webkit-tap-highlight-color: transparent;');
    // Se enciende al ritmo de la fila (movimiento.md: `--dur-base`).
    expect(rule('.tag')).toContain('color var(--dur-base) var(--ease-out)');
    expect(rule('.tag')).toContain('border-color var(--dur-base) var(--ease-out);');
    // Sin selección, también en Safari (sin autoprefijador: la pareja a mano).
    expect(rule('.layer')).toContain('-webkit-user-select: none;');
    expect(rule('.layer')).toMatch(/\n\s+user-select: none;/);
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
    expect(value('--border-width')).toBe(PLATE_PIN.borderPx);
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
    expect(PINS.every(({ slug }) => pin(elements, slug).style.visibility === 'visible')).toBe(true);
    // Una escalera: de derecha a izquierda en pantalla, pisos 0, 1 y 2 (el de más a la derecha, abajo).
    const rightToLeft = [...work.pins].sort((a, b) => b.place.x - a.place.x);
    expect(
      rightToLeft.map(({ slug }) => pin(elements, slug).style.getPropertyValue('--_pin-floor')),
    ).toEqual(['0', '1', '2']);
    const cosmos = pin(elements, 'cosmos');
    cosmos.style.removeProperty('--_pin-floor');
    stepPlatePins(work, frame, elements, phone, pinWidths(NAMES));
    expect(cosmos.style.getPropertyValue('--_pin-floor')).toBe('');
  });

  it('on a phone, coming back from a project page (the layer born again), each pin is written whole: floor, mark, place', () => {
    const phone = { width: 390, height: 844 };
    const frame = turtleFrame(3, false);
    frame.aspect = phone.width / phone.height;
    frame.fov = cameraFov(frame.aspect);
    cameraPose(3, false, createParallax(), frame.camera);
    frame.reducedMotion = true;
    frame.plate = 22;
    const elements = createPinElements();
    const first = render(<PlatePins names={NAMES} elements={elements} onOpen={vi.fn()} />);
    const work = createPinWork();
    stepPlatePins(work, frame, elements, phone, pinWidths(NAMES));
    const written = (): string[][] =>
      PINS.map(({ slug }) => {
        const element = pin(elements, slug);
        return [
          element.style.getPropertyValue('--_pin-floor'),
          String(element.hasAttribute('data-hot')),
          String(element.hasAttribute('data-live')),
          element.style.transform,
          element.style.visibility,
        ];
      });
    const before = written();
    expect(before.map(([floor]) => floor).sort()).toEqual(['0', '1', '2']);
    expect(before[2]?.[1]).toBe('true');
    const old = pin(elements, 'cosmos');
    // Ir a una ficha desmonta la capa; al volver nace de nuevo (sin nada escrito) con el mismo registro.
    first.unmount();
    render(<PlatePins names={NAMES} elements={elements} onOpen={vi.fn()} />);
    expect(pin(elements, 'cosmos')).not.toBe(old);
    stepPlatePins(work, frame, elements, phone, pinWidths(NAMES));
    expect(written()).toEqual(before);
  });

  it('before the particles are painted (the shapes still on their way), none: no names over the void', () => {
    const frame = turtleFrame();
    frame.painted = false;
    const { elements, work } = step(frame);
    expect(PINS.map(({ slug }) => pin(elements, slug).style.visibility)).toEqual(['', '', '']);
    expect(work.shown).toBe(false);
    frame.painted = true;
    stepPlatePins(work, frame, elements, SIZE, pinWidths(NAMES));
    expect(pin(elements, 'cosmos').style.visibility).toBe('visible');
  });

  it('while a transmission is read (Mission control, the turtle behind its veil), they hide', () => {
    const { elements, work } = step(turtleFrame());
    const reading = turtleFrame();
    reading.transmission = true;
    stepPlatePins(work, reading, elements, SIZE, pinWidths(NAMES));
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

  it('a pin that covers the interface hides (here, the panel and the rail of a narrow desktop window)', () => {
    const frame = turtleFrame();
    const narrow = { width: 900, height: 720 };
    frame.aspect = narrow.width / narrow.height;
    frame.fov = cameraFov(frame.aspect);
    cameraPose(3, true, createParallax(), frame.camera);
    const elements = mountPins();
    const work = createPinWork();
    stepPlatePins(work, frame, elements, narrow, pinWidths(NAMES));
    const zones = keepOutZones(narrow.width, narrow.height, true);
    const zone = (name: string): KeepOutZone => {
      const found = zones.find((candidate) => candidate.name === name);
      if (found === undefined) throw new Error(`No zone ${name}`);
      return found;
    };
    const onTheGround = (slot: (typeof work.pins)[number]): PinBox => {
      const point = createScreenPoint();
      point.x = slot.place.x;
      point.y = slot.place.y;
      const box = createPinBox();
      placePinBox(point, slot.place.width, box);
      return box;
    };
    const hidden = work.pins.filter(({ box }) => !box.visible);
    expect(Object.fromEntries(hidden.map(({ slug }) => [slug, HIDDEN_AT_900[slug]]))).toEqual(
      HIDDEN_AT_900,
    );
    // Cada uno, por la pieza que ya pisa en su piso de abajo; el que se ve no pisa ninguna.
    for (const slot of hidden) {
      const box = onTheGround(slot);
      const { rect } = zone(HIDDEN_AT_900[slot.slug] ?? '');
      expect(overlapsRect(box.tag, rect) || overlapsRect(box.stem, rect), slot.slug).toBe(true);
      expect(pin(elements, slot.slug).style.visibility).not.toBe('visible');
    }
    for (const slot of work.pins.filter(({ box }) => box.visible)) {
      for (const { name, rect } of zones) {
        expect(overlapsRect(slot.place.tag, rect), `${slot.slug} over ${name}`).toBe(false);
        expect(overlapsRect(slot.place.stem, rect), `${slot.slug} over ${name}`).toBe(false);
      }
    }
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
    // Lo lee del frame (lo copia el bucle de `SceneRoot` desde `sceneStore.interlude`), no del store.
    frame.transmission = true;
    frameCallbacks.at(-1)?.({ size: SIZE });
    expect(pin(elements, 'chessmate').style.visibility).toBe('hidden');
  });
});
