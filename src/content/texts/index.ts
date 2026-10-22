import type { Locale, UiTexts } from '../types';
import { en } from './en';
import { es } from './es';

/** Textos de interfaz por idioma. `useT` (F2.3) lee de aquí. */
export const uiTexts: Readonly<Record<Locale, UiTexts>> = { en, es };
