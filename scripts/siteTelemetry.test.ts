// @vitest-environment node
// Lee y escribe archivos en el disco: no necesita DOM.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  ciBrowsers,
  collectTelemetry,
  countDecisions,
  countTests,
  monthOf,
  SITE_TELEMETRY_MODULE,
  siteTelemetry,
} from './siteTelemetry';

const CI = `jobs:
  e2e:
    strategy:
      matrix:
        project: [chromium, firefox, webkit]
`;
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

  it('lee JSX en un .tsx', () => {
    const source = `it('pinta', () => { render(<p>hola</p>); });`;
    expect(countTests(source, 'x.test.tsx')).toBe(1);
  });
});

describe('ciBrowsers', () => {
  it('lee la matriz de los e2e del CI', () => {
    expect(ciBrowsers(CI)).toEqual(['chromium', 'firefox', 'webkit']);
  });

  it('sin matriz, o vacía, falla: una cifra falsa no llega al sitio', () => {
    expect(() => ciBrowsers('jobs: {}')).toThrow(/matriz/);
    expect(() => ciBrowsers('        project: []')).toThrow(/matriz/);
  });
});

describe('countDecisions', () => {
  it('cuenta los encabezados de ADR numerados, no la plantilla ni las menciones', () => {
    expect(countDecisions(DECISIONS)).toBe(2);
  });

  it('sin ADR, falla', () => {
    expect(() => countDecisions('# Decisiones\n')).toThrow(/sin ADR/);
  });
});

describe('monthOf', () => {
  it('da el mes en UTC, con dos cifras', () => {
    expect(monthOf(new Date('2026-11-21T19:00:00Z'))).toBe('2026-11');
    expect(monthOf(new Date('2027-01-01T00:30:00+02:00'))).toBe('2026-12');
  });
});

describe('collectTelemetry', () => {
  let root = '';

  const write = (path: string, text: string): void => {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
  };

  /** Un repo mínimo: dos tests unitarios en `src/` y uno en `scripts/`, uno e2e, la matriz y dos ADR. */
  const makeRepo = (): void => {
    root = mkdtempSync(join(tmpdir(), 'cosmos-telemetry-'));
    write('src/a/a.test.ts', "it('a', () => {}); it('b', () => {});");
    write('scripts/c.test.ts', "it('c', () => {});");
    write('tests/e2e/d.spec.ts', "test('d', async () => {});");
    write('.github/workflows/ci.yml', CI);
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

  it('no cuenta lo que no corre: node_modules, el build, los specs visuales ni los archivos que no son tests', () => {
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
});
