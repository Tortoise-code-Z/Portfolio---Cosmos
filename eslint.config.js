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
const REACT = [
  'react',
  'react/**',
  'react-dom',
  'react-dom/**',
  'react-router',
  'zustand',
  'zustand/**',
];

/** El código puro de la escena (arquitectura.md → «Capas»). */
const PURE_SCENE = 'src/scene/{shapes,math,config,worker}/**';
/**
 * Los módulos de la escena que el código puro no puede importar por ruta relativa (así se colarían Three, React o
 * los stores en el worker sin pasar por los nombres de arriba): los que usan Three, React o un store, y
 * `contextLoss` (vive con el lienzo). `pointer` y `frameLoop` no: son DOM sin dependencias (`math/camera` usa el
 * tipo de `pointer`). **Un módulo nuevo de `scene/` con Three, React o un store se añade aquí** (arquitectura.md →
 * «Capas»).
 */
const IMPURE_SCENE_MODULES = [
  'SceneRoot',
  'CameraRig',
  'Particles',
  'BackgroundStars',
  'sceneMaterials',
  'particleGeometry',
  'useSceneShapes',
  'useHotDegradation',
  'contextLoss',
  'voidColour',
  'pause',
].flatMap((name) => [`**/${name}`, `**/${name}/**`]);
const PURE_SCENE_FORBIDDEN = [
  ...THREE,
  ...REACT,
  ...['ui', 'features', 'routes', 'stores'].flatMap(layer),
  ...IMPURE_SCENE_MODULES,
];
const PURE_SCENE_MESSAGE =
  'scene/{shapes,math,config,worker} es código puro (va en el worker): sin Three, React, Zustand, stores ni los módulos de la escena que los usan.';

/** `Math.random` también escrito como `globalThis.Math.random` (o `window.…`, `self.…`). */
const NO_GLOBAL_MATH_RANDOM = {
  selector:
    "MemberExpression[property.name='random'][object.type='MemberExpression'][object.property.name='Math']",
  message: 'La escena usa el azar con semilla (scene/shapes/prng, ADR-011), no Math.random.',
};

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
  {
    // El código puro de la escena: lo que corre en el worker de las formas (≤ 10 KB) o se prueba sin WebGL.
    // Sin Three, React, Zustand ni stores: un import así reventaría el worker sin que nadie lo notara.
    files: [PURE_SCENE],
    forbidden: PURE_SCENE_FORBIDDEN,
    message: PURE_SCENE_MESSAGE,
  },
  {
    // Y de content, solo los tipos: los datos (los proyectos) llegan por parámetro; importarlos metería todo
    // el contenido en el worker. Los tests sí pueden usar el contenido real (no van en el worker).
    files: [PURE_SCENE],
    ignores: ['**/*.test.ts'],
    forbidden: PURE_SCENE_FORBIDDEN,
    message: PURE_SCENE_MESSAGE,
    extra: [
      {
        group: ['~/content/**', '!~/content/types', '**/content/**', '!**/content/types'],
        message:
          'scene/{shapes,math,config,worker} solo importa de content sus tipos (content/types): los datos, por parámetro.',
      },
    ],
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

  ...LAYER_RULES.map(({ files, ignores, forbidden, message, extra = [] }) => ({
    files,
    ...(ignores === undefined ? {} : { ignores }),
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

  // ADR-011: el mismo universo en cada visita. La escena usa el azar con semilla de `scene/shapes/prng`.
  {
    files: ['src/scene/**'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message:
            'La escena usa el azar con semilla (scene/shapes/prng, ADR-011), no Math.random.',
        },
      ],
      'no-restricted-syntax': ['error', NO_GLOBAL_MATH_RANDOM],
    },
  },

  // El código puro no tiene ningún `import()`: uno diferido se saltaría `no-restricted-imports` (Three,
  // stores…) y metería otro chunk en el worker. La escena (React) sí: el reintento de las formas.
  {
    files: [PURE_SCENE],
    rules: {
      'no-restricted-syntax': [
        'error',
        NO_GLOBAL_MATH_RANDOM,
        {
          selector: 'ImportExpression',
          message:
            'scene/{shapes,math,config,worker} es código puro (va en el worker): sin import() diferidos.',
        },
      ],
    },
  },

  {
    files: ['*.config.{js,ts}', 'tests/**', 'scripts/**'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  prettier,
);
