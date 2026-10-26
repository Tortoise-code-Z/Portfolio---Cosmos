import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Capas de src/ y lo que cada una NO puede importar (docs/05-tecnico/arquitectura.md).
// Cada capa se bloquea por alias (~/capa) y por ruta relativa (**/capa/**).
const layer = (name) => [`~/${name}`, `~/${name}/**`, `**/${name}/**`];
const THREE = ['three', 'three/**', '@react-three/*'];
const REACT = ['react', 'react-dom', 'react-dom/**', 'react-router', 'zustand', 'zustand/**'];

const LAYER_RULES = [
  {
    files: ['src/content/**'],
    forbidden: [
      ...REACT,
      ...THREE,
      ...['lib', 'stores', 'ui', 'features', 'scene', 'routes'].flatMap(layer),
    ],
    message:
      'content no importa nada: solo datos y sus tipos (y, en projects/media.ts, las capturas de src/assets/, ADR-023).',
  },
  {
    files: ['src/lib/**'],
    forbidden: [...THREE, ...['stores', 'ui', 'features', 'scene', 'routes'].flatMap(layer)],
    message: 'lib no importa stores, ui, features, scene ni routes.',
    // ADR-017: de content, lib solo importa content/types y los textos (useT). Los datos (perfil,
    // proyectos, skills) le llegan por parámetro desde routes o react-router.config.ts.
    extra: [
      {
        group: [
          '~/content/**',
          '!~/content/types',
          '!~/content/texts',
          '**/content/**',
          '!**/content/types',
          '!**/content/texts',
        ],
        message:
          'lib solo importa de content sus tipos (content/types) y los textos (content/texts).',
      },
    ],
  },
  {
    files: ['src/stores/**'],
    forbidden: [...THREE, ...['ui', 'features', 'scene', 'routes'].flatMap(layer)],
    message: 'stores solo puede importar lib y content.',
  },
  {
    files: ['src/ui/**'],
    forbidden: [...THREE, ...['content', 'stores', 'features', 'scene', 'routes'].flatMap(layer)],
    message: 'ui solo puede importar lib (los datos llegan por props).',
  },
  {
    files: ['src/features/**'],
    forbidden: [...THREE, ...['scene', 'routes'].flatMap(layer)],
    message:
      'features no toca Three ni la escena: solo features/scene-mount/SceneMount la carga, en diferido.',
  },
  {
    // Las rutas y la raíz pueden importar todas las capas menos la escena: Three entraría en el JS inicial.
    files: ['src/routes/**', 'src/root.tsx'],
    forbidden: [...THREE, ...layer('scene')],
    message:
      'routes y root.tsx no tocan Three ni la escena: solo features/scene-mount/SceneMount la carga, en diferido.',
  },
  {
    files: ['src/scene/**'],
    forbidden: [...['ui', 'features', 'routes'].flatMap(layer)],
    message: 'scene solo puede importar lib, stores y content.',
  },
];

export default defineConfig(
  globalIgnores([
    'build/',
    '.react-router/',
    'coverage/',
    'playwright-report/',
    'test-results/',
    'docs/',
    'Claude outputs/',
  ]),

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['eslint.config.js'] },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser },
    },
  },

  reactHooks.configs.flat.recommended,
  jsxA11y.configs.strict,

  {
    rules: {
      'no-console': ['error', { allow: ['error', 'warn'] }],
      // Safari quita el rol de lista a un <ul> o <ol> sin viñetas y VoiceOver deja de contar sus elementos:
      // las listas lo declaran (docs/02-experiencia/estados-y-accesibilidad.md → «Accesibilidad»).
      'jsx-a11y-x/no-redundant-roles': [
        'error',
        { nav: ['navigation'], ol: ['list'], ul: ['list'] },
      ],
    },
  },

  ...LAYER_RULES.map(({ files, forbidden, message, extra = [] }) => ({
    files,
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: forbidden, message }, ...extra] }],
    },
  })),

  // `no-restricted-imports` no mira los `import()`: un import dinámico de la escena o de Three se
  // saltaría las capas. Solo `SceneMount` carga la escena así (arquitectura.md → «Carga de la escena»).
  // Un `import()` cuya ruta no es una cadena fija (plantilla, variable) no se puede comprobar: se prohíbe.
  {
    files: ['src/**'],
    ignores: ['src/scene/**', 'src/features/scene-mount/SceneMount/SceneMount.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'ImportExpression[source.value=/^(?:three|@react-three\\/)|(?:^~|\\/)scene(?:\\/|$)/]',
          message:
            'La escena (y Three.js) solo se carga en diferido desde features/scene-mount/SceneMount.',
        },
        {
          selector: "ImportExpression[source.type!='Literal']",
          message:
            'import() solo con una cadena fija: si no, las capas no pueden comprobar qué se carga (la escena y Three.js, solo desde features/scene-mount/SceneMount).',
        },
      ],
    },
  },

  {
    files: ['*.config.{js,ts}', 'tests/**'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  prettier,
);
