import { useFrame, type RootState } from '@react-three/fiber';
import {
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import {
  releaseActiveProject,
  selectActiveProject,
  setActiveProject,
  useUiStore,
} from '~/stores/uiStore/uiStore';

import { PLATE_LOOK, PLATE_PIN, PLATE_SLOTS } from '../config/plateSlots/plateSlots';
import type { ScenePoint } from '../config/sceneConfig';
import {
  createWrittenLabel,
  registerLabel,
  writeLabel,
  type LabelElements,
  type WritableLabel,
} from '../labelWriter/labelWriter';
import { createZoneCache, zonesFor, type ZoneCache } from '../math/labelFit/labelFit';
import { shapePresence } from '../math/chapterPresence/chapterPresence';
import {
  createPinBox,
  fitPins,
  pinTagWidth,
  placePinBox,
  plateAnchor,
  swayTurtlePoint,
  type PinBox,
} from '../math/platePins/platePins';
import {
  createScreenPoint,
  projectToScreen,
  type ScreenPoint,
} from '../math/projection/projection';
import { motionOf, shipsInPlay, type SceneFrame } from '../sceneMaterials/sceneMaterials';
import { SHAPE } from '~/lib/scroll/shapeTrack/shapeTrack';
import { SCENE_PLATES } from '../useSceneShapes/useSceneShapes';
import styles from './PlatePins.module.css';

/** Los pins montados, por slug del proyecto: la escena los coloca en cada frame (`PlatePinsFrame`). */
export type PinElements = LabelElements;

export function createPinElements(): PinElements {
  return new Map();
}

/** Un pin: su proyecto, su placa y su ancla en el caparazón. */
interface Pin {
  readonly slug: string;
  readonly label: number;
  readonly base: ScenePoint;
}

/**
 * Un pin durante la visita: lo que ocupa en este frame (`place`; su etiqueta es la caja que se escribe), lo último
 * escrito y el piso escrito, y en qué elemento.
 */
interface PinSlot extends Pin, WritableLabel {
  readonly place: PinBox;
  floor: number;
  floorOn: HTMLElement | null;
}

/** Cada pin, en el orden de la asignación (el destacado primero). */
export const PINS: readonly Pin[] = SCENE_PLATES.flatMap(({ slug, label }) => {
  const slot = PLATE_SLOTS.find((candidate) => candidate.label === label);
  return slot === undefined ? [] : [{ slug, label, base: plateAnchor(slot) }];
});

/** El ancho de la etiqueta de cada pin, en el orden de `PINS`, con la letra de escritorio y con la de móvil. */
export interface PinWidths {
  readonly wide: readonly number[];
  readonly narrow: readonly number[];
}

export function pinWidths(names: Readonly<Record<string, string>> | null): PinWidths {
  const of = (fontPx: number): number[] =>
    PINS.map(({ slug }) => pinTagWidth(names?.[slug] ?? '', fontPx));
  return { wide: of(PLATE_PIN.fontPx), narrow: of(PLATE_PIN.narrowFontPx) };
}

/** Lo que dura toda la visita (cero objetos nuevos por frame, ADR-004). */
export interface PinWork {
  readonly pins: readonly PinSlot[];
  /** Lo que ocupan, para `fitPins`, que lo reordena en sitio de derecha a izquierda en cada frame. */
  readonly order: PinBox[];
  readonly at: [number, number, number];
  readonly point: ScreenPoint;
  readonly viewport: { width: number; height: number; fov: number };
  readonly zones: ZoneCache;
  /** Algún pin podía verse en el frame anterior (hay que ocultarlos al irse el capítulo). */
  shown: boolean;
}

export function createPinWork(): PinWork {
  const pins = PINS.map((pin): PinSlot => {
    const place = createPinBox();
    return {
      ...pin,
      place,
      box: place.tag,
      written: createWrittenLabel(),
      floor: 0,
      floorOn: null,
    };
  });
  return {
    pins,
    order: pins.map(({ place }) => place),
    at: [0, 0, 0],
    point: createScreenPoint(),
    viewport: { width: 1, height: 1, fov: 55 },
    zones: createZoneCache(),
    shown: false,
  };
}

/**
 * Un frame de los pins (docs/04-escena/constelaciones-y-placas.md → «Pins»): cada ancla se mece con la tortuga, se
 * proyecta con la pose de la cámara de este frame (la deja `CameraRig`, que va antes) y el pin se planta con el pie
 * en ella; el que choca sube un piso y, si no cabe en ninguno, se oculta (`fitPins`, de derecha a izquierda, contra
 * lo que tapa la interfaz y entre ellos). Se ven con la presencia del capítulo 3, reciben el puntero por encima de
 * `interactiveFrom` y se marcan (`data-hot`) con su placa encendida (`frame.plate`: el proyecto señalado o el
 * ciclo). Van con la tortuga (`shapePresence`: con naves, se apagan mientras se convierte en la nave nodriza). Sin naves
 * (movimiento reducido), ninguno mientras se lee Mission control (`frame.transmission`: la tortuga sigue detrás de su
 * velo; sus etiquetas quedarían tras el texto) ni antes de que las partículas se pinten (`frame.painted`: entrando
 * por `/#projects`, mientras llegan las formas, flotarían sobre el vacío). Solo se escribe lo que cambia.
 */
export function stepPlatePins(
  work: PinWork,
  frame: Readonly<SceneFrame>,
  elements: PinElements,
  size: Readonly<{ width: number; height: number }>,
  widths: PinWidths,
): void {
  const presence =
    (frame.transmission && !shipsInPlay(frame)) || !frame.painted
      ? 0
      : shapePresence(frame.shapes, SHAPE.turtle);
  // Sin capítulo, y con los pins ya ocultos, nada que colocar.
  if (presence === 0 && !work.shown) return;
  work.shown = presence > 0;
  const { viewport, point, at } = work;
  viewport.width = size.width;
  viewport.height = size.height;
  viewport.fov = frame.fov;
  const sizes = frame.wide ? widths.wide : widths.narrow;
  const motion = motionOf(frame);
  let index = 0;
  for (const pin of work.pins) {
    swayTurtlePoint(pin.base, frame.time, motion, at);
    projectToScreen(at, frame.camera, viewport, point);
    placePinBox(point, sizes[index] ?? 0, pin.place);
    index += 1;
    // Una proyección que no da un número (un lienzo sin tamaño) no se coloca: nunca `translate(NaNpx, …)`.
    pin.box.wanted =
      point.inFront &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      presence > 0 &&
      elements.has(pin.slug);
  }
  fitPins(work.order, zonesFor(work.zones, size.width, size.height, frame.wide));
  const interactive = presence > PLATE_LOOK.interactiveFrom;
  for (const pin of work.pins) {
    const element = elements.get(pin.slug);
    writeLabel(element, pin, presence, frame.plate === pin.label, interactive);
    writeFloor(element, pin);
  }
}

/**
 * El piso del pin (`--_pin-floor`: el CSS alarga el tallo), solo si se ve y cambió, o en un elemento nuevo (una cadena
 * nueva al cambiar, la excepción de `labelWriter`).
 */
function writeFloor(element: HTMLElement | undefined, pin: PinSlot): void {
  if (element === undefined || !pin.box.visible) return;
  if (pin.floorOn === element && pin.floor === pin.place.floor) return;
  pin.floorOn = element;
  pin.floor = pin.place.floor;
  element.style.setProperty('--_pin-floor', String(pin.floor));
}

export interface PlatePinsFrameProps {
  /** El frame que rellena el bucle (`SceneRoot`), con la pose de la cámara que deja `CameraRig`. */
  readonly frame: Readonly<SceneFrame>;
  /** El nombre de cada proyecto (para medir su etiqueta); `null` sin pins. */
  readonly names: Readonly<Record<string, string>> | null;
  readonly elements: PinElements;
}

/** Coloca los pins en cada frame, dentro del lienzo (`useFrame`); no pinta nada de Three. */
export function PlatePinsFrame({ frame, names, elements }: PlatePinsFrameProps): null {
  const widths = useMemo(() => pinWidths(names), [names]);
  const [work] = useState(createPinWork);
  useFrame((state: RootState) => {
    stepPlatePins(work, frame, elements, state.size, widths);
  });
  return null;
}

export interface PlatePinsProps {
  /** El nombre de cada proyecto, por slug; `null` fuera del viaje (sin pins). */
  readonly names: Readonly<Record<string, string>> | null;
  readonly elements: PinElements;
  /** Abre la ficha del proyecto (`SceneMount`: navega en el idioma de la página). */
  readonly onOpen: (slug: string) => void;
}

/**
 * El gesto del puntero que acaba en `click`: en qué pin empezó, de qué tipo y si su proyecto ya estaba señalado al
 * empezar. Sin pin (`null`): ningún gesto en curso.
 */
interface PinGesture {
  slug: string | null;
  mouse: boolean;
  wasPointed: boolean;
}

const NO_GESTURE: Readonly<PinGesture> = { slug: null, mouse: false, wasPointed: false };

/**
 * Los pins de las placas (F4.4b; docs/02-experiencia/capitulos/03-tortuga.md → «Interacciones»): elementos del DOM en
 * una capa propia montada en `body`, como las etiquetas de las estrellas, en el orden de la asignación. Decorativos
 * (`aria-hidden`): su función está en las filas. Los que la escena marca con `data-live` reciben el puntero: el ratón
 * encima señala su proyecto (salir lo suelta) y un clic abre su ficha; en táctil, el primer toque señala y el segundo
 * abre. «Primer» se decide al bajar el dedo: el toque limpio fuera de Projects apaga antes del `click`. Al abrir, su
 * proyecto queda señalado mientras llega la ficha (como «View project» en la fila). Un gesto que no acaba en su pin
 * (deslizar, soltar en otro) no cuenta: el `click` siguiente sin el suyo solo señala. No es un enlace: Ctrl/Cmd+clic
 * o el botón central no abren otra pestaña (la fila tiene el enlace completo).
 */
export function PlatePins({ names, elements, onOpen }: PlatePinsProps): ReactNode {
  const gesture = useRef<PinGesture>({ ...NO_GESTURE });
  if (names === null) return null;
  // El slug de un pin que existe, nunca `''` ni uno inventado (como `ConstellationLabels.groupOf`).
  const slugOf = (event: { currentTarget: HTMLElement }): string | null =>
    PINS.find(({ slug }) => slug === event.currentTarget.dataset.pin)?.slug ?? null;

  return createPortal(
    <div className={styles.layer} aria-hidden="true" data-plate-pins="">
      {PINS.map(({ slug }) => (
        // Decorativo (la capa es `aria-hidden`): el teclado y el lector usan las filas de Projects.
        // eslint-disable-next-line jsx-a11y-x/no-static-element-interactions, jsx-a11y-x/click-events-have-key-events
        <span
          key={slug}
          ref={(element) => registerLabel(elements, slug, element)}
          className={styles.pin}
          data-pin={slug}
          onPointerEnter={(event: PointerEvent<HTMLElement>) => {
            const pin = slugOf(event);
            if (pin !== null && event.pointerType === 'mouse') setActiveProject(pin);
          }}
          onPointerLeave={(event: PointerEvent<HTMLElement>) => {
            const pin = slugOf(event);
            if (pin !== null && event.pointerType === 'mouse') releaseActiveProject(pin);
          }}
          onPointerDown={(event: PointerEvent<HTMLElement>) => {
            const pin = slugOf(event);
            if (pin === null) return;
            gesture.current = {
              slug: pin,
              mouse: event.pointerType === 'mouse',
              wasPointed: selectActiveProject(useUiStore.getState()) === pin,
            };
          }}
          onPointerCancel={() => {
            gesture.current = { ...NO_GESTURE };
          }}
          onClick={(event: MouseEvent<HTMLElement>) => {
            const pin = slugOf(event);
            const { slug, mouse, wasPointed } = gesture.current;
            gesture.current = { ...NO_GESTURE };
            if (pin === null) return;
            // Siempre señalado (la captura de «tocar fuera» lo acaba de soltar); y abre si el gesto era suyo.
            setActiveProject(pin);
            if (slug === pin && (mouse || wasPointed)) onOpen(pin);
          }}
        >
          <span className={styles.tag}>{names[slug] ?? ''}</span>
          <span className={styles.stem} />
        </span>
      ))}
    </div>,
    document.body,
  );
}
