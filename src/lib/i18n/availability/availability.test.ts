import { describe, expect, it } from 'vitest';

import { workModesText } from './availability';

describe('workModesText', () => {
  it('arma la frase de los modos en cada idioma (textos-sitio.md)', () => {
    const modes = ['remote', 'hybrid', 'onsite'] as const;
    expect(workModesText('en', modes)).toBe('Remote, hybrid, or on-site');
    expect(workModesText('es', modes)).toBe('Remoto, híbrido o presencial');
  });

  it('sigue los datos: con un solo modo, sin conjunción', () => {
    expect(workModesText('en', ['remote'])).toBe('Remote');
    expect(workModesText('es', ['onsite', 'hybrid'])).toBe('Presencial o híbrido');
  });
});
