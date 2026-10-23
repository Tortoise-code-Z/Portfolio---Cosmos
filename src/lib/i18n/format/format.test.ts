import { describe, expect, it } from 'vitest';

import { capitalize, formatList, formatNumber } from './format';

describe('formatNumber', () => {
  it.each([
    ['en', 13800, '13,800'],
    ['es', 13800, '13.800'],
    ['en', 100000, '100,000'],
    ['es', 100000, '100.000'],
    ['en', 13.8, '13.8'],
    ['es', 13.8, '13,8'],
    // ES no agrupa 4 cifras (norma RAE, textos-sitio.md); EN sí, por eso un año va con String(year).
    ['es', 1000, '1000'],
    ['en', 2026, '2,026'],
  ] as const)('%s · %d → %s', (locale, value, expected) => {
    expect(formatNumber(locale, value)).toBe(expected);
  });

  it('respeta las opciones y no las mezcla en la caché', () => {
    expect(formatNumber('en', 13.849, { maximumFractionDigits: 1 })).toBe('13.8');
    expect(formatNumber('en', 13.849, { maximumFractionDigits: 2 })).toBe('13.85');
    expect(formatNumber('en', 13.849)).toBe('13.849');
  });
});

describe('formatList', () => {
  it.each([
    ['en', 'disjunction', 'remote, hybrid, or on-site'],
    ['es', 'disjunction', 'remoto, híbrido o presencial'],
    ['en', 'conjunction', 'remote, hybrid, and on-site'],
    ['es', 'conjunction', 'remoto, híbrido y presencial'],
  ] as const)('%s · %s', (locale, kind, expected) => {
    const items =
      locale === 'en' ? ['remote', 'hybrid', 'on-site'] : ['remoto', 'híbrido', 'presencial'];
    expect(formatList(locale, items, kind)).toBe(expected);
  });

  it('una lista de uno o vacía', () => {
    expect(formatList('es', ['remoto'], 'disjunction')).toBe('remoto');
    expect(formatList('en', [], 'conjunction')).toBe('');
  });
});

describe('capitalize', () => {
  it('pone en mayúscula solo la primera letra', () => {
    expect(capitalize('en', 'remote, hybrid')).toBe('Remote, hybrid');
    expect(capitalize('es', 'ñandú')).toBe('Ñandú');
    expect(capitalize('es', '')).toBe('');
    expect(capitalize('en', 'react Query')).toBe('React Query');
  });
});
