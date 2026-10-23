import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Origen fijo para los tests (EST-F2-3-15): no depende del .env de cada equipo ni del CI.
vi.stubEnv('VITE_SITE_URL', 'https://cosmos.test');

// Sin globals de Vitest, Testing Library no limpia sola entre tests.
afterEach(() => {
  cleanup();
});
