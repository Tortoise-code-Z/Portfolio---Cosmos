import { expect, type Page } from '@playwright/test';

import { profile } from '../../src/content/profile.ts';
import { collectErrors, hud, settleScene, withoutWebGL } from './support/helpers.ts';
import { test } from './support/test.ts';

/**
 * El epílogo, Crew file (fase C · C.6a; docs/02-experiencia/capitulos/05-crew-file.md): el último capítulo, en el
 * canal verde, bajo Contacto. La ficha, «Download CV» y el email; el raíl marca su parada y el HUD se esconde (el pie
 * dice el reloj). La escena pinta el retrato (C.6b; su carga la mira `scene.spec.ts`). Se lee sin WebGL, con
 * movimiento reducido, a 390 px, con la letra al 200 % y con el raíl entero en un móvil apaisado.
 */

const crewFile = (page: Page) => page.locator('[data-chapter="5"]');
const rail = (page: Page) => page.getByRole('navigation', { name: /^(?:Chapters|Capítulos)$/ });

test.describe('Crew file', () => {
  for (const { path, title, stop, closed, footer } of [
    {
      path: '/',
      title: 'Crew file',
      stop: 'Crew file · Epilogue',
      closed: 'All channels closed',
      footer: 'End of journey · 13.8 billion years + now',
    },
    {
      path: '/es',
      title: 'Ficha de tripulación',
      stop: 'Tripulación · Epílogo',
      closed: 'Todos los canales cerrados',
      footer: 'Fin del viaje · 13.800 millones de años + ahora',
    },
  ]) {
    test(`${path}#crew-file lands on it: its title under the bar, the rail on its stop and the HUD hidden`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await page.goto(`${path}#crew-file`, { waitUntil: 'networkidle' });
      await expect(page.getByRole('region', { name: title })).toBeInViewport();
      const [heading, bar] = await Promise.all([
        page.getByRole('heading', { level: 2, name: title }).boundingBox(),
        page.getByRole('banner').boundingBox(),
      ]);
      expect(heading?.y ?? 0).toBeGreaterThanOrEqual((bar?.y ?? 0) + (bar?.height ?? 0));
      await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(stop);
      await expect(hud(page)).toHaveAttribute('data-hidden', '');
      await expect(crewFile(page)).toContainText(closed);
      await expect(crewFile(page)).toContainText(footer);
      expect(errors).toEqual([]);
    });
  }

  for (const { width, height, path } of [
    { width: 1280, height: 720, path: '/es' },
    { width: 1440, height: 900, path: '/' },
  ]) {
    test(`${String(width)}×${String(height)} ${path}: the visor sits on the portrait, the file on its sides and the guides reach it`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto(`${path}#crew-file`, { waitUntil: 'networkidle' });
      await settleScene(page);
      const layout = async () =>
        page.evaluate(() => {
          const box = (element: Element | null) => {
            const rect = element?.getBoundingClientRect();
            return rect === undefined
              ? null
              : { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
          };
          const section = document.querySelector('[data-chapter="5"]');
          const guide = (field: Element, side: 'left' | 'right') => {
            const rect = field.getBoundingClientRect();
            const after = getComputedStyle(field, '::after');
            const length = Number.parseFloat(after.width);
            return side === 'left' ? rect.right + length : rect.left - length;
          };
          const fields = [...(section?.querySelectorAll('dl > [data-line]') ?? [])];
          // El lienzo o, sin WebGL, la foto fija del capítulo 5: el retrato va en su centro.
          const canvas = document
            .querySelector('canvas, img[data-still-chapter="5"]')
            ?.getBoundingClientRect();
          return {
            // El centro del lienzo: el del retrato (la cámara del capítulo 5 no se aparta).
            centre: canvas === undefined ? Number.NaN : (canvas.left + canvas.right) / 2,
            middle: window.innerHeight / 2,
            frame: box(section?.querySelector('[data-crew-visor] > div') ?? null),
            title: box(section?.querySelector('h2') ?? null),
            fields: fields.map((field) => box(field)),
            guides: fields.map((field, index) => guide(field, index < 3 ? 'left' : 'right')),
          };
        });
      const { centre, middle, frame, title, fields, guides } = await layout();
      expect(frame).not.toBeNull();
      if (frame === null || title === null) return;
      expect(Math.abs((frame.left + frame.right) / 2 - centre)).toBeLessThanOrEqual(1);
      // El título, entero a la izquierda del visor (en español, «Tripulación» sin partir ni entrar).
      expect(title.right).toBeLessThanOrEqual(frame.left);
      // Los campos 1–3 a su izquierda y los 4–6 a su derecha, sin pisarlo; cada línea guía llega justo al marco.
      expect(fields).toHaveLength(6);
      fields.forEach((field, index) => {
        if (field === null) return;
        if (index < 3) expect(field.right).toBeLessThanOrEqual(frame.left);
        else expect(field.left).toBeGreaterThanOrEqual(frame.right);
      });
      guides.forEach((end, index) => {
        expect(Math.abs(end - (index < 3 ? frame.left : frame.right))).toBeLessThanOrEqual(1);
      });
      // Al bajar por la ficha, el marco sigue pegado al centro de la pantalla (el retrato está fijo en el lienzo).
      await page.mouse.wheel(0, height / 3);
      await expect
        .poll(async () => {
          const after = await layout();
          return after.frame === null
            ? Infinity
            : Math.abs((after.frame.top + after.frame.bottom) / 2 - middle);
        })
        .toBeLessThanOrEqual(1);
    });
  }

  test('390 px and 1024 px (one column): the visor, with the proportion of the portrait, centred on it', async ({
    page,
  }) => {
    for (const { width, height } of [
      { width: 390, height: 844 },
      { width: 1024, height: 768 },
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto('/#crew-file', { waitUntil: 'networkidle' });
      await settleScene(page);
      const { centre, frame } = await page.evaluate(() => {
        const rect = document.querySelector('[data-crew-visor] > div')?.getBoundingClientRect();
        const canvas = document
          .querySelector('canvas, img[data-still-chapter="5"]')
          ?.getBoundingClientRect();
        return {
          centre: canvas === undefined ? Number.NaN : (canvas.left + canvas.right) / 2,
          frame:
            rect === undefined ? null : { left: rect.left, width: rect.width, height: rect.height },
        };
      });
      expect(frame).not.toBeNull();
      if (frame === null) return;
      expect(
        Math.abs(frame.left + frame.width / 2 - centre),
        `${String(width)} px`,
      ).toBeLessThanOrEqual(1);
      expect(frame.width / frame.height).toBeCloseTo(720 / 637, 2);
    }
  });

  test('the rail stop travels to it, with the focus on its title', async ({ page }) => {
    await page.goto('/#contact', { waitUntil: 'networkidle' });
    await rail(page).getByRole('link', { name: 'Crew file · Epilogue' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Crew file' })).toBeFocused();
    await expect(page).toHaveURL(/#crew-file$/);
  });

  test('it is the end of the page: nothing scrolls past its footer', async ({ page }) => {
    await page.goto('/#crew-file', { waitUntil: 'networkidle' });
    // Sin WebGL (un motor del CI sin GPU), el aviso abajo alarga el documento lo que mide (`Notice`): fuera.
    await settleScene(page);
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    const [section, end] = await Promise.all([
      crewFile(page).boundingBox(),
      page.evaluate(() => window.innerHeight),
    ]);
    const bottom = Math.round((section?.y ?? 0) + (section?.height ?? 0));
    // Las dos: no se sale por abajo y no hay nada debajo (con el scroll al final, el `≤` solo se cumple siempre).
    expect(bottom).toBeLessThanOrEqual(end);
    expect(bottom).toBeGreaterThanOrEqual(end - 1);
    await expect(
      crewFile(page).getByRole('link', { name: /^This site is open source/ }),
    ).toBeVisible();
  });

  test('«Download CV» and the email work in both languages', async ({ page }) => {
    for (const path of ['/', '/es']) {
      await page.goto(`${path}#crew-file`, { waitUntil: 'networkidle' });
      const cv = crewFile(page).getByRole('link', { name: /^(?:Download CV|Descargar CV)/ });
      await expect(cv).toHaveAttribute('href', profile.cv.en ?? '');
      const response = await page.request.get(profile.cv.en ?? '');
      expect(response.ok()).toBe(true);
      expect(response.headers()['content-type']).toContain('pdf');
      await expect(
        crewFile(page).getByRole('link', { name: profile.contact.email }),
      ).toHaveAttribute('href', `mailto:${profile.contact.email}`);
    }
  });

  test('390 px: no sideways scroll, and «Download CV» right after the title, before the file', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#crew-file', { waitUntil: 'networkidle' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    const [cv, file] = await Promise.all([
      crewFile(page)
        .getByRole('link', { name: /^Download CV/ })
        .boundingBox(),
      crewFile(page).locator('dl').boundingBox(),
    ]);
    expect(cv?.height).toBeGreaterThanOrEqual(44);
    expect(cv?.y ?? 0).toBeLessThan(file?.y ?? 0);
  });

  for (const width of [360, 390]) {
    for (const path of ['/', '/es']) {
      test(`${path} at ${String(width)} px with text at 200 %: nothing of the Crew file is cut`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(`${path}#crew-file`, { waitUntil: 'networkidle' });
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%';
        });
        // El texto del cuerpo, los botones («Copy») y la franja del canal (su primer hijo).
        const cut = await crewFile(page).evaluate((section) =>
          [
            ...section.querySelectorAll('h2, li, dd, dt, p, a, button'),
            ...(section.firstElementChild?.querySelectorAll('*') ?? []),
          ]
            .filter((element) => element.scrollWidth > element.clientWidth)
            .map((element) => element.textContent.slice(0, 40)),
        );
        expect(cut).toEqual([]);
        // La sección entera, no la página: a 200 % las filas de Proyectos ya se salen (deuda de F6, STATE.md).
        const section = await crewFile(page).evaluate((element) => ({
          scroll: element.scrollWidth,
          client: element.clientWidth,
        }));
        expect(section.scroll).toBeLessThanOrEqual(section.client);
      });
    }
  }

  for (const { width, height } of [
    { width: 844, height: 390 },
    { width: 800, height: 360 },
  ]) {
    test(`${String(width)}×${String(height)} (a phone on its side): the whole rail fits under the bar, eight stops of at least 24 px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/#crew-file', { waitUntil: 'networkidle' });
      const links = rail(page).getByRole('link');
      await expect(links).toHaveCount(8);
      const boxes = await links.evaluateAll((elements) =>
        elements.map((element) => {
          const { top, bottom, height: size } = element.getBoundingClientRect();
          return { top, bottom, size };
        }),
      );
      const bar = await page.getByRole('banner').boundingBox();
      expect(boxes[0]?.top ?? 0).toBeGreaterThanOrEqual(
        Math.floor((bar?.y ?? 0) + (bar?.height ?? 0)),
      );
      expect(boxes.at(-1)?.bottom ?? Infinity).toBeLessThanOrEqual(height + 0.5);
      for (const box of boxes) expect(box.size).toBeGreaterThanOrEqual(24);
    });
  }

  test('with reduced motion nothing is held back: every line is there and no teletype', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#crew-file', { waitUntil: 'networkidle' });
    await settleScene(page);
    await expect(crewFile(page)).not.toHaveAttribute('data-armed');
    const clips = await crewFile(page)
      .locator('[data-line]')
      .evaluateAll((lines) => lines.map((line) => getComputedStyle(line).clipPath));
    expect(new Set(clips)).toEqual(new Set(['none']));
  });

  test('without WebGL it reads whole, over the still photo of the portrait', async ({ page }) => {
    await withoutWebGL(page);
    await page.goto('/#crew-file', { waitUntil: 'networkidle' });
    const region = page.getByRole('region', { name: 'Crew file' });
    await expect(region.getByRole('term')).toHaveCount(6);
    await expect(region.getByRole('term').first()).toHaveText('Role');
    await expect(region.getByRole('link', { name: /^Download CV/ })).toBeVisible();
    await expect(region.getByRole('link', { name: profile.contact.email })).toBeVisible();
    await expect(region.getByRole('link', { name: /^This site is open source/ })).toBeVisible();
    await expect(page.locator('[data-scene-stills] img[data-still-chapter="5"]')).toHaveAttribute(
      'data-visible',
      'true',
    );
  });

  test('with the keyboard, what takes the focus is never hidden by the teletype', async ({
    page,
  }) => {
    await page.goto('/#contact', { waitUntil: 'networkidle' });
    await settleScene(page);
    await expect(crewFile(page)).toHaveAttribute('data-armed', '');
    // El último control de Contacto y, con Tab, el primero del Crew file (antes de que el teletipo llegue a él).
    await page.getByRole('region', { name: 'Touchdown' }).getByRole('link').last().focus();
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveAccessibleName(/^Download CV/);
    await expect(focused).toBeInViewport();
    expect(
      await focused.evaluate((element) => {
        const line = element.closest('[data-line]');
        return line === null ? 'no line' : getComputedStyle(line).clipPath;
      }),
    ).toBe('none');
  });

  test('915×412 (a big phone on its side): the rail keeps only its dots and the HUD steps aside', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 915, height: 412 });
    await page.goto('/#contact', { waitUntil: 'networkidle' });
    await expect(hud(page)).toBeHidden();
    // Solo los puntos: cada parada, del ancho del área táctil (con su texto mide ~150 px).
    const boxes = await rail(page)
      .getByRole('link')
      .evaluateAll((links) =>
        links.map((link) => link.getBoundingClientRect().toJSON() as DOMRect),
      );
    expect(boxes).toHaveLength(8);
    for (const box of boxes) expect(box.width).toBeLessThanOrEqual(48);
    expect(boxes.at(-1)?.bottom ?? Infinity).toBeLessThanOrEqual(412 + 0.5);
  });

  test('Contact no longer carries the education nor the site footer', async ({ page }) => {
    await page.goto('/#contact', { waitUntil: 'networkidle' });
    const contact = page.getByRole('region', { name: 'Touchdown' });
    await expect(contact.getByText('Master.D')).toHaveCount(0);
    await expect(contact.getByRole('link', { name: /^This site is open source/ })).toHaveCount(0);
  });
});
