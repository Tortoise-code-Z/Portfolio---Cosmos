import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

/**
 * Presupuestos que se pueden medir sobre el build antes de Lighthouse CI (F6).
 * Cifras en docs/05-tecnico/calidad.md («Presupuestos»).
 */

const ASSETS_DIR = fileURLToPath(new URL('../../build/client/assets/', import.meta.url));
/** Fuentes (todas, woff2 subconjunto latino) ≤ 150 KB. */
const FONT_BUDGET_BYTES = 150_000;
/** Caras de `src/styles/fonts.css`: Anybody, Geologica y Plex Mono 400 y 500. */
const EXPECTED_FONT_FILES = 4;

test.describe('build budgets', () => {
  test('self-hosted fonts stay within the font budget', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    const fonts = readdirSync(ASSETS_DIR).filter((name) => name.endsWith('.woff2'));
    const totalBytes = fonts.reduce((sum, name) => sum + statSync(join(ASSETS_DIR, name)).size, 0);
    expect(fonts).toHaveLength(EXPECTED_FONT_FILES);
    expect(totalBytes).toBeLessThanOrEqual(FONT_BUDGET_BYTES);
  });
});
