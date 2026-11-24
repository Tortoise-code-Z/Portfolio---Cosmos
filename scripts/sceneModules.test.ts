// @vitest-environment node
// La tabla única de la escena (`sceneModules.ts`): que no falte ninguna carpeta de `src/scene/`, que lo que dice de
// cada pieza case con sus imports y que la configuración real de ESLint cierre al código puro las que dice impuras.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint, Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

import {
  IMPURE_SCENE_NAMES,
  PURE_SCENE_FOLDERS,
  SCENE_MODULES,
  STILLS_EXCLUDED,
  STILLS_SCENE_PATHS,
  STRICT_SCENE_NAMES,
  type SceneModule,
  type SceneModuleName,
} from './sceneModules';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCENE = join(ROOT, 'src', 'scene');

/** Los archivos de una carpeta, recursivos, con su ruta desde la raíz del repo y `/`. */
function filesIn(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .map((name) => join(dir, name))
    .filter((path) => statSync(path).isFile())
    .map((path) => relative(ROOT, path).split(sep).join('/'));
}

const sceneFolders = readdirSync(SCENE).filter((name) => statSync(join(SCENE, name)).isDirectory());
const modules = Object.entries(SCENE_MODULES) as [SceneModuleName, SceneModule][];

/** Lo que hace impura una pieza sin pasar por otra: Three, React (y su router), Zustand o un store. */
const IMPURE_IMPORT =
  /^(?:three(?:\/|$)|@react-three\/|react(?:-dom|-router)?(?:\/|$)|zustand(?:\/|$)|~\/stores(?:\/|$))/;
const IMPORT_FROM =
  /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+'([^']+)'|(?:^|\n)\s*import\s+'([^']+)'/g;

/** Lo que importa el código (no los tests) de una pieza. */
function importsOf(name: string): { file: string; source: string }[] {
  return filesIn(join(SCENE, name))
    .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
    .flatMap((file) =>
      [...readFileSync(join(ROOT, file), 'utf8').matchAll(IMPORT_FROM)].map((match) => ({
        file,
        source: match[1] ?? match[2] ?? '',
      })),
    );
}

/** La pieza de `scene/` a la que apunta un import relativo (o con `~/scene`), o ninguna. */
function sceneModuleOf(file: string, source: string): string | null {
  const path = source.startsWith('~/scene/')
    ? `src/scene/${source.slice('~/scene/'.length)}`
    : source.startsWith('.')
      ? posix.join(posix.dirname(file), source)
      : null;
  const match = path === null ? null : /^src\/scene\/([^/]+)/.exec(path);
  return match?.[1] ?? null;
}

/** Las piezas que usan Three, React, Zustand o un store, directamente o a través de otra pieza que los usa. */
function impureByImports(): Set<string> {
  const direct = new Map(modules.map(([name]) => [name, importsOf(name)]));
  const impure = new Set<string>();
  for (const [name, imports] of direct) {
    if (imports.some(({ source }) => IMPURE_IMPORT.test(source))) impure.add(name);
  }
  // Lo que importa una impura, también: se repite hasta que no cambia.
  for (let changed = true; changed;) {
    changed = false;
    for (const [name, imports] of direct) {
      if (impure.has(name)) continue;
      const via = imports.some(({ file, source }) => {
        const target = sceneModuleOf(file, source);
        return target !== null && target !== name && impure.has(target);
      });
      if (via) {
        impure.add(name);
        changed = true;
      }
    }
  }
  return impure;
}

describe('the scene table (scripts/sceneModules.ts)', () => {
  it('classifies every folder of src/scene, and only those', () => {
    const listed = [...PURE_SCENE_FOLDERS, ...modules.map(([name]) => name)].sort();
    expect(listed).toEqual([...sceneFolders].sort());
  });

  it('every shader lives in scene/shaders (the tests read that folder whole)', () => {
    const shaders = filesIn(SCENE).filter((file) => file.endsWith('.glsl'));
    expect(shaders.length).toBeGreaterThan(0);
    for (const file of shaders) expect(file, file).toMatch(/^src\/scene\/shaders\//);
  });

  it('impure matches the imports: Three, React, Zustand or a store, or another piece that uses them', () => {
    const impure = impureByImports();
    for (const [name, { impure: declared }] of modules) {
      // Una pieza cerrada por decisión (un motivo) no los usa: si los usara, sería `true`.
      expect(impure.has(name), name).toBe(typeof declared === 'string' ? false : declared);
    }
  });

  it('every piece left out of the 90 % or of the stills says why', () => {
    for (const [name, { strict, stills, impure }] of modules) {
      for (const value of [strict, stills, impure]) {
        if (typeof value === 'string') expect(value.trim().length, name).toBeGreaterThan(10);
      }
    }
  });

  it('the lists come out of it', () => {
    expect(IMPURE_SCENE_NAMES).toEqual(
      modules.filter(([, { impure }]) => impure !== false).map(([name]) => name),
    );
    expect(STRICT_SCENE_NAMES).toEqual(
      modules.filter(([, { strict }]) => strict === true).map(([name]) => name),
    );
    expect(STILLS_SCENE_PATHS).toEqual(
      expect.arrayContaining(PURE_SCENE_FOLDERS.map((name) => `src/scene/${name}`)),
    );
  });

  it('what the stills leave out exists and lies inside a folder that the fingerprint reads', () => {
    for (const path of Object.keys(STILLS_EXCLUDED)) {
      expect(statSync(join(ROOT, path)).isDirectory(), path).toBe(true);
      expect(
        STILLS_SCENE_PATHS.some((source) => path.startsWith(`${source}/`)),
        path,
      ).toBe(true);
    }
  });
});

describe('the pure scene code in eslint.config.js', () => {
  /** El archivo desde el que se importa: código puro (`scene/math`). */
  const PROBE = 'src/scene/math/probe.ts';
  const RULE = 'no-restricted-imports';

  it('cannot import an impure piece, and can import the others', async () => {
    const config = (await new ESLint().calculateConfigForFile(PROBE)) as Linter.Config;
    const setting = config.rules?.[RULE];
    expect(setting).toBeDefined();
    const linter = new Linter();
    const closed = (name: string): boolean =>
      linter
        .verify(
          `import { x } from '../../${name}/${name}';\nexport const y = x;\n`,
          [
            {
              files: ['**/*.ts'],
              languageOptions: { parser: tseslint.parser },
              rules: { [RULE]: setting ?? 'off' },
            },
          ],
          { filename: PROBE },
        )
        .some(({ message }) => message.includes('es código puro'));
    for (const [name, { impure }] of modules) expect(closed(name), name).toBe(impure !== false);
  });
});
