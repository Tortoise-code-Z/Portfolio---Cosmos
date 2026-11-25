// Capítulos del viaje en orden (docs/02-experiencia/navegacion.md → «Rutas y URLs»): el ancla es la
// misma en los dos idiomas y el inicio no lleva. Lo leen los capítulos, el raíl y el mapeo de scroll.

/** Posición del capítulo en el viaje: también es el valor de `m` en reposo (scroll-y-escena.md). */
export type ChapterIndex = 0 | 1 | 2 | 3 | 4 | 5;

export type ChapterAnchor = 'about' | 'skills' | 'projects' | 'contact' | 'crew-file';

/** Los capítulos en orden de lectura. */
export const CHAPTER_INDICES: readonly ChapterIndex[] = [0, 1, 2, 3, 4, 5];

export const CHAPTER_ANCHORS: Readonly<Record<ChapterIndex, ChapterAnchor | null>> = {
  0: null,
  1: 'about',
  2: 'skills',
  3: 'projects',
  4: 'contact',
  5: 'crew-file',
};

/**
 * El epílogo (fase C · paso 6, ADR-034): el último capítulo, el Crew file. Es un capítulo (tiene índice en `m` y su
 * parada en el raíl), pero se pinta como una transmisión, en el canal verde (`docs/02-experiencia/capitulos/05-crew-file.md`).
 */
export const EPILOGUE = 5 satisfies ChapterIndex;

/** Ancla de un capítulo en la URL (`#projects`); el inicio no lleva. */
export function chapterHash(index: ChapterIndex): string {
  const anchor = CHAPTER_ANCHORS[index];
  return anchor === null ? '' : `#${anchor}`;
}

/**
 * Los interludios (fase C, ADR-034): secciones entre capítulos que «cambian de canal». No son capítulos: no tienen
 * forma propia (la escena se queda en la del capítulo anterior) ni índice en `m`.
 */
export type InterludeId = 'mission-log' | 'mission-control';

/** Un interludio: su ancla (la misma en los dos idiomas), el capítulo tras el que va y el que le sigue. */
export interface Interlude {
  readonly id: InterludeId;
  readonly anchor: string;
  readonly after: ChapterIndex;
  /** Adónde lleva «Skip transmission»: el capítulo que viene después. */
  readonly next: ChapterIndex;
}

/** Los interludios por id. */
export const INTERLUDE: Readonly<Record<InterludeId, Interlude>> = {
  'mission-log': { id: 'mission-log', anchor: 'mission-log', after: 1, next: 2 },
  'mission-control': { id: 'mission-control', anchor: 'mission-control', after: 3, next: 4 },
};

/** Los interludios en orden de lectura. */
export const INTERLUDES: readonly Interlude[] = [
  INTERLUDE['mission-log'],
  INTERLUDE['mission-control'],
];

/** Una parada del raíl que es un capítulo. */
export type ChapterStop = `chapter-${ChapterIndex}`;

/** Una parada del raíl: un capítulo o un interludio (lo que marca y lo que conserva el cambio de idioma). */
export type JourneyStop = ChapterStop | InterludeId;

/** La parada de cada capítulo: la comparten el raíl y el selector del store, sin armar el id a mano. */
export const CHAPTER_STOPS: Readonly<Record<ChapterIndex, ChapterStop>> = {
  0: 'chapter-0',
  1: 'chapter-1',
  2: 'chapter-2',
  3: 'chapter-3',
  4: 'chapter-4',
  5: 'chapter-5',
};

/** ¿Es un interludio esta parada? */
export function isInterludeStop(stop: JourneyStop): stop is InterludeId {
  return stop in INTERLUDE;
}

/**
 * ¿Se lee esta parada como una transmisión (un interludio o el epílogo)? Tienen su propio reloj parado en el pie: el
 * HUD se esconde.
 */
export function isTransmissionStop(stop: JourneyStop): boolean {
  return isInterludeStop(stop) || stop === CHAPTER_STOPS[EPILOGUE];
}

/** El capítulo de una parada que no es un interludio (`chapter-2` → 2). */
export function stopChapter(stop: ChapterStop): ChapterIndex {
  return Number(stop.slice('chapter-'.length)) as ChapterIndex;
}

/**
 * Un tramo del viaje medido en el DOM: un capítulo, la pantalla de un interludio o su cola, o la llegada de un
 * capítulo (el tramo antes de leerlo en el que se queda fijo mientras la escena lo trae: hoy, el epílogo; ADR-039).
 */
export type JourneySegment =
  | { readonly kind: 'chapter' | 'arrival'; readonly chapter: ChapterIndex }
  | { readonly kind: 'interlude' | 'interlude-tail'; readonly interlude: InterludeId };

/**
 * Los tramos del viaje en orden, con lo que hace la escena en cada uno (scroll-y-escena.md → «Tramos del viaje»):
 * su forma (`base`) y desde qué fracción cambia a la siguiente (`morphStart`; `null`, quieta). Antes de cada interludio,
 * el capítulo y la pantalla del interludio se quedan quietos y la forma cambia en su cola, al salir: About y el Mission
 * log con la nebulosa (a galaxia), Projects y Mission control con la tortuga (a la Tierra). El inicio cambia desde el
 * principio (el Big Bang) y Skills en su segunda mitad (la columna «Ventana de morph»). Contacto se queda con la
 * Tierra: el epílogo tiene su llegada (ADR-039), un tramo medido en su propia sección (fija mientras dura) en el que la
 * Tierra pasa al retrato; lo lee el marcador del final de la llegada (`data-landing`), ya en el retrato.
 */
export const JOURNEY_SEGMENTS: readonly (JourneySegment & {
  readonly base: ChapterIndex;
  readonly morphStart: number | null;
  readonly linear?: true;
})[] = [
  { kind: 'chapter', chapter: 0, base: 0, morphStart: 0 },
  { kind: 'chapter', chapter: 1, base: 1, morphStart: null },
  { kind: 'interlude', interlude: 'mission-log', base: 1, morphStart: null },
  { kind: 'interlude-tail', interlude: 'mission-log', base: 1, morphStart: 0 },
  { kind: 'chapter', chapter: 2, base: 2, morphStart: 0.52 },
  { kind: 'chapter', chapter: 3, base: 3, morphStart: null },
  { kind: 'interlude', interlude: 'mission-control', base: 3, morphStart: null },
  { kind: 'interlude-tail', interlude: 'mission-control', base: 3, morphStart: 0 },
  { kind: 'chapter', chapter: 4, base: 4, morphStart: null },
  // La llegada del epílogo: la Tierra pasa al retrato (la última forma del mapa de formas, ADR-041) mientras la
  // sección se queda fija, al ritmo del scroll (`linear`: sus cortes se cuentan en scroll, ADR-039). Si el retrato aún
  // no ha llegado, con `m` entre 4 y 5 la escena se queda en la Tierra (docs/04-escena/formas.md → «Retrato»).
  { kind: 'arrival', chapter: 5, base: 4, morphStart: 0, linear: true },
  { kind: 'chapter', chapter: 5, base: 5, morphStart: null },
];
