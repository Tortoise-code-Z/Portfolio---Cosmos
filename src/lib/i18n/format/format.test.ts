import { afterEach, describe, expect, it, vi } from 'vitest';

import { capitalize, formatList, formatMonth, formatNumber } from './format';

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

describe('formatMonth', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('escribe el mes en corto en cada idioma', () => {
    expect(formatMonth('en', '2026-11')).toBe('Nov 2026');
    expect(formatMonth('es', '2026-11')).toBe('nov 2026');
    expect(formatMonth('en', '2027-01')).toBe('Jan 2027');
  });

  it('sin moverse por la zona horaria: en Honolulú (UTC−10) el 1 de diciembre a las 0:00 UTC aún es noviembre', async () => {
    vi.stubEnv('TZ', 'Pacific/Honolulu');
    // Un módulo nuevo: los formateadores se guardan, y uno creado antes llevaría la zona de entonces.
    vi.resetModules();
    const { formatMonth: inHonolulu } = await import('./format');
    expect(inHonolulu('en', '2026-12')).toBe('Dec 2026');
  });

  it('lo que no es un mes se queda tal cual (también un mes 00 o 13, que la fecha desbordaría)', () => {
    expect(formatMonth('en', 'pronto')).toBe('pronto');
    expect(formatMonth('es', '2026-1')).toBe('2026-1');
    expect(formatMonth('en', '2026-13')).toBe('2026-13');
    expect(formatMonth('en', '2026-00')).toBe('2026-00');
  });
});
