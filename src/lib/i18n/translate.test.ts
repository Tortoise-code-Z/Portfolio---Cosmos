import { describe, expect, expectTypeOf, it } from 'vitest';

import { uiTexts } from '~/content/texts';

import { translate, type PlaceholderName, type TranslateParams } from './translate';

describe('translate', () => {
  it('devuelve el texto del idioma pedido', () => {
    expect(translate('en', 'nav.skip')).toBe('Skip to content');
    expect(translate('es', 'nav.skip')).toBe('Saltar al contenido');
  });

  it('rellena todos los huecos, también repetidos o en otro orden', () => {
    expect(translate('en', 'project.gallery.open', { n: '2', total: '9' })).toBe(
      'Open image 2 of 9',
    );
    expect(translate('es', 'meta.project.title', { project: 'Chessmate' })).toBe(
      'Chessmate · Víctor Pérez',
    );
  });

  it('deja a la vista un hueco sin valor (solo posible saltándose el tipo)', () => {
    // @ts-expect-error -- falta `total`: el compilador lo impide; aquí se prueba la red de seguridad.
    expect(translate('en', 'project.gallery.open', { n: '2' })).toBe('Open image 2 of {total}');
  });

  it('cada clave existe en los dos idiomas', () => {
    expect(Object.keys(uiTexts.es)).toEqual(Object.keys(uiTexts.en));
  });
});

describe('tipos de translate (los comprueba tsc)', () => {
  it('saca los nombres de los huecos del texto literal', () => {
    expectTypeOf<PlaceholderName<'Open image {n} of {total}'>>().toEqualTypeOf<'n' | 'total'>();
    expectTypeOf<PlaceholderName<'Sin huecos'>>().toBeNever();
    expectTypeOf<TranslateParams<'nav.skip'>>().toEqualTypeOf<[]>();
    expectTypeOf<TranslateParams<'meta.project.title'>>().toEqualTypeOf<
      [values: Readonly<Record<'project', string>>]
    >();
  });

  it('exige exactamente los huecos de la clave, con valores de texto', () => {
    const errors = (): void => {
      // @ts-expect-error -- clave que no existe.
      translate('en', 'nav.nope');
      // @ts-expect-error -- `nav.skip` no tiene huecos.
      translate('en', 'nav.skip', { x: '1' });
      // @ts-expect-error -- faltan los huecos.
      translate('en', 'meta.project.title');
      // @ts-expect-error -- hueco de más.
      translate('en', 'meta.project.title', { project: 'A', extra: 'B' });
      // @ts-expect-error -- los números se formatean antes (formatNumber o String(year)).
      translate('en', 'footer.line', { year: 2026 });
    };
    expect(errors).toBeTypeOf('function');
  });
});
