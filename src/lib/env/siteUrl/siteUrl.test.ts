import { describe, expect, it } from 'vitest';

import { EnvError, parseSiteUrl } from './siteUrl';

describe('parseSiteUrl', () => {
  it('returns the origin of a valid https URL', () => {
    expect(parseSiteUrl('https://cosmos-portfolio.vercel.app')).toBe(
      'https://cosmos-portfolio.vercel.app',
    );
  });

  it('trims spaces and drops the trailing slash', () => {
    expect(parseSiteUrl('  https://example.com/  ')).toBe('https://example.com');
  });

  it.each([undefined, '', '   '])('rejects a missing value (%j)', (value) => {
    expect(() => parseSiteUrl(value)).toThrow(/missing/);
  });

  it('rejects something that is not a URL', () => {
    expect(() => parseSiteUrl('not a url')).toThrow(/not a valid URL/);
  });

  it('rejects http', () => {
    expect(() => parseSiteUrl('http://example.com')).toThrow(/https/);
  });

  it.each(['https://example.com/es', 'https://example.com/?a=1', 'https://example.com/#top'])(
    'rejects a URL with path, query or hash (%s)',
    (value) => {
      expect(() => parseSiteUrl(value)).toThrow(/origin/);
    },
  );

  it('throws EnvError so the build output says what failed', () => {
    expect(() => parseSiteUrl(undefined)).toThrow(EnvError);
  });
});
