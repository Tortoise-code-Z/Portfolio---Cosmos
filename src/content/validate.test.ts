// Cada comprobación de `validate.ts`, con casos rotos a propósito: si una deja de detectar lo que
// vigila, este archivo falla aunque el contenido real esté bien.

import { describe, expect, it } from 'vitest';

import {
  findEmailProblems,
  findIdProblems,
  findProjectOrderProblems,
  findTextProblems,
  findUiProblems,
  findUrlProblems,
  placeholdersOf,
} from './validate';

describe('findTextProblems', () => {
  it('acepta textos, Localized de texto, de listas y de null en los dos idiomas', () => {
    expect(
      findTextProblems({
        name: 'Chessmate',
        tagline: { en: 'A', es: 'B' },
        bio: { en: ['a', 'b'], es: ['c', 'd'] },
        cv: { en: null, es: null },
        list: [{ en: 'x', es: 'y' }, 'z'],
        count: 3,
        flag: true,
      }),
    ).toEqual([]);
  });

  it.each([
    ['texto vacío', { name: '' }, '$.name: texto vacío'],
    ['solo espacios', { name: '   ' }, '$.name: texto vacío'],
    ['espacios en los extremos', { name: ' Chessmate' }, '$.name: espacios sobrantes'],
    ['traducción vacía', { t: { en: 'A', es: '' } }, '$.t.es: texto vacío'],
    ['falta un idioma', { t: { en: 'A' } }, '$.t: un Localized lleva exactamente en y es'],
    ['idioma de más', { t: { en: 'A', es: 'B', fr: 'C' } }, '$.t: un Localized lleva'],
    ['clave ajena', { t: { en: 'A', esp: 'B' } }, '$.t: un Localized lleva'],
    ['null en un solo idioma', { cv: { en: '/cv.pdf', es: null } }, '$.cv: null en un idioma'],
    ['tipos distintos', { t: { en: 'A', es: ['B'] } }, '$.t: en y es deben ser'],
    ['listas de distinta longitud', { bio: { en: ['a', 'b'], es: ['c'] } }, '$.bio: 2 elementos'],
    ['párrafo vacío', { bio: { en: ['a'], es: [''] } }, '$.bio.es[0]: texto vacío'],
    ['dentro de listas anidadas', { items: [{ t: { en: 'A', es: ' ' } }] }, '$.items[0].t.es'],
  ])('detecta: %s', (_case, value, expected) => {
    const problems = findTextProblems(value);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(expected);
  });
});

describe('findIdProblems', () => {
  it('acepta ids en minúsculas con guiones sueltos', () => {
    expect(findIdProblems(['react-ts', 'r3f', 'html'], 'skill')).toEqual([]);
  });

  it.each([['React'], ['react_ts'], ['-react'], ['react-'], ['react--ts'], ['']])(
    'rechaza el formato de «%s»',
    (id) => {
      expect(findIdProblems([id], 'skill')).toEqual([`skill «${id}»: formato no válido`]);
    },
  );

  it('detecta repetidos', () => {
    expect(findIdProblems(['git', 'vite', 'git'], 'skill')).toEqual(['skill «git»: repetido']);
  });
});

describe('findProjectOrderProblems', () => {
  const project = (slug: string, order: number, featured = false) => ({ slug, order, featured });

  it('acepta 1, 2, 3 en su posición con un featured', () => {
    expect(
      findProjectOrderProblems([project('a', 1, true), project('b', 2), project('c', 3)]),
    ).toEqual([]);
  });

  it.each([
    ['no empieza en 1', [project('a', 2, true)]],
    ['hueco', [project('a', 1, true), project('b', 3)]],
    ['repetido', [project('a', 1, true), project('b', 1)]],
    ['lista desordenada', [project('b', 2, true), project('a', 1)]],
  ])('detecta order mal: %s', (_case, list) => {
    expect(findProjectOrderProblems(list).some((problem) => problem.includes('se esperaba'))).toBe(
      true,
    );
  });

  it.each([
    ['ninguno', [project('a', 1), project('b', 2)], 0],
    ['dos', [project('a', 1, true), project('b', 2, true)], 2],
  ])('detecta featured: %s', (_case, list, count) => {
    expect(findProjectOrderProblems(list)).toEqual([
      `${String(count)} proyectos featured, debe haber exactamente uno`,
    ]);
  });
});

describe('findUrlProblems', () => {
  it('acepta https:// y omite null', () => {
    expect(findUrlProblems({ code: 'https://github.com/x', demo: null })).toEqual([]);
  });

  it.each([
    ['http', 'http://github.com/x', 'debe empezar por https://'],
    ['sin protocolo', 'github.com/x', 'URL no válida'],
    ['relativa', '/projects/x', 'URL no válida'],
    ['otro esquema', 'mailto:a@b.c', 'debe empezar por https://'],
  ])('rechaza %s', (_case, url, expected) => {
    expect(findUrlProblems({ code: url })).toEqual([expect.stringContaining(expected)]);
  });
});

describe('findEmailProblems', () => {
  it('acepta un email normal', () => {
    expect(findEmailProblems('a.b@mail.com', 'email')).toEqual([]);
  });

  it.each([['sin-arroba.com'], ['a@b'], ['a b@c.com'], ['']])('rechaza «%s»', (email) => {
    expect(findEmailProblems(email, 'email')).toHaveLength(1);
  });
});

describe('placeholdersOf', () => {
  it('saca los huecos ordenados y sin repetir', () => {
    expect(placeholdersOf('Open image {n} of {total} ({n})')).toEqual(['n', 'total']);
    expect(placeholdersOf('Sin huecos')).toEqual([]);
  });
});

describe('findUiProblems', () => {
  it('acepta los mismos textos y huecos en EN y ES', () => {
    expect(findUiProblems({ en: { a: 'Hi {name}' }, es: { a: 'Hola {name}' } })).toEqual([]);
  });

  it.each([
    [
      'falta una clave en ES',
      { en: { a: 'A', b: 'B' }, es: { a: 'A' } },
      'ui.es: falta la clave «b»',
    ],
    [
      'sobra una clave en ES',
      { en: { a: 'A' }, es: { a: 'A', b: 'B' } },
      'ui.es: sobra la clave «b»',
    ],
    ['texto vacío', { en: { a: 'A' }, es: { a: '' } }, 'ui.es.a: texto vacío'],
    ['falta un hueco', { en: { a: '{n} h' }, es: { a: 'h' } }, 'ui.es.a: huecos {}'],
    ['hueco con otro nombre', { en: { a: '{n} h' }, es: { a: '{m} h' } }, 'ui.es.a: huecos {m}'],
  ])('detecta: %s', (_case, texts, expected) => {
    const problems = findUiProblems(texts);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(expected);
  });
});
