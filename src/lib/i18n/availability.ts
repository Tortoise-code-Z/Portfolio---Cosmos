import type { Locale, WorkMode } from '~/content/types';

import { capitalize, formatList } from './format';
import { translate } from './translate';

/**
 * Frase de los modos de trabajo armada desde `profile.availability.modes` (una sola fuente,
 * EST-F2-3-7): EN «Remote, hybrid, or on-site» · ES «Remoto, híbrido o presencial».
 */
export function workModesText(locale: Locale, modes: readonly WorkMode[]): string {
  const names = modes.map((mode) => translate(locale, `availability.mode.${mode}`));
  return capitalize(locale, formatList(locale, names, 'disjunction'));
}
