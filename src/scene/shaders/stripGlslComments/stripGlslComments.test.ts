import { describe, expect, it } from 'vitest';

import particlesFragment from '../particles/particles.frag.glsl?raw';
import particlesVertex from '../particles/particles.vert.glsl?raw';
import starsFragment from '../stars/stars.frag.glsl?raw';
import starsVertex from '../stars/stars.vert.glsl?raw';
import { stripGlslComments } from './stripGlslComments';

const SHADERS = { particlesVertex, particlesFragment, starsVertex, starsFragment };

/** Las líneas con código de verdad, sin comentarios a mano: lo que no puede cambiar. */
function codeLines(source: string): string[] {
  return source
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line !== '' && !line.trimStart().startsWith('//'));
}

describe('stripGlslComments', () => {
  it('removes line comments, whole or after code, and the spaces they leave', () => {
    expect(stripGlslComments('// title\nfloat a = 1.0; // why\nfloat b = a;\n')).toBe(
      '\nfloat a = 1.0;\nfloat b = a;\n',
    );
  });

  it('removes block comments and keeps their line breaks, so error line numbers still match', () => {
    const source = 'float a; /* one\ntwo\nthree */ float b;\nfloat c;';
    const stripped = stripGlslComments(source);
    expect(stripped).toBe('float a;\n\n float b;\nfloat c;');
    expect(stripped.split('\n')).toHaveLength(source.split('\n').length);
  });

  it('keeps preprocessor lines, indentation and code without comments untouched', () => {
    const code = '#define LIMIT 2.0\nvoid main() {\n  float d = 1.0 / LIMIT;\n}\n';
    expect(stripGlslComments(code)).toBe(code);
  });

  it('does not let a comment marker inside a block comment open another comment', () => {
    expect(stripGlslComments('/* a // b */float x;\n')).toBe('float x;\n');
    expect(stripGlslComments('// a /* b\nfloat x;\n// */\n')).toBe('\nfloat x;\n\n');
  });

  it.each(Object.entries(SHADERS))(
    '%s: keeps every code line and its line number, and leaves no comment behind',
    (_name, source) => {
      const stripped = stripGlslComments(source);
      const lines = stripped.split('\n');
      expect(lines).toHaveLength(source.split('\n').length);
      expect(stripped).not.toMatch(/\/\/|\/\*|\*\//);
      expect(stripped.length).toBeLessThan(source.length);
      // Lo que queda, sin las líneas vacías, es el código del archivo sin sus comentarios de final de línea.
      const expected = codeLines(source).map((line) => line.replace(/\s*\/\/.*$/, ''));
      expect(lines.filter((line) => line !== '')).toEqual(expected);
    },
  );
});
