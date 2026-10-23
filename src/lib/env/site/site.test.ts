import { describe, expect, it, vi } from 'vitest';

// `SITE_ORIGIN` se calcula al cargar el módulo: cada caso fija la variable y lo vuelve a cargar.
async function loadSiteOrigin(value: string): Promise<string> {
  vi.stubEnv('VITE_SITE_URL', value);
  vi.resetModules();
  const { SITE_ORIGIN } = await import('./site');
  return SITE_ORIGIN;
}

describe('SITE_ORIGIN', () => {
  it('normaliza la variable al cargar (espacios y barra final fuera)', async () => {
    await expect(loadSiteOrigin(' https://cosmos.test/ ')).resolves.toBe('https://cosmos.test');
  });

  it('rechaza una variable vacía con EnvError al cargar', async () => {
    // Tras `resetModules`, `EnvError` es otra clase que la de un import estático: se mira el nombre.
    await expect(loadSiteOrigin('')).rejects.toMatchObject({ name: 'EnvError' });
  });
});
