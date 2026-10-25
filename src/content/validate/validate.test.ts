// Cada comprobación de `validate.ts`, con casos rotos a propósito: si una deja de detectar lo que
// vigila, este archivo falla aunque el contenido real esté bien.

import { describe, expect, it } from 'vitest';

import type { CoverAsset, ImageAsset, ResponsiveImage } from '../types';

import {
  findEmailProblems,
  findEmptyListProblems,
  findIdProblems,
  findImageFileProblems,
  findImageProblems,
  findPositiveIntegerProblems,
  findProjectMediaProblems,
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
        process: { en: [], es: [] },
        highlights: [],
        count: 3,
        flag: true,
      }),
    ).toEqual([]);
  });

  it.each([
    ['texto vacío', { name: '' }, '$.name: texto vacío'],
    ['solo espacios', { name: '   ' }, '$.name: texto vacío'],
    ['espacio al principio', { name: ' Chessmate' }, '$.name: espacios sobrantes'],
    ['espacio al final', { name: 'Chessmate ' }, '$.name: espacios sobrantes'],
    ['traducción vacía', { t: { en: 'A', es: '' } }, '$.t.es: texto vacío'],
    ['original vacío', { t: { en: '', es: 'B' } }, '$.t.en: texto vacío'],
    ['falta un idioma', { t: { en: 'A' } }, '$.t: un Localized lleva exactamente en y es'],
    ['idioma de más', { t: { en: 'A', es: 'B', fr: 'C' } }, '$.t: un Localized lleva'],
    ['clave ajena', { t: { en: 'A', esp: 'B' } }, '$.t: un Localized lleva'],
    ['null en un solo idioma', { cv: { en: '/cv.pdf', es: null } }, '$.cv: null en un idioma'],
    ['tipos distintos', { t: { en: 'A', es: ['B'] } }, '$.t: en y es deben ser'],
    ['ES más corta', { bio: { en: ['a', 'b'], es: ['c'] } }, '$.bio: 2 elementos en en y 1'],
    ['ES más larga', { bio: { en: ['a'], es: ['b', 'c'] } }, '$.bio: 1 elementos en en y 2'],
    ['párrafo ES vacío', { bio: { en: ['a'], es: [''] } }, '$.bio.es[0]: texto vacío'],
    ['párrafo EN vacío', { bio: { en: [''], es: ['a'] } }, '$.bio.en[0]: texto vacío'],
    ['dentro de listas anidadas', { items: [{ t: { en: 'A', es: ' ' } }] }, '$.items[0].t.es'],
  ])('detecta: %s', (_case, value, expected) => {
    const problems = findTextProblems(value);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(expected);
  });
});

describe('findIdProblems', () => {
  it('acepta ids en minúsculas con guiones sueltos', () => {
    expect(findIdProblems(['react-ts', 'r3f', 'html', 'a-b-c', '3d'], 'skill')).toEqual([]);
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
    ['https mal formada', 'https://exa mple.com', 'URL no válida'],
  ])('rechaza %s', (_case, url, expected) => {
    expect(findUrlProblems({ code: url })).toEqual([expect.stringContaining(expected)]);
  });
});

describe('findEmailProblems', () => {
  it.each([['a.b@mail.com'], ['victorperez.brmte@passmail.com'], ['a@sub.mail.com']])(
    'acepta «%s»',
    (email) => {
      expect(findEmailProblems(email, 'email')).toEqual([]);
    },
  );

  it.each([
    ['sin-arroba.com'],
    ['a@b'],
    ['a b@c.com'],
    [''],
    ['mailto:a@b.c'],
    ['a@b..c'],
    ['a@b.c.'],
    ['a@b.com x'],
    ['a@b@c.com'],
  ])('rechaza «%s»', (email) => {
    expect(findEmailProblems(email, 'email')).toHaveLength(1);
  });
});

describe('findPositiveIntegerProblems', () => {
  it('acepta enteros mayores que cero', () => {
    expect(findPositiveIntegerProblems({ a: 1, b: 948 })).toEqual([]);
  });

  it.each([[0], [-3], [1.5], [Number.NaN]])('rechaza %s', (value) => {
    expect(findPositiveIntegerProblems({ 'education.x.hours': value })).toEqual([
      `education.x.hours: ${String(value)} no es un entero positivo`,
    ]);
  });
});

const IMAGE: ResponsiveImage = {
  src: '/a-1920.webp',
  width: 1920,
  height: 911,
  sources: {
    avif: '/a-640.avif 640w, /a-1280.avif 1280w, /a-1920.avif 1920w',
    webp: '/a-640.webp 640w, /a-1280.webp 1280w, /a-1920.webp 1920w',
  },
};

describe('findImageProblems', () => {
  it('acepta una imagen con sus variantes en orden y src = WebP mayor', () => {
    expect(findImageProblems({ 'chessmate.cover': IMAGE })).toEqual([]);
  });

  it.each([
    ['src vacío', { ...IMAGE, src: '' }, 'x.src: vacío'],
    ['ancho 0', { ...IMAGE, width: 0 }, 'x.width: no es un entero positivo'],
    ['alto decimal', { ...IMAGE, height: 911.5 }, 'x.height: no es un entero positivo'],
    [
      'srcset vacío',
      { ...IMAGE, sources: { ...IMAGE.sources, avif: '' } },
      'x.sources.avif: srcset mal formado',
    ],
    [
      'entrada sin ancho',
      { ...IMAGE, sources: { ...IMAGE.sources, avif: '/a-640.avif, /a-1920.avif 1920w' } },
      'x.sources.avif: srcset mal formado',
    ],
    [
      'densidad en vez de ancho',
      { ...IMAGE, sources: { ...IMAGE.sources, webp: '/a-1920.webp 2x' } },
      'x.sources.webp: srcset mal formado',
    ],
    [
      'anchos desordenados',
      {
        ...IMAGE,
        sources: {
          ...IMAGE.sources,
          avif: '/a-1280.avif 1280w, /a-640.avif 640w, /a-1920.avif 1920w',
        },
      },
      'x.sources.avif: anchos sin orden creciente o repetidos',
    ],
    [
      'anchos repetidos',
      {
        ...IMAGE,
        sources: {
          ...IMAGE.sources,
          webp: '/a-640.webp 640w, /a-640.webp 640w, /a-1920.webp 1920w',
        },
      },
      'x.sources.webp: anchos sin orden creciente o repetidos',
    ],
    [
      'variante mayor que no mide el ancho',
      { ...IMAGE, sources: { ...IMAGE.sources, avif: '/a-640.avif 640w, /a-1280.avif 1280w' } },
      'x.sources.avif: la variante mayor (1280w) no mide el ancho de la imagen',
    ],
    [
      'src que no es la WebP mayor',
      { ...IMAGE, src: '/a-640.webp' },
      'x.src: no es la variante WebP mayor',
    ],
  ])('detecta: %s', (_case, image, problem) => {
    // Un fallo puede arrastrar otro (src vacío tampoco es la WebP mayor): basta con que salga el suyo.
    expect(findImageProblems({ x: image })).toContainEqual(expect.stringContaining(problem));
  });
});

const HOME: ImageAsset = { ...IMAGE, alt: { en: 'Home', es: 'Inicio' } };
const NEWS: ImageAsset = {
  ...IMAGE,
  src: '/b-1920.webp',
  sources: {
    avif: '/b-640.avif 640w, /b-1280.avif 1280w, /b-1920.avif 1920w',
    webp: '/b-640.webp 640w, /b-1280.webp 1280w, /b-1920.webp 1920w',
  },
  alt: { en: 'News', es: 'Noticias' },
};
const COVER: CoverAsset = {
  ...HOME,
  alt: { en: 'Home page', es: 'Página de inicio' },
  share: { src: '/a.jpeg', width: 1200, height: 569 },
};

describe('findProjectMediaProblems', () => {
  it('acepta portada = 1.ª captura con su imagen de 1200 px, y un proyecto sin imágenes', () => {
    expect(
      findProjectMediaProblems(
        [
          { slug: 'a', cover: COVER, gallery: [HOME, NEWS] },
          { slug: 'b', cover: null, gallery: [] },
        ],
        1200,
      ),
    ).toEqual([]);
  });

  it.each([
    [
      'galería sin portada',
      { slug: 'a', cover: null, gallery: [HOME, NEWS] },
      ['a.cover: falta (el proyecto tiene galería)'],
    ],
    [
      'portada que no es la 1.ª captura',
      { slug: 'a', cover: COVER, gallery: [NEWS, HOME] },
      ['a.cover: no es la primera captura de la galería'],
    ],
    [
      'portada sin galería',
      { slug: 'a', cover: COVER, gallery: [] },
      ['a.cover: no es la primera captura de la galería'],
    ],
    [
      'imagen para compartir de otro ancho',
      { slug: 'a', cover: { ...COVER, share: { ...COVER.share, width: 640 } }, gallery: [HOME] },
      ['a.cover.share.width: mide 640, no 1200'],
    ],
    [
      'captura repetida aunque cambie su texto',
      { slug: 'a', cover: COVER, gallery: [HOME, NEWS, { ...NEWS, alt: HOME.alt }] },
      ['a.gallery[2]: captura repetida («/b-1920.webp»)'],
    ],
  ])('detecta: %s', (_case, project, problems) => {
    expect(findProjectMediaProblems([project], 1200)).toEqual(problems);
  });
});

describe('findImageFileProblems', () => {
  it('acepta un archivo con src y medidas', () => {
    expect(findImageFileProblems({ share: { src: '/a.jpeg', width: 1200, height: 576 } })).toEqual(
      [],
    );
  });

  it('detecta src vacío y medidas no válidas, con su ruta', () => {
    expect(findImageFileProblems({ share: { src: '', width: -1, height: 0 } })).toEqual([
      'share.src: vacío',
      'share.width: no es un entero positivo',
      'share.height: no es un entero positivo',
    ]);
  });
});

describe('findEmptyListProblems', () => {
  it('acepta listas con elementos', () => {
    expect(findEmptyListProblems({ a: ['x'], b: [1, 2] })).toEqual([]);
  });

  it('detecta la lista vacía con su ruta', () => {
    expect(findEmptyListProblems({ a: ['x'], 'profile.bio.en': [] })).toEqual([
      'profile.bio.en: lista vacía',
    ]);
  });
});

describe('placeholdersOf', () => {
  it('saca los huecos ordenados y sin repetir', () => {
    expect(placeholdersOf('Open image {n} of {total} ({n})')).toEqual(['n', 'total']);
    expect(placeholdersOf('{total} y {n}')).toEqual(['n', 'total']);
    expect(placeholdersOf('Sin huecos')).toEqual([]);
  });
});

describe('findUiProblems', () => {
  it('acepta los mismos textos y huecos en EN y ES', () => {
    expect(findUiProblems({ en: { a: 'Hi {name}' }, es: { a: 'Hola {name}' } })).toEqual([]);
  });

  it('acepta los huecos en distinto orden en cada idioma', () => {
    expect(findUiProblems({ en: { a: '{n} of {total}' }, es: { a: '{total}: {n}' } })).toEqual([]);
  });

  it.each([
    [
      'falta una clave en ES',
      { en: { a: 'A', b: 'B' }, es: { a: 'A' } },
      'uiTexts.es: falta la clave «b»',
    ],
    [
      'sobra una clave en ES',
      { en: { a: 'A' }, es: { a: 'A', b: 'B' } },
      'uiTexts.es: sobra la clave «b»',
    ],
    ['texto vacío', { en: { a: 'A' }, es: { a: '' } }, 'uiTexts.es.a: texto vacío'],
    ['falta un hueco', { en: { a: '{n} h' }, es: { a: 'h' } }, 'uiTexts.es.a: huecos {}'],
    [
      'hueco con otro nombre',
      { en: { a: '{n} h' }, es: { a: '{m} h' } },
      'uiTexts.es.a: huecos {m}',
    ],
    ['hueco de más en ES', { en: { a: 'h' }, es: { a: '{n} h' } }, 'uiTexts.es.a: huecos {n}'],
    ['texto EN vacío', { en: { a: '' }, es: { a: 'A' } }, 'uiTexts.en.a: texto vacío'],
    [
      'falta una clave heredable (constructor)',
      { en: { constructor: 'A' }, es: {} },
      'uiTexts.es: falta la clave «constructor»',
    ],
    [
      'sobra una clave heredable (toString)',
      { en: {}, es: { toString: 'A' } },
      'uiTexts.es: sobra la clave «toString»',
    ],
  ])('detecta: %s', (_case, texts, expected) => {
    const problems = findUiProblems(texts);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(expected);
  });
});
