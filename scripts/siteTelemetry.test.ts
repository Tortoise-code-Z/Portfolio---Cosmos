// @vitest-environment node
// Lee y escribe archivos en el disco: no necesita DOM.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ciBrowsers,
  collectTelemetry,
  countDecisions,
  countTests,
  monthOf,
  playwrightProjects,
  SITE_TELEMETRY_MODULE,
  siteTelemetry,
} from './siteTelemetry';

const CI = `jobs:
  e2e:
    strategy:
      matrix:
        project: [chromium, firefox, webkit]
`;
const PLAYWRIGHT = `export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});`;
const PROJECTS = ['chromium', 'firefox', 'webkit'];
const DECISIONS = `# Decisiones

## ADR-NNN · Plantilla

## ADR-001 · Primera

Ver ADR-001 y el
## ADR-002 · Segunda
`;

describe('countTests', () => {
  it('cuenta cada it y test, también con only, concurrent, fails y un each', () => {
    const source = `
      describe('x', () => {
        it('a', () => {});
        test('b', () => {});
        it.only('c', () => {});
        test.concurrent('d', async () => {});
        it.fails('e', () => {});
        it.each([1, 2, 3])('f %i', () => {});
      });
    `;
    expect(countTests(source, 'x.test.ts')).toBe(6);
  });

  it('no cuenta lo que no es un test: describe, skip, use, step, ganchos, comentarios ni textos', () => {
    const source = `
      // it('comentado', () => {});
      test.describe('grupo', () => {
        test.use({ locale: 'es' });
        test.beforeEach(async () => {});
        test('uno', async () => {
          test.skip(true, 'motivo');
          test.slow();
          await test.step('paso', async () => {});
        });
        it.skip('saltado', () => {});
        it.todo('pendiente');
        const text = "it('en un texto', () => {})";
      });
    `;
    expect(countTests(source, 'x.spec.ts')).toBe(1);
  });

  it('lee JSX en un .tsx: un texto dentro de una etiqueta no es una llamada (leído como TS, sí lo sería)', () => {
    const source = `it('pinta', () => { render(<p>it('no')</p>); });`;
    expect(countTests(source, 'x.test.tsx')).toBe(1);
  });

  it('it.each con su tipo cuenta uno, como sin él', () => {
    const source = `it.each<number>([1, 2])('%i', (n) => {}); describe.each([1])('g %i', () => {});`;
    expect(countTests(source, 'x.test.ts')).toBe(1);
  });

  it.each([
    ["it.for([1])('a', () => {})", 'it.for'],
    ["it.skipIf(true)('a', () => {})", 'it.skipIf'],
    ["it.runIf(true)('a', () => {})", 'it.runIf'],
    ["it.sequential('a', () => {})", 'it.sequential'],
    ["test.fail('a', async () => {})", 'test.fail'],
    ["it.only.each([1])('a', () => {})", 'it.only'],
    ["it.concurrent.each([1])('a', () => {})", 'it.concurrent'],
    ["it.each`a\n${1}`('a', () => {})", 'it.each'],
  ])('una forma que no se sabe contar hace fallar: %s', (source, form) => {
    expect(() => countTests(source, 'x.test.ts')).toThrow(`forma de test desconocida («${form}»)`);
  });
});

describe('ciBrowsers', () => {
  it('lee la matriz del job e2e del CI, con los proyectos de playwright.config.ts', () => {
    expect(playwrightProjects(PLAYWRIGHT)).toEqual(PROJECTS);
    expect(ciBrowsers(CI, PROJECTS)).toEqual(['chromium', 'firefox', 'webkit']);
  });

  it('solo mira el job e2e: la matriz de otro job no cuenta', () => {
    const other = `jobs:
  sizes:
    strategy:
      matrix:
        project: [desktop, mobile]
${CI.replace('jobs:\n', '')}`;
    expect(ciBrowsers(other, PROJECTS)).toEqual(['chromium', 'firefox', 'webkit']);
  });

  it('sin matriz, o vacía, falla: una cifra falsa no llega al sitio', () => {
    expect(() => ciBrowsers('jobs: {}', PROJECTS)).toThrow(/matriz/);
    expect(() => ciBrowsers('jobs:\n  e2e:\n        project: []\n', PROJECTS)).toThrow(/matriz/);
  });

  it('un nombre que no es un proyecto de Playwright (o con comillas) falla', () => {
    const quoted = CI.replace('chromium', "'chromium'");
    expect(() => ciBrowsers(quoted, PROJECTS)).toThrow(/«'chromium'» no es un proyecto/);
    expect(() => ciBrowsers(CI, ['chromium', 'firefox'])).toThrow(/«webkit» no es un proyecto/);
  });
});

describe('countDecisions', () => {
  it('cuenta los encabezados de ADR numerados, no la plantilla ni las menciones', () => {
    expect(countDecisions(DECISIONS)).toBe(2);
  });

  it('sin ADR, falla', () => {
    expect(() => countDecisions('# Decisiones\n')).toThrow(/sin ADR/);
  });

  it('un número repetido (una renumeración a medias) falla en vez de contar dos', () => {
    expect(() => countDecisions(`${DECISIONS}\n## ADR-002 · Otra\n`)).toThrow(/ADR-002 repetido/);
  });
});

describe('monthOf', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('da el mes con dos cifras', () => {
    expect(monthOf(new Date('2026-11-21T19:00:00Z'))).toBe('2026-11');
    expect(monthOf(new Date('2026-03-05T12:00:00Z'))).toBe('2026-03');
  });

  it('en UTC, también donde la hora local va por detrás (Honolulú, UTC−10: aún es el mes anterior)', () => {
    vi.stubEnv('TZ', 'Pacific/Honolulu');
    expect(monthOf(new Date('2026-12-01T05:00:00Z'))).toBe('2026-12');
  });
});

describe('collectTelemetry', () => {
  let root = '';

  const write = (path: string, text: string): void => {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
  };

  /** Un repo mínimo: dos tests unitarios en `src/` y uno en `scripts/`, uno e2e, la matriz, Playwright y dos ADR. */
  const makeRepo = (): void => {
    root = mkdtempSync(join(tmpdir(), 'cosmos-telemetry-'));
    write('src/a/a.test.ts', "it('a', () => {}); it('b', () => {});");
    write('scripts/c.test.ts', "it('c', () => {});");
    write('tests/e2e/d.spec.ts', "test('d', async () => {});");
    write('.github/workflows/ci.yml', CI);
    write('playwright.config.ts', PLAYWRIGHT);
    write('DECISIONS.md', DECISIONS);
  };

  afterEach(() => {
    if (root !== '') rmSync(root, { recursive: true, force: true });
    root = '';
  });

  it('cuenta los tests de Vitest y los e2e por separado, con los navegadores, los ADR y el mes', () => {
    makeRepo();
    expect(collectTelemetry(root, new Date('2026-11-21T12:00:00Z'))).toEqual({
      unitTests: 3,
      e2eTests: 1,
      browsers: ['chromium', 'firefox', 'webkit'],
      decisions: 2,
      month: '2026-11',
    });
  });

  it('solo cuenta lo que casa con los globs de Vitest y de Playwright: ni el build, ni los specs visuales ni lo que no es un test', () => {
    makeRepo();
    write('node_modules/x/x.test.ts', "it('x', () => {});");
    write('build/client/y.test.ts', "it('y', () => {});");
    write('tests/visual/z.spec.ts', "test('z', async () => {});");
    write('src/a/a.ts', "it('no es un test', () => {});");
    write('scripts/e.test.tsx', "it('Vitest no lo incluye', () => {});");
    const telemetry = collectTelemetry(root, new Date());
    expect(telemetry.unitTests).toBe(3);
    expect(telemetry.e2eTests).toBe(1);
  });

  it('sin tests e2e, falla', () => {
    makeRepo();
    rmSync(join(root, 'tests'), { recursive: true });
    expect(() => collectTelemetry(root, new Date())).toThrow(/ningún test/);
  });

  it('el repo de verdad: los tres navegadores del CI y cifras que no están vacías', () => {
    const telemetry = collectTelemetry(join(import.meta.dirname, '..'), new Date());
    expect(telemetry.browsers).toEqual(['chromium', 'firefox', 'webkit']);
    expect(telemetry.unitTests).toBeGreaterThan(telemetry.e2eTests);
    expect(telemetry.decisions).toBeGreaterThan(0);
  });
});

describe('siteTelemetry (plugin)', () => {
  /** Llama a un gancho del plugin sin el contexto de Vite (no lo usa). */
  const call = (hook: unknown, id: string): unknown =>
    typeof hook === 'function' ? (hook as (id: string) => unknown)(id) : undefined;

  it('resuelve solo su módulo y lo carga como las cifras del repo en JSON', () => {
    const plugin = siteTelemetry(join(import.meta.dirname, '..'));
    const resolved = call(plugin.resolveId, SITE_TELEMETRY_MODULE);
    expect(resolved).toBe(`\0${SITE_TELEMETRY_MODULE}`);
    expect(call(plugin.resolveId, 'otro')).toBeNull();
    expect(call(plugin.load, 'otro')).toBeNull();
    const code = String(call(plugin.load, String(resolved)));
    const telemetry: unknown = JSON.parse(code.replace(/^export default /, '').replace(/;$/, ''));
    expect(telemetry).toMatchObject({ browsers: ['chromium', 'firefox', 'webkit'] });
  });

  it('cuenta una sola vez: cada entorno del build recibe las mismas cifras', () => {
    const plugin = siteTelemetry(join(import.meta.dirname, '..'));
    const resolved = String(call(plugin.resolveId, SITE_TELEMETRY_MODULE));
    const first = call(plugin.load, resolved);
    vi.useFakeTimers({ now: new Date('2099-01-15T00:00:00Z') });
    const second = call(plugin.load, resolved);
    vi.useRealTimers();
    expect(second).toBe(first);
  });
});
