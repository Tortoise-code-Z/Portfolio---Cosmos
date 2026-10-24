import { expect, test, type Page } from '@playwright/test';

/**
 * La interfaz fija del viaje (F2 · paso 5): HUD, raíl y barra superior conectados al scroll.
 * Detalle en docs/02-experiencia/navegacion.md y scroll-y-escena.md, y docs/03-diseno/componentes.md.
 */

const hud = (page: Page): ReturnType<Page['locator']> =>
  page.locator('[aria-hidden="true"]', {
    hasText: /^t [=≈]/,
  });

/** Alto que tapa la barra fija arriba (`scroll-padding-block-start`). */
const barHeight = (page: Page): Promise<number> =>
  page.evaluate(() =>
    Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingBlockStart),
  );

/** Cuánto falta para que el capítulo quede justo bajo la barra (0 = ha llegado). */
async function distanceToLanding(page: Page, id: string): Promise<number> {
  const box = await page.locator(`#${id}`).boundingBox();
  return Math.abs((box?.y ?? 9999) - (await barHeight(page)));
}

/** Lleva el inicio de un capítulo a la línea de lectura (debajo de la barra fija). */
async function scrollToChapter(page: Page, id: string): Promise<void> {
  await page.evaluate((anchor) => {
    document.getElementById(anchor)?.scrollIntoView({ block: 'start' });
  }, id);
}

test.describe('HUD', () => {
  test('starts at the singularity and follows the scroll, chapter by chapter', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(hud(page)).toHaveText(/t = 0 s · singularity\s*scale ≈ 10⁻³⁵ m/i);
    await scrollToChapter(page, 'about');
    await expect(hud(page)).toHaveText(/t ≈ 200 million years\s*scale ≈ 20 light-years/i);
    await scrollToChapter(page, 'skills');
    await expect(hud(page)).toContainText(/t ≈ 1 billion years/i);
    await scrollToChapter(page, 'projects');
    await expect(hud(page)).toContainText(/t = ∞ · mythic time/i);
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await expect(hud(page)).toContainText(/t = 0 s/i);
  });

  test('a link to a chapter (/es#contact) opens with its time, in the language of the page', async ({
    page,
  }) => {
    await page.goto('/es#contact', { waitUntil: 'networkidle' });
    await expect(hud(page)).toContainText(/t ≈ 13\.800 millones de años/i);
    await expect(hud(page)).toContainText(/escala · 12.742 km de diámetro/i);
  });

  test('is decorative: out of the accessibility tree and never under the pointer', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(hud(page)).toHaveAttribute('aria-hidden', 'true');
    await expect(hud(page)).toHaveCSS('pointer-events', 'none');
  });

  for (const { width, side } of [
    { width: 1280, side: 'right' },
    { width: 800, side: 'left' },
  ] as const) {
    test(`${String(width)} px: sits at the bottom ${side}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 720 });
      await page.goto('/', { waitUntil: 'networkidle' });
      const box = await hud(page).boundingBox();
      expect(box).not.toBeNull();
      if (box === null) return;
      expect(box.y + box.height).toBeGreaterThan(720 - 80);
      if (side === 'right') expect(box.x + box.width).toBeGreaterThan(width - 80);
      else expect(box.x).toBeLessThan(80);
    });
  }

  test('390 px: hidden (each chapter eyebrow already tells the time)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(hud(page)).toBeHidden();
  });
});

const rail = (page: Page): ReturnType<Page['locator']> =>
  page.getByRole('navigation', { name: 'Chapters' });

test.describe('chapter rail', () => {
  test('marks the chapter you are reading, also when you just scroll', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const current = rail(page).locator('[aria-current="step"]');
    await expect(current).toHaveAccessibleName('Home · Singularity');
    await scrollToChapter(page, 'skills');
    await expect(current).toHaveAccessibleName('Skills · Galaxy');
    await expect(current).toHaveCount(1);
  });

  test('a click travels to the chapter, focuses its title and writes its anchor in place', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const entries = await page.evaluate(() => window.history.length);
    await rail(page).getByRole('link', { name: 'Projects · Cosmic turtle' }).click();
    await expect.poll(() => distanceToLanding(page, 'projects')).toBeLessThanOrEqual(2);
    await expect(page.getByRole('heading', { name: 'What I carry on my shell' })).toBeFocused();
    await expect(page).toHaveURL(/\/#projects$/);
    expect(await page.evaluate(() => window.history.length)).toBe(entries);
    await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(
      'Projects · Cosmic turtle',
    );

    await rail(page).getByRole('link', { name: 'Home · Singularity' }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(page).toHaveURL(/\/$/);
  });

  test('with the keyboard: Enter on a chapter jumps there (instantly with reduced motion)', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/es', { waitUntil: 'networkidle' });
    await page
      .getByRole('navigation', { name: 'Capítulos' })
      .getByRole('link', { name: 'Contacto · Tierra' })
      .focus();
    // El último capítulo puede quedar más cerca del final que una pantalla: el scroll se para antes.
    const target = await page.evaluate(() =>
      Math.min(
        (document.getElementById('contact')?.offsetTop ?? -1) -
          Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingBlockStart),
        document.documentElement.scrollHeight - window.innerHeight,
      ),
    );
    await page.keyboard.press('Enter');
    // Instantáneo: en el primer frame ya está.
    const landed = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          requestAnimationFrame(() => {
            resolve(window.scrollY);
          });
        }),
    );
    expect(Math.abs(landed - target)).toBeLessThanOrEqual(2);
    await expect(page.getByRole('heading', { name: 'Aterrizaje' })).toBeFocused();
    await expect(page).toHaveURL(/\/es#contact$/);
  });

  test('still follows the scroll after the 404 of /ES and its «Back to the start» link', async ({
    page,
  }) => {
    // `/ES` casa la ruta del viaje en el cliente y pinta la 404: al volver, el viaje debe medir su
    // `<main>` de nuevo (si no, `m` se queda en 0 y el raíl en «Home»).
    await page.goto('/ES', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: 'Back to the start' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(
      'Home · Singularity',
    );
    await scrollToChapter(page, 'skills');
    await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(
      'Skills · Galaxy',
    );
  });

  test('desktop shows section and scene; 390 px keeps only the dots, 44 px each', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(rail(page).getByText('Cosmic turtle')).toBeVisible();
    // Los puntos forman una columna, aunque cada texto mida distinto. Se admite 1 px de diferencia:
    // Firefox reparte los subpíxeles de otra forma y el redondeo puede caer a un lado u otro; sin la
    // columna, los puntos se separan decenas de píxeles.
    const dotCenters = await rail(page)
      .locator('a > span:last-child')
      .evaluateAll((dots) =>
        dots.map((dot) => {
          const { left, width } = dot.getBoundingClientRect();
          return left + width / 2;
        }),
      );
    expect(dotCenters).toHaveLength(5);
    expect(Math.max(...dotCenters) - Math.min(...dotCenters)).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(rail(page).getByText('Cosmic turtle')).toBeHidden();
    for (const link of await rail(page).getByRole('link').all()) {
      const box = await link.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('a chapter reached with Tab lights up its text, like on hover', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const skills = rail(page).getByRole('link', { name: 'Skills · Galaxy' });
    // Foco con el teclado (Shift+Tab y Tab), que es lo que activa `:focus-visible`.
    await skills.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(skills).toBeFocused();
    await expect(skills.locator('> span').first()).toHaveCSS('opacity', '1');
    await expect(
      rail(page).getByRole('link', { name: 'About · Nebula' }).locator('> span').first(),
    ).not.toHaveCSS('opacity', '1');
  });

  test('390 px: the focus ring of a dot fits on screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    const box = await rail(page).getByRole('link', { name: 'About · Nebula' }).boundingBox();
    const ring = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return (
        Number.parseFloat(style.getPropertyValue('--focus-width')) +
        Number.parseFloat(style.getPropertyValue('--focus-offset'))
      );
    });
    expect(ring).toBeGreaterThan(0);
    expect((box?.x ?? 9999) + (box?.width ?? 0) + ring).toBeLessThanOrEqual(390);
  });

  for (const viewport of [
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    test(`${String(viewport.width)} × ${String(viewport.height)}: no text of the hero lies under the rail`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/', { waitUntil: 'networkidle' });
      const overlaps = await page.evaluate(() => {
        const nav = document.querySelector('nav')?.getBoundingClientRect();
        const hero = document.querySelector('[data-chapter="0"]');
        if (nav === undefined || hero === null) return ['missing rail or hero'];
        const hits: string[] = [];
        const walker = document.createTreeWalker(hero, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const box of range.getClientRects()) {
            const crosses =
              box.right > nav.left &&
              box.left < nav.right &&
              box.bottom > nav.top &&
              box.top < nav.bottom;
            if (crosses && (node.textContent ?? '').trim() !== '')
              hits.push(node.textContent ?? '');
          }
        }
        return hits;
      });
      expect(overlaps).toEqual([]);
    });
  }

  test('in Windows high contrast, the active dot is filled (not only bigger)', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Only Chromium emulates forced colors.');
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/', { waitUntil: 'networkidle' });
    // Sin la regla, el sistema pinta el punto con el color del fondo (Canvas): relleno invisible.
    const [dot, background] = await rail(page)
      .getByRole('link', { name: 'Home · Singularity' })
      .locator('> span:last-child')
      .evaluate((element) => [
        getComputedStyle(element).backgroundColor,
        getComputedStyle(document.body).backgroundColor,
      ]);
    expect(dot).not.toBe(background);
    expect(dot).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('comes after the content in the document order (top bar → content → rail)', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const order = await page.evaluate(() => {
      const follows = (a: Element | null, b: Element | null): boolean =>
        a !== null &&
        b !== null &&
        (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      const header = document.querySelector('header');
      const main = document.querySelector('main');
      const nav = document.querySelector('nav[aria-label="Chapters"]');
      return { barThenContent: follows(header, main), contentThenRail: follows(main, nav) };
    });
    expect(order).toEqual({ barThenContent: true, contentThenRail: true });
  });
});

const bar = (page: Page): ReturnType<Page['locator']> => page.getByRole('banner');

test.describe('top bar', () => {
  test('the first Tab shows «Skip to content»; Enter goes to the name, past the bar', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    const box = await skip.boundingBox();
    expect(box?.y).toBeGreaterThanOrEqual(0);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(page).toHaveURL(/\/$/);
    // El Tab siguiente ya está en el contenido, no en la barra.
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.closest('main') !== null)).toBe(true);
  });

  test('Projects and Contact jump like the rail: below the bar, title focused, anchor in place', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'networkidle' });
    const entries = await page.evaluate(() => window.history.length);
    await bar(page).getByRole('link', { name: 'Projects' }).click();
    await expect.poll(() => distanceToLanding(page, 'projects')).toBeLessThanOrEqual(2);
    await expect(page.getByRole('heading', { name: 'What I carry on my shell' })).toBeFocused();
    await expect(page).toHaveURL(/\/#projects$/);

    await bar(page).getByRole('link', { name: 'Contact' }).click();
    await expect(page.getByRole('heading', { name: 'Touchdown' })).toBeFocused();
    await expect(page).toHaveURL(/\/#contact$/);
    // Saltos, no navegaciones: el historial no crece.
    expect(await page.evaluate(() => window.history.length)).toBe(entries);

    await bar(page).getByRole('link', { name: 'TORTOISE_CODE' }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(page).toHaveURL(/\/$/);
  });

  test('EN → ES keeps the chapter you are reading, without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollToChapter(page, 'skills');
    const spanish = bar(page).getByRole('link', { name: 'Español' });
    await expect(spanish).toHaveAttribute('href', '/es#skills');
    await spanish.click();
    await expect(page).toHaveURL(/\/es#skills$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect.poll(() => distanceToLanding(page, 'skills')).toBeLessThanOrEqual(2);
    await expect(bar(page).getByRole('link', { name: 'Español' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(
      page.getByRole('navigation', { name: 'Capítulos' }).locator('[aria-current="step"]'),
    ).toHaveAccessibleName('Habilidades · Galaxia');
    expect(errors).toEqual([]);
  });

  test('the current language stays put: no jump, no URL change, no history entry', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollToChapter(page, 'about');
    // Un poco más abajo: el capítulo activo ya es Skills, pero no se está en su ancla.
    await page.evaluate(() => {
      window.scrollBy(0, (document.getElementById('about')?.offsetHeight ?? 0) * 0.6);
    });
    const before = await page.evaluate(() => ({
      y: window.scrollY,
      entries: window.history.length,
    }));
    await bar(page).getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(
      await page.evaluate(() => ({ y: window.scrollY, entries: window.history.length })),
    ).toEqual(before);
  });

  test('a dark veil sits behind its links, so text scrolling under it does not wash them out', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(bar(page)).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });

  for (const [path, quick, short] of [
    ['/', 'Quick mission', 'Quick'],
    ['/es', 'Modo misión rápida', 'Rápida'],
  ] as const) {
    test(`390 px with text at 200 % (${path}): EN / ES and «${short}» stay on screen (only the logo gives way)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await expect(bar(page).getByRole('link', { name: 'Español' })).toBeInViewport({ ratio: 1 });
      await expect(bar(page).getByRole('link', { name: 'English' })).toBeInViewport({ ratio: 1 });
      const button = bar(page).getByRole('button', { name: quick });
      await expect(button).toBeInViewport({ ratio: 1 });
      // Lo que se ve (`innerText` deja fuera la etiqueta oculta).
      expect(await button.innerText()).toBe(short.toUpperCase());
    });
  }

  // Desde md salen a la vez chip, Projects, Contact, EN / ES y la etiqueta larga: con el texto al 200 %
  // ceden el chip y la etiqueta larga (consultas de contenedor en `em`), no las acciones.
  for (const [path, quick] of [
    ['/', 'Quick mission'],
    ['/es', 'Modo misión rápida'],
  ] as const) {
    test(`960 px with text at 200 % (${path}): every action stays on screen`, async ({ page }) => {
      await page.setViewportSize({ width: 960, height: 768 });
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      for (const name of ['English', 'Español']) {
        await expect(bar(page).getByRole('link', { name })).toBeInViewport({ ratio: 1 });
      }
      await expect(bar(page).getByRole('button', { name: quick })).toBeInViewport({ ratio: 1 });
      for (const link of await bar(page).getByRole('link').all()) {
        if (await link.isVisible()) await expect(link).toBeInViewport({ ratio: 1 });
      }
    });
  }

  test('desktop: the full «Quick mission» label and the «Open to work» chip, which jumps to Contact', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    expect(await bar(page).getByRole('button', { name: 'Quick mission' }).innerText()).toBe(
      'QUICK MISSION',
    );
    await bar(page).getByRole('link', { name: 'Open to work' }).click();
    await expect(page).toHaveURL(/\/#contact$/);
    await expect(page.getByRole('heading', { name: 'Touchdown' })).toBeFocused();
    await expect.poll(() => distanceToLanding(page, 'contact')).toBeLessThanOrEqual(2);
  });

  test('the dot of the chip breathes, and stays still with reduced motion', async ({ page }) => {
    const dot = bar(page)
      .getByRole('link', { name: 'Open to work' })
      .locator('[aria-hidden="true"]');
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(dot).not.toHaveCSS('animation-name', 'none');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(dot).toHaveCSS('animation-name', 'none');
  });

  test('390 px: logo and EN / ES stay, Projects, Contact and the chip give way', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(bar(page).getByRole('link', { name: 'TORTOISE_CODE' })).toBeVisible();
    await expect(bar(page).getByRole('link', { name: 'Español' })).toBeVisible();
    await expect(bar(page).getByRole('link', { name: 'Projects' })).toBeHidden();
    await expect(bar(page).getByRole('link', { name: 'Contact' })).toBeHidden();
    await expect(bar(page).getByRole('link', { name: 'Open to work' })).toBeHidden();
    const box = await bar(page).boundingBox();
    expect(box?.height).toBe(await barHeight(page));
  });
});

test.describe('top bar without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('its links are real: Projects leads to its chapter', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await bar(page).getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL(/\/#projects$/);
    await expect.poll(() => distanceToLanding(page, 'projects')).toBeLessThanOrEqual(2);
  });
});

test.describe('chapter rail without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('its dots are real links: Skills leads to its chapter', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await rail(page).getByRole('link', { name: 'Skills · Galaxy' }).click();
    await expect(page).toHaveURL(/\/#skills$/);
    await expect.poll(() => distanceToLanding(page, 'skills')).toBeLessThanOrEqual(2);
  });
});
