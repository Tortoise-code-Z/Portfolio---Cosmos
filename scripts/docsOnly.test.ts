// @vitest-environment node
// Crea repos de git de usar y tirar en la carpeta temporal: no necesita DOM.

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { checkDocsOnly, isDocPath, isDocsOnly } from './docsOnly.ts';

const CLI = join(dirname(fileURLToPath(import.meta.url)), 'docs-only.ts');

describe('isDocPath', () => {
  it('a .md anywhere but src/, tests/ and public/ is a doc', () => {
    expect(isDocPath('STATE.md')).toBe(true);
    expect(isDocPath('docs/04-escena/rendimiento.md')).toBe(true);
    expect(isDocPath('docs/_historial/estado/2026-11.md')).toBe(true);
    expect(isDocPath('.github/pull_request_template.md')).toBe(true);
    // Solo cuentan las carpetas de la raíz.
    expect(isDocPath('docs/src/notes.md')).toBe(true);
    expect(isDocPath('srcnotes.md')).toBe(true);
  });

  it('a .md in src/, tests/ or public/ is not (public/ goes to the site)', () => {
    expect(isDocPath('src/content/notes.md')).toBe(false);
    expect(isDocPath('tests/e2e/README.md')).toBe(false);
    expect(isDocPath('public/humans.md')).toBe(false);
  });

  it('anything that is not a .md is not a doc, not even in docs/', () => {
    expect(isDocPath('docs/referencia/prototipo-v0.1.html')).toBe(false);
    expect(isDocPath('docs/diagram.png')).toBe(false);
    expect(isDocPath('docs/notes.MD')).toBe(false);
    expect(isDocPath('docs/notes.md.ts')).toBe(false);
    expect(isDocPath('vercel.json')).toBe(false);
  });
});

describe('isDocsOnly', () => {
  it('only docs → yes; one path of code → no; nothing → no', () => {
    expect(isDocsOnly(['STATE.md', 'docs/05-tecnico/calidad.md'])).toBe(true);
    expect(isDocsOnly(['STATE.md', 'src/root.tsx'])).toBe(false);
    expect(isDocsOnly([])).toBe(false);
  });
});

describe('checkDocsOnly (on a throwaway repo)', () => {
  let repo = '';
  const commits = new Map<string, string>();

  function git(...args: string[]): string {
    return execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
  }

  /** Escribe los archivos, hace el commit (sin hooks ni firma de la configuración del equipo) y guarda su hash. */
  function commit(name: string, files: Readonly<Record<string, string>>): void {
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(repo, path)), { recursive: true });
      writeFileSync(join(repo, path), text);
    }
    git('add', '--all');
    git(
      '-c',
      'commit.gpgsign=false',
      'commit',
      '--quiet',
      '--no-verify',
      '--allow-empty',
      '-m',
      name,
    );
    commits.set(name, git('rev-parse', 'HEAD'));
  }

  function hash(name: string): string {
    const value = commits.get(name);
    if (value === undefined) throw new Error(`No commit named ${name}`);
    return value;
  }

  beforeAll(() => {
    repo = mkdtempSync(join(tmpdir(), 'docs-only-'));
    git('init', '--quiet');
    git('config', 'user.name', 'Test');
    git('config', 'user.email', 'test@example.com');
    git('config', 'core.autocrlf', 'false');
    commit('base', { 'STATE.md': 'a', 'src/a.ts': 'export {};', 'docs/x.md': 'a' });
    commit('docs', { 'STATE.md': 'b', 'docs/x.md': 'b', 'docs/nuevo.md': 'c' });
    commit('code', { 'src/a.ts': 'export const a = 1;' });
    commit('mixed', { 'STATE.md': 'c', 'vercel.json': '{}' });
    git('mv', 'src/a.ts', 'docs/a.md');
    commit('rename', {});
    git('rm', '--quiet', 'docs/nuevo.md');
    commit('delete-doc', {});
    commit('empty', {});
  });

  afterAll(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  it('only docs changed (edited and new) → yes', () => {
    expect(checkDocsOnly(hash('base'), hash('docs'), repo)).toEqual({
      docsOnly: true,
      message: '[docs-only] yes: 3 docs file(s) changed',
    });
  });

  it('a deleted doc is still only docs', () => {
    expect(checkDocsOnly(hash('rename'), hash('delete-doc'), repo).docsOnly).toBe(true);
  });

  it('code, or docs with code, → no, naming the code', () => {
    expect(checkDocsOnly(hash('docs'), hash('code'), repo)).toEqual({
      docsOnly: false,
      message: '[docs-only] no: src/a.ts',
    });
    expect(checkDocsOnly(hash('code'), hash('mixed'), repo).message).toBe(
      '[docs-only] no: vercel.json',
    );
    // Varios commits a la vez: basta uno con código.
    expect(checkDocsOnly(hash('base'), hash('mixed'), repo).docsOnly).toBe(false);
  });

  it('code renamed to a .md counts as code (the old path is in the change)', () => {
    expect(checkDocsOnly(hash('mixed'), hash('rename'), repo)).toEqual({
      docsOnly: false,
      message: '[docs-only] no: src/a.ts',
    });
  });

  it('nothing changed → no (an empty commit skips nothing)', () => {
    expect(checkDocsOnly(hash('delete-doc'), hash('empty'), repo)).toEqual({
      docsOnly: false,
      message: '[docs-only] no: nothing changed (treated as code)',
    });
  });

  it('a ref that is not a commit hash → no, without asking git', () => {
    const docs = hash('docs');
    for (const ref of ['', 'main', '--output=out.txt', '0'.repeat(40), 'HEAD~1', `${docs} `]) {
      expect(checkDocsOnly(ref, docs, repo)).toEqual({
        docsOnly: false,
        message: `[docs-only] no: "${ref}" is not a commit (treated as code)`,
      });
    }
  });

  it('a commit that is not in the clone → no (the Vercel clone is shallow)', () => {
    const missing = 'a'.repeat(40);
    expect(checkDocsOnly(missing, hash('docs'), repo)).toEqual({
      docsOnly: false,
      message: `[docs-only] no: git could not compare ${missing} and ${hash('docs')} (treated as code)`,
    });
  });

  it('HEAD is accepted (Vercel compares its previous deployment with HEAD)', () => {
    expect(checkDocsOnly(hash('rename'), 'HEAD', repo).docsOnly).toBe(true);
  });

  it('names five paths of code at most and counts the rest', () => {
    git('checkout', '--quiet', hash('empty'));
    commit(
      'many',
      Object.fromEntries(
        ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((name) => [`src/${name}.ts`, name]),
      ),
    );
    expect(checkDocsOnly(hash('empty'), hash('many'), repo).message).toBe(
      '[docs-only] no: src/a.ts, src/b.ts, src/c.ts, src/d.ts, src/e.ts and 2 more',
    );
  });

  it('the command exits with 0 only for docs, as the hook, the CI and Vercel expect', () => {
    const run = (base: string, head: string): number | null =>
      spawnSync(process.execPath, [CLI, base, head], { cwd: repo }).status;
    expect(run(hash('base'), hash('docs'))).toBe(0);
    expect(run(hash('docs'), hash('code'))).toBe(1);
    expect(run('', hash('docs'))).toBe(1);
  });
});
