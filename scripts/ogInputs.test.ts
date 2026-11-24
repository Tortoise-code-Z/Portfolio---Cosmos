import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { OG_JSON, ogFingerprint } from './ogInputs.ts';

const ROOT = join(import.meta.dirname, '..');

describe('la imagen para compartir y los iconos (`npm run og`)', () => {
  it('están hechos con lo que hay ahora: nombre, rol, dominio, favicon, tokens, foto de la tortuga y fuentes', () => {
    const { fingerprint } = JSON.parse(readFileSync(join(ROOT, OG_JSON), 'utf8')) as {
      readonly fingerprint: string;
    };
    expect(
      fingerprint,
      'Ha cambiado algo de lo que se ve en la imagen para compartir o en los iconos: corre `npm run og` y commitea',
    ).toBe(ogFingerprint(ROOT));
  });
});
