// @vitest-environment node
// Las puertas de ESLint del detalle de las fichas (ADR-036; eslint.config.js → PROJECTS_DOOR, PROJECT_DETAILS_DOOR y
// su versión para `import()`): qué cierran y qué dejan abierto, con la configuración real. Solo las dos reglas de
// importación que esa configuración da a cada archivo: el resto necesita tipos y no dice nada de las puertas.

import { ESLint, Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

const DOOR_RULES = ['no-restricted-imports', 'no-restricted-syntax'] as const;

/** La configuración real (`eslint.config.js`): de ella sale qué reglas de importación tiene cada archivo. */
const eslint = new ESLint();
const linter = new Linter();

/** Las dos reglas de importación que aplica la configuración real a `filePath`. */
async function doorRules(filePath: string): Promise<Linter.RulesRecord> {
  const config = (await eslint.calculateConfigForFile(filePath)) as Linter.Config;
  return Object.fromEntries(
    DOOR_RULES.flatMap((rule) => {
      const setting = config.rules?.[rule];
      return setting === undefined ? [] : [[rule, setting]];
    }),
  );
}

/** Los mensajes de las puertas de ADR-036 al importar `source` desde `filePath` (estático y con `import()`). */
async function doorErrors(
  filePath: string,
  source: string,
): Promise<{ static: number; dynamic: number }> {
  const rules = await doorRules(filePath);
  const count = (code: string): number =>
    linter
      .verify(
        code,
        [{ files: ['**/*.{ts,tsx}'], languageOptions: { parser: tseslint.parser }, rules }],
        {
          filename: filePath,
        },
      )
      .filter(({ message }) => message.includes('ADR-036')).length;
  return {
    static: count(`import { x } from '${source}';\nexport const y = x;\n`),
    dynamic: count(`export const y = import('${source}');\n`),
  };
}

const CLOSED = { static: 1, dynamic: 1 };
const OPEN = { static: 0, dynamic: 0 };

describe('ADR-036 doors in eslint.config.js', () => {
  it.each([
    '~/content/projects',
    '~/content/projects/',
    '~/content/projects/index',
    '~/content/projects/index.ts',
    '../../content/projects',
    '../../content/projects/index.js',
    '~/content/projects/details/cosmos',
    '../../content/projects/details/cosmos.ts',
  ])('the home (features/journey) cannot import %s, not even with import()', async (source) => {
    expect(await doorErrors('src/features/journey/Projects/Projects.tsx', source)).toEqual(CLOSED);
  });

  it.each(['src/routes/journey/journey.tsx', 'src/root.tsx', 'src/lib/seo/meta/meta.ts'])(
    '%s cannot import the whole projects either',
    async (filePath) => {
      expect(await doorErrors(filePath, '~/content/projects')).toEqual(CLOSED);
    },
  );

  it('the home can import the cards (content/projects/entries)', async () => {
    expect(
      await doorErrors('src/features/journey/Projects/Projects.tsx', '~/content/projects/entries'),
    ).toEqual(OPEN);
  });

  it.each(['src/features/project/ProjectPage/ProjectPage.tsx', 'src/routes/project/project.tsx'])(
    'the project page (%s) can import the whole projects, but not the details directly',
    async (filePath) => {
      expect(await doorErrors(filePath, '~/content/projects')).toEqual(OPEN);
      expect(await doorErrors(filePath, '~/content/projects/details/cosmos')).toEqual(CLOSED);
    },
  );

  it('only content/projects/index.ts imports the details', async () => {
    expect(await doorErrors('src/content/projects/index.ts', './details/cosmos')).toEqual(OPEN);
    expect(await doorErrors('src/content/projects/entries.ts', './details/cosmos')).toEqual(CLOSED);
  });
});
