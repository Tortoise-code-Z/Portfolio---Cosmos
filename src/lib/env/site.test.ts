import { describe, expect, it } from 'vitest';

import { SITE_ORIGIN } from './site';

describe('SITE_ORIGIN', () => {
  it('es el origen de prueba que fija tests/setup.ts, ya normalizado', () => {
    expect(SITE_ORIGIN).toBe('https://cosmos.test');
  });
});
