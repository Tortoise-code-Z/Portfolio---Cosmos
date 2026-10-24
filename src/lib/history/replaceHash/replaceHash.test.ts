import { afterEach, describe, expect, it } from 'vitest';

import { replaceHash } from './replaceHash';

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('replaceHash', () => {
  it('changes the anchor in place: same entry, same state, same path and query', () => {
    window.history.replaceState({ key: 'abc' }, '', '/es?x=1#about');
    const length = window.history.length;
    replaceHash('#quick');
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(
      '/es?x=1#quick',
    );
    expect(window.history.length).toBe(length);
    expect(window.history.state).toEqual({ key: 'abc' });
  });

  it('an empty anchor leaves the address without #', () => {
    window.history.replaceState(null, '', '/#quick');
    replaceHash('');
    expect(window.location.href.endsWith('/')).toBe(true);
    expect(window.location.hash).toBe('');
  });
});
