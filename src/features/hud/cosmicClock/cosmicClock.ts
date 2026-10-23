import type { ChapterIndex } from '~/content/chapters';
import type { Locale, UiKey } from '~/content/types';
import { formatNumber } from '~/lib/i18n/format/format';
import { translate } from '~/lib/i18n/translate/translate';
import { lerp } from '~/lib/math/lerp/lerp';

// Reloj cósmico del HUD (docs/02-experiencia/scroll-y-escena.md → «Lo que depende de m»): tiempo
// interpolado en escala logarítmica entre los capítulos 0 → 1 → 2; ∞ en la tortuga y 13.800 millones
// de años en la Tierra. Pura: el HUD la llama solo cuando cambia `m` y pinta solo si cambia el texto.

const SECONDS_PER_YEAR = 31_557_600; // año juliano
const MILLION = 1e6;
const BILLION = 1e9;
/** Paso del reloj en miles de millones de años: «13.8 billion» / «13.800 millones». */
const BILLION_STEP = BILLION / 10;

/** Tiempo de Planck (10⁻⁴³ s), en años: lo primero que se puede contar tras la singularidad. */
const PLANCK_YEARS = 1e-43 / SECONDS_PER_YEAR;

/** Edad del universo en cada capítulo con reloj, en años (eyebrows de `textos-sitio.md`). */
const CHAPTER_YEARS = {
  0: PLANCK_YEARS,
  1: 200 * MILLION,
  2: 1 * BILLION,
  4: 13_800 * MILLION,
} as const satisfies Partial<Record<ChapterIndex, number>>;

/** Hasta aquí el reloj marca «t = 0 s»: el primer píxel de scroll aún es la singularidad. */
const ZERO_UNTIL_M = 0.004;

/**
 * La tortuga vive fuera del tiempo: el reloj marca ∞ mientras es el capítulo activo, de `m` 2,5 a 3,5
 * (`round(m) = 3`, como el raíl y la escala).
 */
const MYTHIC_FROM_M = 2.5;
const MYTHIC_UNTIL_M = 3.5;

/** Cifras significativas de los años y los millones de años mientras el reloj corre. */
const SIGNIFICANT_DIGITS = 2;

const SCALE_KEYS = {
  0: 'hud.scale.0',
  1: 'hud.scale.1',
  2: 'hud.scale.2',
  3: 'hud.scale.3',
  4: 'hud.scale.4',
} as const satisfies Readonly<Record<ChapterIndex, UiKey>>;

const SUPERSCRIPT: Readonly<Record<string, string>> = {
  '-': '⁻',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

/**
 * El texto del reloj en tres trozos: lo de antes, el valor que cambia (en ámbar,
 * docs/03-diseno/componentes.md → «HUD») y lo de después. Sin valor, todo va en `before`.
 */
export interface ClockText {
  readonly before: string;
  readonly value: string;
  readonly after: string;
}

/** Marca dónde va el valor dentro del texto traducido (no aparece en ningún texto real). */
const VALUE_MARK = '\u0000';

function splitAtValue(text: string, value: string): ClockText {
  const [before = '', after = ''] = text.split(VALUE_MARK);
  return { before, value, after };
}

function plain(text: string): ClockText {
  return { before: text, value: '', after: '' };
}

/** Exponente en superíndice: `-43` → `⁻⁴³`. */
export function superscript(exponent: number): string {
  return Array.from(String(exponent), (char) => SUPERSCRIPT[char] ?? char).join('');
}

/** `value` con `SIGNIFICANT_DIGITS` cifras significativas: 123.456 → 120.000. */
function roundSignificant(value: number): number {
  return Number(value.toPrecision(SIGNIFICANT_DIGITS));
}

/** Años del reloj para un `m` fuera de la singularidad y de la tortuga. */
function yearsAt(m: number): number {
  if (m >= MYTHIC_UNTIL_M) return CHAPTER_YEARS[4];
  if (m >= 2) return CHAPTER_YEARS[2];
  const from = m < 1 ? CHAPTER_YEARS[0] : CHAPTER_YEARS[1];
  const to = m < 1 ? CHAPTER_YEARS[1] : CHAPTER_YEARS[2];
  return 10 ** lerp(Math.log10(from), Math.log10(to), m - Math.floor(m));
}

/**
 * Edad del universo con la unidad que le toca: segundos (en potencias de 10) hasta 1 año, después
 * años, millones y miles de millones. En miles de millones, EN cuenta en `billion` con un decimal
 * («13.8 billion») y ES en millones («13.800 millones»), según la regla 5 de docs/01-contenido.
 */
export function formatYears(locale: Locale, years: number): ClockText {
  if (years < 1) {
    const exponent = superscript(Math.round(Math.log10(years * SECONDS_PER_YEAR)));
    return splitAtValue(translate(locale, 'hud.seconds', { exp: VALUE_MARK }), exponent);
  }
  if (years < MILLION) {
    const n = formatNumber(locale, roundSignificant(years));
    return splitAtValue(translate(locale, 'hud.years', { n: VALUE_MARK }), n);
  }
  // Se redondea antes de elegir la unidad: 996 millones ya son «1 billion».
  const millions = roundSignificant(years / MILLION);
  if (millions < BILLION / MILLION) {
    const n = formatNumber(locale, millions);
    return splitAtValue(translate(locale, 'hud.millionYears', { n: VALUE_MARK }), n);
  }
  // La misma precisión en los dos idiomas: una décima de billion = 100 millones.
  const n =
    locale === 'en'
      ? formatNumber(locale, years / BILLION, { maximumFractionDigits: 1 })
      : formatNumber(locale, Math.round(years / BILLION_STEP) * (BILLION_STEP / MILLION));
  return splitAtValue(translate(locale, 'hud.billionYears', { n: VALUE_MARK }), n);
}

/** El reloj del HUD para un `m` (0–4). */
export function cosmicClock(locale: Locale, m: number): ClockText {
  if (m < ZERO_UNTIL_M) return plain(translate(locale, 'hud.zero'));
  if (m >= MYTHIC_FROM_M && m < MYTHIC_UNTIL_M) return plain(translate(locale, 'hud.mythic'));
  return formatYears(locale, yearsAt(m));
}

/** La escala del capítulo (`hud.scale.<i>`). */
export function cosmicScale(locale: Locale, chapter: ChapterIndex): string {
  return translate(locale, SCALE_KEYS[chapter]);
}
