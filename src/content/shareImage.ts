// La imagen para compartir del sitio (docs/01-contenido/assets.md → «Imagen para compartir»): la sacan `npm run og`
// (scripts/og.ts) y `vite-imagetools` (`?share`). Como `projects/media.ts`, solo la entiende Vite: la importan las
// rutas, no lo que carga el contenido sin Vite.

import shareEn from '../assets/og/og-en.png?share';
import shareEs from '../assets/og/og-es.png?share';
import type { SiteShareImage } from './types';

/** Una por idioma: el eyebrow del rol va en el idioma de la página. */
export const siteShareImage: SiteShareImage = {
  share: { en: shareEn, es: shareEs },
  alt: {
    en: 'Víctor Pérez, frontend developer (React + TypeScript), next to a particle turtle swimming through space.',
    es: 'Víctor Pérez, desarrollador frontend (React + TypeScript), junto a una tortuga de partículas que nada por el espacio.',
  },
};
