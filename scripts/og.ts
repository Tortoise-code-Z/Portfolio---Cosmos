/**
 * `npm run og` (docs/01-contenido/assets.md → «Imagen para compartir» y «Favicon e iconos»): saca con el Chromium de
 * Playwright la imagen para compartir del sitio, una por idioma, y los iconos PNG del favicon. Las imágenes se
 * commitean: se rehacen solo si cambian el nombre, el rol (`hero.kicker`), el favicon, los tokens o la foto fija de
 * la tortuga.
 *
 * - `src/assets/og/og-{en,es}.png` (1200×630): la foto fija de la tortuga (modo sin WebGL) a la derecha y, como el
 *   hero, el eyebrow del rol, el nombre y el dominio. Entran al build con `?share` (JPEG de 1200 px, con hash).
 * - `public/apple-touch-icon.png` (180, a sangre: iOS redondea), `public/icon-192.png` y `public/icon-512.png`
 *   (el manifest), del mismo `public/favicon.svg`.
 *
 * Los textos salen del contenido y el estilo, de `tokens.css` y de las fuentes del sitio: nada se copia a mano.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, type Page } from '@playwright/test';

import { profile } from '../src/content/profile.ts';
import { cosmos } from '../src/content/projects/cosmos.ts';
import { en } from '../src/content/texts/en.ts';
import { es } from '../src/content/texts/es.ts';

/** El dominio que enseña la imagen: la demo de Cosmos es el propio sitio. */
const SITE_URL = cosmos.links.demo ?? '';
if (SITE_URL === '') throw new Error('og: falta la URL del sitio (cosmos.links.demo)');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const fromRoot = (path: string): string => join(ROOT, path);

/** Medidas de la imagen para compartir (proporción 1,91:1 que piden Open Graph y LinkedIn). */
const SHARE = { width: 1200, height: 630 } as const;

/** La foto fija de la tortuga (capítulo 3) en escritorio: 4320×1800, la tortuga a la derecha del centro. */
const TURTLE_STILL = 'src/assets/scene-stills/webp/scene-still-desktop-3.webp';

/**
 * Dónde cae la foto: a toda la altura (1512 px de ancho) y desplazada para que la tortuga, de la estela a la cabeza
 * (~33–74 % del ancho de la foto), quede entre x ≈ 560 y 1170: a su izquierda, el texto.
 */
const STILL_LEFT_PX = 60;

const ICONS = [
  { file: 'public/apple-touch-icon.png', size: 180, bleed: true },
  { file: 'public/icon-192.png', size: 192, bleed: false },
  { file: 'public/icon-512.png', size: 512, bleed: false },
] as const;

const FONTS = [
  {
    family: 'Anybody',
    weight: '100 900',
    stretch: '50% 150%',
    file: '@fontsource-variable/anybody/files/anybody-latin-standard-normal.woff2',
  },
  {
    family: 'Geologica',
    weight: '100 900',
    stretch: '100%',
    file: '@fontsource-variable/geologica/files/geologica-latin-wght-normal.woff2',
  },
  {
    family: 'IBM Plex Mono',
    weight: '400',
    stretch: '100%',
    file: '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
  },
  {
    family: 'IBM Plex Mono',
    weight: '500',
    stretch: '100%',
    file: '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2',
  },
] as const;

const dataUrl = (path: string, type: string): string =>
  `data:${type};base64,${readFileSync(path).toString('base64')}`;

const escapeHtml = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function fontFaces(): string {
  return FONTS.map(
    (font) =>
      `@font-face{font-family:'${font.family}';font-weight:${font.weight};font-stretch:${font.stretch};` +
      `src:url(${dataUrl(fromRoot(join('node_modules', font.file)), 'font/woff2')}) format('woff2')}`,
  ).join('\n');
}

/** El eyebrow como en el hero (`Eyebrow`): la sección en ámbar y el resto atenuado, partido por el primer « · ». */
function eyebrow(text: string): string {
  const cut = text.indexOf(' · ');
  const section = cut === -1 ? text : text.slice(0, cut);
  const rest = cut === -1 ? '' : text.slice(cut);
  return `<span class="section">${escapeHtml(section)}</span><span class="rest">${escapeHtml(rest)}</span>`;
}

function shareHtml(kicker: string, favicon: string): string {
  const [firstName = '', ...rest] = profile.name.split(' ');
  const host = new URL(SITE_URL).host;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFaces()}
${readFileSync(fromRoot('src/styles/tokens.css'), 'utf8')}
html, body { margin: 0; }
.card { position: relative; width: ${String(SHARE.width)}px; height: ${String(SHARE.height)}px; overflow: hidden;
  background: var(--color-void); color: var(--color-ink); font-family: var(--font-body); }
.scene { position: absolute; inset-block-start: 0; inset-inline-start: ${String(STILL_LEFT_PX)}px; block-size: 100%; }
.veil { position: absolute; inset: 0;
  background: linear-gradient(90deg, var(--color-void) 0%, rgb(4 5 11 / 0.55) 42%, transparent 60%); }
.text { position: absolute; inset: 64px; display: flex; flex-direction: column; justify-content: space-between; }
.eyebrow { margin: 0; font-family: var(--font-mono); font-size: 20px; font-weight: var(--weight-mono);
  letter-spacing: var(--tracking-label); text-transform: uppercase; }
.section { color: var(--color-star); }
.rest { color: var(--color-dim); }
.name { margin: 0; font-family: var(--font-display); font-size: 172px; font-weight: var(--weight-hero);
  font-stretch: var(--wdth-hero-rest); line-height: var(--leading-hero); white-space: nowrap; }
.line, .indent { display: block; }
.indent { padding-inline-start: var(--hero-indent); }
.site { display: flex; align-items: center; gap: 16px; font-family: var(--font-mono); font-size: 24px;
  color: var(--color-ink-soft); letter-spacing: 0.04em; }
.site svg { inline-size: 44px; block-size: 44px; }
</style></head><body><div class="card">
<img class="scene" src="${dataUrl(fromRoot(TURTLE_STILL), 'image/webp')}" alt="">
<div class="veil"></div>
<div class="text">
  <p class="eyebrow">${eyebrow(kicker)}</p>
  <p class="name"><span class="line">${escapeHtml(firstName)}</span><span class="indent">${escapeHtml(rest.join(' '))}</span></p>
  <p class="site">${favicon}<span>${escapeHtml(host)}</span></p>
</div></div></body></html>`;
}

async function renderShare(
  page: Page,
  kicker: string,
  favicon: string,
  out: string,
): Promise<void> {
  await page.setViewportSize(SHARE);
  await page.setContent(shareHtml(kicker, favicon), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  mkdirSync(dirname(fromRoot(out)), { recursive: true });
  writeFileSync(fromRoot(out), await page.screenshot({ clip: { x: 0, y: 0, ...SHARE } }));
}

async function renderIcon(
  page: Page,
  favicon: string,
  size: number,
  bleed: boolean,
  out: string,
): Promise<void> {
  await page.setViewportSize({ width: size, height: size });
  const tile = bleed ? '.tile { rx: 0; }' : '';
  await page.setContent(
    `<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block;width:${String(size)}px;height:${String(size)}px}${tile}</style></head><body>${favicon}</body></html>`,
  );
  writeFileSync(
    fromRoot(out),
    await page.screenshot({
      clip: { x: 0, y: 0, width: size, height: size },
      omitBackground: true,
    }),
  );
}

const favicon = readFileSync(fromRoot('public/favicon.svg'), 'utf8').replace(
  /<!--[\s\S]*?-->/g,
  '',
);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await renderShare(page, en['hero.kicker'], favicon, 'src/assets/og/og-en.png');
  await renderShare(page, es['hero.kicker'], favicon, 'src/assets/og/og-es.png');
  for (const icon of ICONS) await renderIcon(page, favicon, icon.size, icon.bleed, icon.file);
  process.stdout.write('og: src/assets/og/og-{en,es}.png y los iconos de public/\n');
} finally {
  await browser.close();
}
