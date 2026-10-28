import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { expect, type Locator, type Page } from '@playwright/test';

import { test } from './support/test.ts';

import { PROJECT_IMAGE_WIDTHS, SHARE_IMAGE_WIDTH } from '../../src/content/imageWidths.ts';
import { projectEntries } from '../../src/content/projects/entries.ts';
import type { ImageFile, ResponsiveImage } from '../../src/content/types.ts';
import { findImageFileProblems, findImageProblems } from '../../src/content/validate/validate.ts';
import { sitePages } from '../../src/lib/seo/pages/pages.ts';

/**
 * Imágenes de la página de proyecto (F2 · paso 8): portada y galería con las capturas reales
 * (docs/02-experiencia/pagina-proyecto.md → «Estructura», puntos 2 y 9; docs/01-contenido/assets.md) y
 * el visor con ellas (docs/03-diseno/componentes.md → «Visor de galería»).
 */

const cover = (page: Page): Locator => page.getByRole('img', { name: 'Chessmate home page' });
const gallery = (page: Page): Locator => page.getByRole('region', { name: 'Gallery' });
const viewer = (page: Page): Locator => page.getByRole('dialog', { name: 'Gallery' });
const thumb = (page: Page, n: number, alt: string): Locator =>
  gallery(page).getByRole('button', { name: `Open image ${String(n)} of 9 ${alt}` });

/** Texto de la región `status` del visor («3 of 9: Course detail»). */
const announced = (page: Page): Locator => viewer(page).getByRole('status');

/** URL de la variante `width` (px) en el `srcset` de un `<source>`. */
function variantOf(srcset: string, width: number): string {
  const entry = srcset.split(', ').find((candidate) => candidate.endsWith(` ${String(width)}w`));
  if (entry === undefined) throw new Error(`No hay variante de ${String(width)}w en «${srcset}»`);
  return entry.split(' ')[0] ?? '';
}

/** La imagen ha llegado y se ha decodificado: qué archivo eligió el navegador. */
async function loadedSource(image: Locator): Promise<string> {
  await expect
    .poll(() =>
      image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth),
    )
    .toBeGreaterThan(0);
  return image.evaluate((element: HTMLImageElement) => new URL(element.currentSrc).pathname);
}

/** El `srcset` de un formato (`avif`, `webp`) en el `<picture>` de una imagen. */
const srcsetOf = (image: Locator, format: string): Promise<string> =>
  image.evaluate(
    (element, type) =>
      element.closest('picture')?.querySelector(`source[type="${type}"]`)?.getAttribute('srcset') ??
      '',
    `image/${format}`,
  );

/**
 * La imagen llega en la variante de `width` px del formato que haya elegido el navegador: AVIF en Chromium
 * y Firefox; el WebKit de Linux del CI puede no leer AVIF y caer en la WebP del mismo ancho.
 */
async function expectVariant(image: Locator, width: number): Promise<void> {
  const chosen = await loadedSource(image);
  const format = /\.(avif|webp)$/.exec(chosen)?.[1] ?? 'desconocido';
  expect(chosen).toBe(variantOf(await srcsetOf(image, format), width));
}

/** Una URL de variante de captura (el JPEG para compartir solo lo llevan las fichas). */
const IMAGE_URL = /\.(?:avif|webp)\b/;

/** Cuántos archivos distintos ofrece una ficha: cada captura en 2 formatos × sus anchos, y el JPEG. */
const offeredFiles = (screenshots: number): number =>
  screenshots * 2 * PROJECT_IMAGE_WIDTHS.length + 1;

/** Fichas con imágenes (las demás no tienen `<picture>`): todas sus páginas, en los dos idiomas. */
const PROJECT_PAGES = sitePages(projectEntries).flatMap((sitePage) =>
  sitePage.kind === 'project' ? Object.values(sitePage.paths) : [],
);

/**
 * La caja de una imagen que aún no ha llegado es la misma cuando llega (hasta 1 px: la variante de 640 px
 * redondea su alto y la proporción cambia en décimas). Si ya hubiera llegado, no probaría nada.
 */
async function expectSameBoxWhileLoading(image: Locator): Promise<void> {
  await expect(image).toBeAttached();
  expect(await image.evaluate((element: HTMLImageElement) => element.complete)).toBe(false);
  const before = await image.boundingBox();
  await loadedSource(image);
  const after = await image.boundingBox();
  expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((after?.height ?? 0) - (before?.height ?? 0))).toBeLessThanOrEqual(1);
  expect(before?.height).toBeGreaterThan(100);
}

test.describe('project images', () => {
  test.describe('the variant each image asks for (sizes, at density 1)', () => {
    // Densidad 1 en los tres navegadores: el perfil «Desktop Safari» de Playwright trae 2 y pediría el doble.
    test.use({ deviceScaleFactor: 1 });

    test('the cover arrives at the width of the reading column, with its box reserved', async ({
      page,
    }) => {
      // A 1440 px, la ventana entera pediría la de 1920: solo `sizes` (696 px) lleva a la de 1280.
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/projects/chessmate');
      // El hueco existe antes de que llegue la imagen: medidas del archivo (1920 × 922) en el HTML.
      await expect(cover(page)).toHaveAttribute('width', '1920');
      await expect(cover(page)).toHaveAttribute('height', '922');
      await expectVariant(cover(page), 1280);
      const box = await cover(page).boundingBox();
      expect(box?.width).toBeCloseTo(720 - 2 * 12, 0);
      expect((box?.height ?? 0) / (box?.width ?? 1)).toBeCloseTo(922 / 1920, 2);
    });

    test('at 1440 px a thumbnail takes the 640 px variant and the viewer the 1920 px one', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/projects/chessmate');
      // La 2.ª, otro archivo que la portada (la 1.ª es el mismo y el navegador podría reutilizarla). Con
      // `sizes` = 100vw pediría la de 1920; con el de la galería (232 px), la de 640.
      const second = thumb(page, 2, 'Courses');
      await second.scrollIntoViewIfNeeded();
      await expectVariant(second.getByRole('img'), 640);
      await second.click();
      await expectVariant(viewer(page).getByRole('img', { name: 'Courses' }), 1920);
    });

    test('at 390 px the cover and the thumbnails take the 640 px variant', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/projects/chessmate');
      await expectVariant(cover(page), 640);
      const first = thumb(page, 1, 'Home').getByRole('img');
      await first.scrollIntoViewIfNeeded();
      await expectVariant(first, 640);
    });
  });

  test('every picture of the built project pages follows rule 5, and so does the share image', async ({
    page,
  }) => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the built pages: once is enough');
    // La regla 5 sobre lo que se despliega, no sobre el sustituto de Vitest: lo que dan de verdad los
    // presets de vite.config.ts (orden de las variantes, respaldo = WebP mayor, anchos, 1200 px).
    for (const path of PROJECT_PAGES) {
      await page.goto(path);
      const { pictures, share } = await page.evaluate(() => ({
        pictures: [...document.querySelectorAll('main picture')].map((picture) => {
          const img = picture.querySelector('img');
          const srcset = (type: string): string =>
            picture.querySelector(`source[type="image/${type}"]`)?.getAttribute('srcset') ?? '';
          return {
            src: img?.getAttribute('src') ?? '',
            width: Number(img?.getAttribute('width')),
            height: Number(img?.getAttribute('height')),
            sources: { avif: srcset('avif'), webp: srcset('webp') },
          };
        }),
        share: (['', ':width', ':height'] as const).map(
          (suffix) =>
            document.querySelector(`meta[property="og:image${suffix}"]`)?.getAttribute('content') ??
            null,
        ),
      }));
      const images: Record<string, ResponsiveImage> = Object.fromEntries(
        pictures.map((picture, index) => [`${path} · picture ${String(index)}`, picture]),
      );
      expect(findImageProblems(images)).toEqual([]);
      // Las 21 capturas miden 1920 px: cada formato, en todos los anchos de los presets.
      for (const picture of pictures) {
        for (const srcset of Object.values(picture.sources)) {
          expect(
            srcset.split(', ').map((entry) => Number(entry.split(' ')[1]?.slice(0, -1))),
          ).toEqual([...PROJECT_IMAGE_WIDTHS]);
        }
      }
      const [shareUrl, shareWidth, shareHeight] = share;
      if (pictures.length === 0) {
        expect(shareUrl, path).toBeNull();
        continue;
      }
      // La portada (la 1.ª imagen) es la 1.ª captura de la galería (la 2.ª).
      expect(pictures[0]?.src, path).toBe(pictures[1]?.src);
      const file: ImageFile = {
        src: new URL(shareUrl ?? 'https://x.invalid').pathname,
        width: Number(shareWidth),
        height: Number(shareHeight),
      };
      expect(findImageFileProblems({ [`${path} · og:image`]: file })).toEqual([]);
      expect(file.width, path).toBe(SHARE_IMAGE_WIDTH);
    }
  });

  test('the home does not load the project images', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    // El viaje y la misión rápida usan los textos (`projectEntries`), no las imágenes (`media.ts`).
    const client = fileURLToPath(new URL('../../build/client/', import.meta.url));
    for (const page of ['index.html', 'es/index.html']) {
      const html = readFileSync(`${client}${page}`, 'utf8');
      const scripts = [
        ...new Set(Array.from(html.matchAll(/\/assets\/[^"']+\.js/g), ([url]) => url)),
      ];
      expect(scripts.length).toBeGreaterThan(0);
      const withImages = [page, ...scripts].filter((file) =>
        IMAGE_URL.test(readFileSync(`${client}${file === page ? page : file.slice(1)}`, 'utf8')),
      );
      expect(withImages).toEqual([]);
    }
  });

  test('every file the page offers (variants and the share image) is served as an image', async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== 'chromium',
      'Reads files from the server: once is enough',
    );
    for (const path of ['/projects/chessmate', '/es/projects/astrohub']) {
      await page.goto(path);
      const urls = await page.evaluate(() => {
        const fromSrcset = [...document.querySelectorAll('main source')].flatMap((source) =>
          (source.getAttribute('srcset') ?? '')
            .split(', ')
            .map((entry) => entry.split(' ')[0] ?? ''),
        );
        const fromImg = [...document.querySelectorAll('main img')].map(
          (image) => image.getAttribute('src') ?? '',
        );
        const share = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
        return [...new Set([...fromSrcset, ...fromImg, new URL(share ?? '').pathname])];
      });
      // Chessmate, 9 capturas, y AstroHub, 12 (la portada es la 1.ª; el respaldo, una de las WebP).
      expect(urls).toHaveLength(offeredFiles(path.includes('chessmate') ? 9 : 12));
      for (const url of urls) {
        const response = await page.request.get(url);
        expect(response.status(), url).toBe(200);
        expect(response.headers()['content-type'], url).toMatch(/^image\/(?:avif|webp|jpeg)$/);
      }
    }
  });

  test('the viewer with the real images: open, ← →, Esc and «Close» return the focus', async ({
    page,
  }) => {
    await page.goto('/projects/chessmate', { waitUntil: 'networkidle' });
    await thumb(page, 2, 'Courses').click();
    await expect(viewer(page)).toBeVisible();
    await expect(viewer(page).getByRole('button', { name: 'Close' })).toBeFocused();
    await expect(announced(page)).toHaveText('2 of 9: Courses');
    await loadedSource(viewer(page).getByRole('img', { name: 'Courses' }));

    await page.keyboard.press('ArrowRight');
    await expect(announced(page)).toHaveText('3 of 9: Course detail');
    await expect(viewer(page).getByRole('img', { name: 'Course detail' })).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(announced(page)).toHaveText('9 of 9: Contact');
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toBeHidden();
    await expect(thumb(page, 9, 'Contact')).toBeFocused();

    await thumb(page, 1, 'Home').click();
    await expect(announced(page)).toHaveText('1 of 9: Home');
    await viewer(page).getByRole('button', { name: 'Next image' }).click();
    await expect(announced(page)).toHaveText('2 of 9: Courses');
    await viewer(page).getByRole('button', { name: 'Close' }).click();
    await expect(viewer(page)).toBeHidden();
    await expect(thumb(page, 2, 'Courses')).toBeFocused();
  });

  test('at 390 px the viewer fits the screen and its controls are 44 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/es/projects/astrohub', { waitUntil: 'networkidle' });
    const galeria = page.getByRole('region', { name: 'Galería' });
    const visor = page.getByRole('dialog', { name: 'Galería' });
    await galeria.getByRole('button', { name: 'Abrir imagen 2 de 12 Noticias' }).click();
    const shown = visor.getByRole('img', { name: 'Noticias' });
    await loadedSource(shown);
    // Entera (`contain`, sin recortar) y dentro de la pantalla: con `contain`, lo pintado es el ajuste
    // de la imagen a su caja.
    const painted = await shown.evaluate((element: HTMLImageElement) => {
      const box = element.getBoundingClientRect();
      const scale = Math.min(box.width / element.naturalWidth, box.height / element.naturalHeight);
      return {
        fit: getComputedStyle(element).objectFit,
        width: element.naturalWidth * scale,
        box: { top: box.top, right: box.right, bottom: box.bottom, left: box.left },
        viewportHeight: window.innerHeight,
      };
    });
    expect(painted.fit).toBe('contain');
    expect(painted.box.left).toBeGreaterThanOrEqual(0);
    expect(painted.box.right).toBeLessThanOrEqual(390);
    expect(painted.box.top).toBeGreaterThanOrEqual(0);
    expect(painted.box.bottom).toBeLessThanOrEqual(painted.viewportHeight);
    expect(painted.width).toBeGreaterThan(300);
    for (const name of ['Cerrar', 'Imagen anterior', 'Imagen siguiente']) {
      const box = await visor.getByRole('button', { name }).boundingBox();
      expect(box?.width, name).toBeGreaterThanOrEqual(44);
      expect(box?.height, name).toBeGreaterThanOrEqual(44);
    }
  });

  test('slow images do not move the page (CLS under 0.1 with the cover and the gallery)', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Layout shift entries: Chromium');
    // Las imágenes llegan tarde: el texto ya está pintado y su hueco tiene que estar reservado.
    await page.route(/\.(?:avif|webp)$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await page.addInitScript(() => {
      interface ShiftSource {
        node: Node | null;
        previousRect: DOMRectReadOnly;
        currentRect: DOMRectReadOnly;
      }
      const store = window as unknown as { __cls: number; __shifts: string[] };
      store.__cls = 0;
      store.__shifts = [];
      // Qué se movió y cuánto («<p.lead> «Texto…» y 120→184, h 40→40, …»), para el mensaje si falla.
      const describe = ({ node, previousRect: from, currentRect: to }: ShiftSource): string => {
        const element = node instanceof Element ? node : (node?.parentElement ?? null);
        const classes = element?.getAttribute('class') ?? null;
        const name =
          element === null
            ? String(node?.nodeName)
            : `<${element.tagName.toLowerCase()}${classes === null ? '' : `.${classes}`}> «${element.textContent.trim().slice(0, 40)}»`;
        const move = (label: string, before: number, after: number): string =>
          `${label} ${String(Math.round(before))}→${String(Math.round(after))}`;
        return [
          name,
          move('y', from.y, to.y),
          move('h', from.height, to.height),
          move('x', from.x, to.x),
          move('w', from.width, to.width),
        ].join(', ');
      };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
          sources: readonly ShiftSource[];
        })[]) {
          if (!entry.hadRecentInput) {
            store.__cls += entry.value;
            store.__shifts.push(
              `${entry.value.toFixed(4)} a los ${String(Math.round(entry.startTime))} ms: ${entry.sources.map(describe).join(' | ')}`,
            );
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects/chessmate', { waitUntil: 'commit' });
    // Con la hoja de estilos ya aplicada (`commit` no la espera): sin ella, la caja sería la del archivo.
    await expect
      .poll(async () => (await cover(page).boundingBox())?.width ?? Infinity)
      .toBeLessThanOrEqual(390);
    await expectSameBoxWhileLoading(cover(page));
    // Una miniatura que llega tarde de verdad: la 2.ª es otro archivo que la portada (la 1.ª es el mismo y
    // ya habría llegado con ella).
    const second = thumb(page, 2, 'Courses').getByRole('img');
    await second.scrollIntoViewIfNeeded();
    await expectSameBoxWhileLoading(second);
    const { cls, shifts } = await page.evaluate(() => {
      const store = window as unknown as { __cls: number; __shifts: string[] };
      return { cls: store.__cls, shifts: store.__shifts };
    });
    // Si falla, el mensaje dice qué elemento se movió, cuándo y cuánto (cada salto en una línea).
    expect(cls, `Desplazamientos:\n${shifts.join('\n')}`).toBeLessThan(0.1);
  });
});
