import { expect, test, type Locator, type Page } from '@playwright/test';

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

/** El `srcset` AVIF del `<picture>` de una imagen. */
const avifSrcset = (image: Locator): Promise<string> =>
  image.evaluate(
    (element) =>
      element
        .closest('picture')
        ?.querySelector('source[type="image/avif"]')
        ?.getAttribute('srcset') ?? '',
  );

test.describe('project images', () => {
  test('the cover arrives as AVIF, at the width of the reading column, with its box reserved', async ({
    page,
    browserName,
  }) => {
    // A 1440 px, la ventana entera pediría la de 1920: solo `sizes` (720 px) lleva a la de 1280.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/projects/chessmate');
    // El hueco existe antes de que llegue la imagen: medidas del archivo (1920 × 922) en el HTML.
    await expect(cover(page)).toHaveAttribute('width', '1920');
    await expect(cover(page)).toHaveAttribute('height', '922');
    const chosen = await loadedSource(cover(page));
    // 720 px de columna a densidad 1: la de 1280 px es la primera que llega. Chromium y Firefox leen
    // AVIF; el WebKit de Linux del CI puede no hacerlo y caer en la WebP del mismo ancho.
    const srcset = await avifSrcset(cover(page));
    if (browserName === 'webkit') {
      expect(chosen).toMatch(/\.(?:avif|webp)$/);
    } else {
      expect(chosen).toBe(variantOf(srcset, 1280));
    }
    const box = await cover(page).boundingBox();
    expect(box?.width).toBeCloseTo(720 - 2 * 12, 0);
    expect((box?.height ?? 0) / (box?.width ?? 1)).toBeCloseTo(922 / 1920, 2);
  });

  test('at 390 px the cover and the thumbnails take the 640 px variant', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === 'webkit', 'AVIF in the Linux WebKit build is not guaranteed');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects/chessmate');
    expect(await loadedSource(cover(page))).toBe(variantOf(await avifSrcset(cover(page)), 640));
    const first = thumb(page, 1, 'Home').getByRole('img');
    await first.scrollIntoViewIfNeeded();
    expect(await loadedSource(first)).toBe(variantOf(await avifSrcset(first), 640));
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
      // Chessmate: 10 imágenes (portada = 1.ª de la galería) × 6 variantes + respaldo ya incluido + JPEG.
      expect(urls.length).toBeGreaterThanOrEqual(path.includes('chessmate') ? 55 : 73);
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
    const shown = viewer(page).getByRole('img', { name: 'Courses' });
    expect(await loadedSource(shown)).toMatch(/\.(?:avif|webp)$/);

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
    // `object-fit: contain`: lo que se pinta de la imagen cabe en la pantalla, sin cortarse.
    const painted = await shown.evaluate((element: HTMLImageElement) => {
      const box = element.getBoundingClientRect();
      const scale = Math.min(box.width / element.naturalWidth, box.height / element.naturalHeight);
      return { width: element.naturalWidth * scale, left: box.left, right: box.right };
    });
    expect(painted.left).toBeGreaterThanOrEqual(0);
    expect(painted.right).toBeLessThanOrEqual(390);
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
      const store = window as unknown as { __cls: number };
      store.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        })[]) {
          if (!entry.hadRecentInput) store.__cls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects/chessmate', { waitUntil: 'commit' });
    // Medido con la portada aún sin llegar (si ya hubiera llegado, el test no probaría nada).
    await expect(cover(page)).toBeAttached();
    expect(await cover(page).evaluate((element: HTMLImageElement) => element.complete)).toBe(false);
    const before = await cover(page).boundingBox();
    await loadedSource(cover(page));
    // Misma caja (hasta 1 px: la variante de 640 px redondea su alto y la proporción cambia en décimas).
    const after = await cover(page).boundingBox();
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((after?.height ?? 0) - (before?.height ?? 0))).toBeLessThanOrEqual(1);
    expect(before?.height).toBeGreaterThan(100);
    await gallery(page).scrollIntoViewIfNeeded();
    await loadedSource(thumb(page, 1, 'Home').getByRole('img'));
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls).toBeLessThan(0.1);
  });
});
