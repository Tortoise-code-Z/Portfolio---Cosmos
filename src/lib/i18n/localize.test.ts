import { describe, expect, it } from 'vitest';

import { localize } from './localize';

describe('localize', () => {
  it('traduce un Localized y deja tal cual un nombre propio', () => {
    expect(localize('es', { en: 'Responsive design', es: 'Diseño responsive' })).toBe(
      'Diseño responsive',
    );
    expect(localize('en', { en: 'Responsive design', es: 'Diseño responsive' })).toBe(
      'Responsive design',
    );
    expect(localize('es', 'React Query')).toBe('React Query');
  });
});
