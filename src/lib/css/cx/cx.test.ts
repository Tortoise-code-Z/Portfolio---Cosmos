import { describe, expect, it } from 'vitest';

import { cx } from './cx';

describe('cx', () => {
  it('joins the present classes with one space', () => {
    expect(cx('a', 'b')).toBe('a b');
  });

  it('skips undefined, null, false and empty names', () => {
    expect(cx('a', undefined, null, false, '', 'b')).toBe('a b');
    expect(cx()).toBe('');
  });
});
