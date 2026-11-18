// @vitest-environment node
// Crea repos de git de usar y tirar en la carpeta temporal: no necesita DOM.

import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { checkDocsOnly, checkEachCommitDocsOnly, isDocPath, isDocsOnly } from './docsOnly.ts';

const CLI = join(dirname(fileURLToPath(import.meta.url)), 'docs-only.ts');

function gitIn(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

/** Un repo vacío en la carpeta temporal, sin hooks ni firma de la configuración del equipo. */
function initRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'docs-only-'));
  gitIn(dir, 'init', '--quiet');
  gitIn(dir, 'config', 'user.name', 'Test');
  gitIn(dir, 'config', 'user.email', 'test@example.com');
  gitIn(dir, 'config', 'core.autocrlf', 'false');
  gitIn(dir, 'config', 'commit.gpgsign', 'false');
  // Ni los hooks globales del equipo (`--no-verify` no salta `post-commit` ni `post-checkout`).
  gitIn(dir, 'config', 'core.hooksPath', join(dir, '.git', 'no-hooks'));
  return dir;
}

function removeRepo(dir: string): void {
  try {
    // En Windows git deja de solo lectura sus objetos: reintentos por si el sistema aún los tiene abiertos.
    rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
  } catch (error) {
    // Un repo de prueba que se queda en la carpeta temporal no debe tumbar la suite (ni el pre-push).
    console.warn(`[docsOnly.test] could not remove ${dir}`, error);
  }
}

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

describe('on a throwaway repo', () => {
  let repo = '';
  const commits = new Map<string, string>();
  /**
   * Las variables `GIT_*` del proceso, fuera mientras duran los tests. En el pre-push de un worktree git exporta
   * `GIT_DIR`, y con ella cada orden de git (las de aquí y las de `docsOnly.ts`) iría al repo de verdad, no al de usar y
   * tirar: sus commits de prueba caerían en la rama de quien hace el push.
   */
  const gitEnv = Object.entries(process.env).filter(([key]) => key.startsWith('GIT_'));

  function git(...args: string[]): string {
    return gitIn(repo, ...args);
  }

  /** Escribe los archivos, hace el commit (sin hooks ni firma de la configuración del equipo) y guarda su hash. */
  function commit(name: string, files: Readonly<Record<string, string>> = {}): void {
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(repo, path)), { recursive: true });
      writeFileSync(join(repo, path), text);
    }
    git('add', '--all');
    git('commit', '--quiet', '--no-verify', '--allow-empty', '-m', name);
    commits.set(name, git('rev-parse', 'HEAD'));
  }

  function hash(name: string): string {
    const value = commits.get(name);
    if (value === undefined) throw new Error(`No commit named ${name}`);
    return value;
  }

  beforeAll(() => {
    for (const [key] of gitEnv) Reflect.deleteProperty(process.env, key);
    repo = initRepo();

    // Una línea: base → docs → code → mixed → rename → delete-doc → empty.
    commit('base', { 'STATE.md': 'a', 'src/a.ts': 'export {};', 'docs/x.md': 'a' });
    commit('docs', { 'STATE.md': 'b', 'docs/x.md': 'b', 'docs/nuevo.md': 'c' });
    commit('code', { 'src/a.ts': 'export const a = 1;' });
    commit('mixed', { 'STATE.md': 'c', 'vercel.json': '{}' });
    git('mv', 'src/a.ts', 'docs/a.md');
    commit('rename');
    git('rm', '--quiet', 'docs/nuevo.md');
    commit('delete-doc');
    commit('empty');

    // Ramas desde `empty`, cada una con lo suyo.
    const branch = (files: Readonly<Record<string, string>>, name: string): void => {
      git('checkout', '--quiet', '--detach', hash('empty'));
      commit(name, files);
    };
    const codePaths = (count: number): Record<string, string> =>
      Object.fromEntries(
        Array.from({ length: count }, (_, i) => [`src/${String.fromCharCode(97 + i)}.ts`, 'x']),
      );
    branch(codePaths(7), 'seven');
    branch(codePaths(5), 'five');
    // Código que entra y sale en el mismo push: el árbol final solo tiene docs.
    branch({ 'src/sneak.ts': 'x', 'docs/y.md': 'a' }, 'sneak');
    git('rm', '--quiet', 'src/sneak.ts');
    commit('unsneak', { 'docs/y.md': 'b' });
    // Un merge de dos ramas de solo docs (lo que deja un `git pull` sin `--rebase`).
    branch({ 'docs/side.md': 'a' }, 'side');
    branch({ 'docs/main.md': 'a' }, 'main-docs');
    git('merge', '--quiet', '--no-ff', '--no-edit', hash('side'));
    commits.set('merged', git('rev-parse', 'HEAD'));
    commit('after-merge', { 'docs/main.md': 'b' });

    // Ningún test mueve HEAD: queda en `empty`.
    git('checkout', '--quiet', '--detach', hash('empty'));
  });

  afterAll(() => {
    for (const [key, value] of gitEnv) process.env[key] = value;
    removeRepo(repo);
  });

  describe('checkDocsOnly (the final tree: CI and Vercel)', () => {
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
      // Varios commits a la vez: basta uno con código que siga en el árbol.
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

    it('a ref that is not a commit hash, as base or as head → no, without asking git', () => {
      const docs = hash('docs');
      const invalid = [
        '',
        'main',
        '--output=out.txt',
        '0'.repeat(40),
        'HEAD~1',
        `${docs} `,
        `x${docs}`,
        docs.slice(0, 6),
      ];
      for (const ref of invalid) {
        const expected = {
          docsOnly: false,
          message: `[docs-only] no: "${ref}" is not a commit (treated as code)`,
        };
        expect(checkDocsOnly(ref, docs, repo)).toEqual(expected);
        expect(checkDocsOnly(hash('base'), ref, repo)).toEqual(expected);
      }
    });

    it('an abbreviated hash (7 digits) is accepted', () => {
      expect(checkDocsOnly(hash('base').slice(0, 7), hash('docs').slice(0, 7), repo).docsOnly).toBe(
        true,
      );
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
      expect(checkDocsOnly(hash('empty'), hash('five'), repo).message).toBe(
        '[docs-only] no: src/a.ts, src/b.ts, src/c.ts, src/d.ts, src/e.ts',
      );
      expect(checkDocsOnly(hash('empty'), hash('seven'), repo).message).toBe(
        '[docs-only] no: src/a.ts, src/b.ts, src/c.ts, src/d.ts, src/e.ts and 2 more',
      );
    });

    it('only looks at the final tree: code that comes and goes, or a merge, pass', () => {
      expect(checkDocsOnly(hash('empty'), hash('unsneak'), repo).docsOnly).toBe(true);
      expect(checkDocsOnly(hash('empty'), hash('after-merge'), repo).docsOnly).toBe(true);
    });
  });

  describe('checkEachCommitDocsOnly (every commit: the pre-push)', () => {
    it('docs commits, one or several → yes', () => {
      expect(checkEachCommitDocsOnly(hash('base'), hash('docs'), repo)).toEqual({
        docsOnly: true,
        message: '[docs-only] yes: 3 docs file(s) changed',
      });
      // `delete-doc` y `empty` (vacío): el vacío no aporta rutas, pero no tumba el push.
      expect(checkEachCommitDocsOnly(hash('rename'), hash('empty'), repo).docsOnly).toBe(true);
    });

    it('code that a later commit of the same push removes → no, naming it', () => {
      expect(checkEachCommitDocsOnly(hash('empty'), hash('unsneak'), repo)).toEqual({
        docsOnly: false,
        message: '[docs-only] no: src/sneak.ts',
      });
    });

    it('a merge in the push → no, even if it only brings docs', () => {
      expect(checkEachCommitDocsOnly(hash('empty'), hash('after-merge'), repo)).toEqual({
        docsOnly: false,
        message: `[docs-only] no: merge commit ${hash('merged').slice(0, 7)} (use git pull --rebase; treated as code)`,
      });
    });

    it('a head that does not come from the base (rewritten history) → no', () => {
      expect(checkEachCommitDocsOnly(hash('side'), hash('main-docs'), repo)).toEqual({
        docsOnly: false,
        message: `[docs-only] no: ${hash('main-docs')} does not come from ${hash('side')} (history rewritten; treated as code)`,
      });
    });

    it('code anywhere, a rename of code, nothing new, bad or missing refs → no', () => {
      expect(checkEachCommitDocsOnly(hash('base'), hash('mixed'), repo).message).toBe(
        '[docs-only] no: src/a.ts, vercel.json',
      );
      expect(checkEachCommitDocsOnly(hash('mixed'), hash('rename'), repo).message).toBe(
        '[docs-only] no: src/a.ts',
      );
      expect(checkEachCommitDocsOnly(hash('docs'), hash('docs'), repo).message).toBe(
        '[docs-only] no: nothing changed (treated as code)',
      );
      expect(checkEachCommitDocsOnly('0'.repeat(40), hash('docs'), repo).docsOnly).toBe(false);
      expect(checkEachCommitDocsOnly(hash('docs'), '--all', repo).docsOnly).toBe(false);
      expect(checkEachCommitDocsOnly('a'.repeat(40), hash('docs'), repo).message).toBe(
        `[docs-only] no: git could not compare ${'a'.repeat(40)} and ${hash('docs')} (treated as code)`,
      );
    });
  });

  describe('a repo with a tree missing (git fails half way)', () => {
    it('the commits are there but not their files → no, on both checks', () => {
      // Un repo aparte: los demás tests no deben ver este roto.
      const broken = initRepo();
      try {
        const commitDoc = (text: string): string => {
          writeFileSync(join(broken, 'a.md'), text);
          gitIn(broken, 'add', '--all');
          gitIn(broken, 'commit', '--quiet', '--no-verify', '-m', text);
          return gitIn(broken, 'rev-parse', 'HEAD');
        };
        const one = commitDoc('one');
        const two = commitDoc('two');
        const tree = gitIn(broken, 'rev-parse', `${two}^{tree}`);
        const object = join(broken, '.git', 'objects', tree.slice(0, 2), tree.slice(2));
        // Git deja sus objetos de solo lectura (en Windows no se borrarían).
        chmodSync(object, 0o666);
        rmSync(object);
        expect(checkEachCommitDocsOnly(one, two, broken)).toEqual({
          docsOnly: false,
          message: `[docs-only] no: git could not list the changes of ${one}..${two} (treated as code)`,
        });
        expect(checkDocsOnly(one, two, broken).message).toBe(
          `[docs-only] no: git could not compare ${one} and ${two} (treated as code)`,
        );
      } finally {
        removeRepo(broken);
      }
    });
  });

  describe('the command (exit code for the hook, the CI and Vercel; the reason on stderr)', () => {
    function run(...args: string[]): { status: number | null; stdout: string; stderr: string } {
      const result = spawnSync(process.execPath, [CLI, ...args], { cwd: repo, encoding: 'utf8' });
      return { status: result.status, stdout: result.stdout, stderr: result.stderr };
    }

    it('exits with 0 only for docs, and says why on stderr (stdout stays empty)', () => {
      expect(run(hash('base'), hash('docs'))).toEqual({
        status: 0,
        stdout: '',
        stderr: '[docs-only] yes: 3 docs file(s) changed\n',
      });
      expect(run(hash('docs'), hash('code'))).toEqual({
        status: 1,
        stdout: '',
        stderr: '[docs-only] no: src/a.ts\n',
      });
      expect(run('', hash('docs')).status).toBe(1);
    });

    it('--each looks at every commit; without it, at the final tree', () => {
      expect(run(hash('empty'), hash('unsneak')).status).toBe(0);
      expect(run('--each', hash('empty'), hash('unsneak')).status).toBe(1);
      expect(run('--each', hash('base'), hash('docs')).status).toBe(0);
    });
  });
});
