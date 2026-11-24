// La imagen para compartir del sitio (docs/01-contenido/assets.md → «Imagen para compartir»): la sacan `npm run og`
// (scripts/og.ts) y `vite-imagetools` (`?share`). Como `projects/media.ts`, solo la entiende Vite: la importan las
// rutas (y los tests, con el sustituto de Vitest), no lo que carga el contenido sin Vite (los e2e, `og.ts`). El `alt`
// cuenta lo que se ve: el texto, como texto (no sale una foto de Víctor); copiado en `assets.md`.

import shareEn from '../assets/og/og-en.png?share';
import shareEs from '../assets/og/og-es.png?share';
import type { SiteShareImage } from './types';

/** Una por idioma: el eyebrow del rol va en el idioma de la página. */
export const siteShare: SiteShareImage = {
  share: { en: shareEn, es: shareEs },
  alt: {
    en: '“Víctor Pérez” in large type under “Tortoise_code · Frontend developer · React + TypeScript”, with tortoisecode.dev, beside a particle turtle swimming through space.',
    es: '«Víctor Pérez» en letra grande bajo «Tortoise_code · Desarrollador frontend · React + TypeScript», con tortoisecode.dev, junto a una tortuga de partículas que nada por el espacio.',
  },
};
