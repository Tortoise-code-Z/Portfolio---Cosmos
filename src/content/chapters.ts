// Capítulos del viaje en orden (docs/02-experiencia/navegacion.md → «Rutas y URLs»): el ancla es la
// misma en los dos idiomas y el inicio no lleva. Lo leen los capítulos, el raíl y el mapeo de scroll.

/** Posición del capítulo en el viaje: también es el valor de `m` en reposo (scroll-y-escena.md). */
export type ChapterIndex = 0 | 1 | 2 | 3 | 4;

export type ChapterAnchor = 'about' | 'skills' | 'projects' | 'contact';

/** Los capítulos en orden de lectura. */
export const CHAPTER_INDICES: readonly ChapterIndex[] = [0, 1, 2, 3, 4];

export const CHAPTER_ANCHORS: Readonly<Record<ChapterIndex, ChapterAnchor | null>> = {
  0: null,
  1: 'about',
  2: 'skills',
  3: 'projects',
  4: 'contact',
};

/** Ancla de un capítulo en la URL (`#projects`); el inicio no lleva. */
export function chapterHash(index: ChapterIndex): string {
  const anchor = CHAPTER_ANCHORS[index];
  return anchor === null ? '' : `#${anchor}`;
}

/**
 * Los interludios (fase C, ADR-034): secciones entre capítulos que «cambian de canal». No son capítulos: no tienen
 * forma propia (la escena se queda en la del capítulo anterior) ni índice en `m`.
 */
export type InterludeId = 'mission-log';

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
};

/** Los interludios en orden de lectura. */
export const INTERLUDES: readonly Interlude[] = [INTERLUDE['mission-log']];

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
};

/** ¿Es un interludio esta parada? */
export function isInterludeStop(stop: JourneyStop): stop is InterludeId {
  return stop in INTERLUDE;
}

/** El capítulo de una parada que no es un interludio (`chapter-2` → 2). */
export function stopChapter(stop: ChapterStop): ChapterIndex {
  return Number(stop.slice('chapter-'.length)) as ChapterIndex;
}

/** Un tramo del viaje medido en el DOM: un capítulo, la pantalla de un interludio o su cola. */
export type JourneySegment =
  | { readonly kind: 'chapter'; readonly chapter: ChapterIndex }
  | { readonly kind: 'interlude' | 'interlude-tail'; readonly interlude: InterludeId };

/**
 * Los tramos del viaje en orden, con lo que hace la escena en cada uno (scroll-y-escena.md → «Tramos del viaje»):
 * su forma (`base`) y desde qué fracción cambia a la siguiente (`morphStart`; `null`, quieta). About se queda quieta
 * entera y el Mission log también: la nebulosa cambia a galaxia en la cola del interludio, al salir de él. El inicio
 * cambia desde el principio (el Big Bang); Skills y Projects, en su segunda mitad (la columna «Ventana de morph»). El
 * último no cambia.
 */
export const JOURNEY_SEGMENTS: readonly (JourneySegment & {
  readonly base: ChapterIndex;
  readonly morphStart: number | null;
})[] = [
  { kind: 'chapter', chapter: 0, base: 0, morphStart: 0 },
  { kind: 'chapter', chapter: 1, base: 1, morphStart: null },
  { kind: 'interlude', interlude: 'mission-log', base: 1, morphStart: null },
  { kind: 'interlude-tail', interlude: 'mission-log', base: 1, morphStart: 0 },
  { kind: 'chapter', chapter: 2, base: 2, morphStart: 0.52 },
  { kind: 'chapter', chapter: 3, base: 3, morphStart: 0.55 },
  { kind: 'chapter', chapter: 4, base: 4, morphStart: null },
];
