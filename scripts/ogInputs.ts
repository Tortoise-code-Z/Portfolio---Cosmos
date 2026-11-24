/**
 * Lo que entra en la imagen para compartir y en los iconos del favicon (`npm run og`, `scripts/og.ts`) y su huella
 * (`src/assets/og/og.json`), como las fotos fijas con `stills.json`: si cambia algo de lo que se ve en ellas y no se
 * rehacen, `ogInputs.test.ts` falla y pide `npm run og` (docs/01-contenido/assets.md → «Imagen para compartir»).
 *
 * Entra en la huella: el nombre y el rol (`profile.name`, `hero.kicker` en los dos idiomas), el favicon, los tokens, la
 * foto fija de la tortuga, las fuentes y el propio generador. El dominio (`VITE_SITE_URL`, el mismo que las canónicas)
 * va aparte en `og.json` (`host`): Vitest define su propio `VITE_SITE_URL`, así que lo compara el e2e de SEO, que
 * corre con el del build.
 *
 * Ojo: `og.ts` lo carga con Node tal cual, sin Vite. El contenido que importa (`profile`, `texts/*`) y `siteUrl` solo
 * pueden tener imports de tipos o con extensión `.ts`: un import de valor sin extensión rompería `npm run og` (y ni
 * `typecheck` ni el CI lo verían).
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { loadEnv } from 'vite';

import { profile } from '../src/content/profile.ts';
import { en } from '../src/content/texts/en.ts';
import { es } from '../src/content/texts/es.ts';
import { parseSiteUrl } from '../src/lib/env/siteUrl/siteUrl.ts';

/** La foto fija de la tortuga (capítulo 3) en escritorio: 4320×1800, la tortuga a la derecha del centro. */
export const OG_STILL = 'src/assets/scene-stills/webp/scene-still-desktop-3.webp';

/** Dónde guarda `og.ts` la huella de lo que ha usado. */
export const OG_JSON = 'src/assets/og/og.json';

/**
 * Las fuentes del sitio que pinta la imagen (el nombre en el display, el eyebrow y el dominio en mono). Repite las
 * `@font-face` de `src/styles/fonts.css` (familias, pesos y anchos): si cambian allí, cambian aquí; los archivos
 * entran en la huella.
 */
export const OG_FONTS = [
  {
    family: 'Anybody',
    weight: '100 900',
    stretch: '50% 150%',
    file: 'node_modules/@fontsource-variable/anybody/files/anybody-latin-standard-normal.woff2',
  },
  {
    family: 'IBM Plex Mono',
    weight: '400',
    stretch: '100%',
    file: 'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
  },
  {
    family: 'IBM Plex Mono',
    weight: '500',
    stretch: '100%',
    file: 'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2',
  },
] as const;

/** Los textos del contenido que se leen en la imagen: el nombre y el eyebrow del rol de cada idioma. */
export function ogTexts(): {
  readonly name: string;
  readonly kicker: { readonly en: string; readonly es: string };
} {
  return { name: profile.name, kicker: { en: en['hero.kicker'], es: es['hero.kicker'] } };
}

/** El dominio que enseña la imagen: el de `VITE_SITE_URL` (el `.env` o el entorno), el de las canónicas. */
export function ogHost(root: string): string {
  return new URL(parseSiteUrl(loadEnv('production', root, 'VITE_').VITE_SITE_URL)).host;
}

/** Los archivos que dan forma a la imagen y a los iconos (texto con finales LF; las imágenes y fuentes, byte a byte). */
const TEXT_INPUTS = [
  'scripts/og.ts',
  'scripts/ogInputs.ts',
  'public/favicon.svg',
  'src/styles/tokens.css',
];
const BINARY_INPUTS = [OG_STILL, ...OG_FONTS.map(({ file }) => file)];

/** La huella (sha256) de lo que entra en la imagen y los iconos (sin el dominio: ver arriba). */
export function ogFingerprint(root: string): string {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(ogTexts()));
  for (const file of TEXT_INPUTS) {
    hash.update(`\n${file}\n`);
    hash.update(readFileSync(join(root, file), 'utf8').replaceAll('\r\n', '\n'));
  }
  for (const file of BINARY_INPUTS) {
    hash.update(`\n${file}\n`);
    hash.update(readFileSync(join(root, file)));
  }
  return hash.digest('hex');
}
