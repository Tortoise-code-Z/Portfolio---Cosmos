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
 * `contextLoss` (vive con el lienzo). Los demás de `scene/` sí puede importarlos (hoy `pointer`, `frameLoop`,
 * `sceneClock`, `fpsMeter` y `shaders`: DOM o cálculo sin dependencias; `math/camera` y `math/gravity` usan el tipo
 * de `pointer`).
 * **Un módulo nuevo de `scene/` con Three, React o un store se añade aquí** (arquitectura.md → «Capas» y «Carga
 * de la escena»).
 */
const IMPURE_SCENE_MODULES = [
  'SceneRoot',
  'CameraRig',
  'Constellations',
  'ConstellationLabels',
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

const CONTENT_FORBIDDEN = [
  ...REACT,
  ...THREE,
  ...['lib', 'stores', 'ui', 'features', 'scene', 'routes'].flatMap(layer),
];
const CONTENT_MESSAGE =
  'content no importa nada: solo datos y sus tipos (y, en projects/media.ts, las capturas de src/assets/, ADR-023; en telemetry.ts, el módulo virtual:site-telemetry, ADR-035).';

/**
 * Las cifras del repo de Mission control (ADR-035) entran por una sola puerta: `content/telemetry.ts` importa el
 * módulo virtual y los demás leen `siteTelemetry` de allí. Va en cada capa (una regla posterior de
 * `no-restricted-imports` sustituiría a la de la capa, no se sumaría).
 */
const TELEMETRY_DOOR = {
  group: ['virtual:site-telemetry'],
  message:
    'Las cifras del repo se leen de content/telemetry (siteTelemetry): es la única que importa virtual:site-telemetry (ADR-035).',
};

/**
 * El detalle de las fichas (ADR-036) no viaja en el JS de la home: solo `content/projects/index.ts` importa
 * `projects/details/`, y a ese índice (los proyectos enteros), solo la página de proyecto (`routes/project`,
 * `features/project`). La home lee las tarjetas, `content/projects/entries`.
 */
/**
 * El índice de los proyectos, se escriba como se escriba: la carpeta (con o sin barra final), `index` y `index` con su
 * extensión (el proyecto permite importar con `.ts`). `entries` y lo demás de la carpeta quedan fuera.
 */
const PROJECTS_INDEX = String.raw`(?:^|/)content/projects(?:/(?:index(?:\.[cm]?[jt]sx?)?)?)?$`;
/** El detalle de las fichas: `projects/details/` por alias o ruta relativa, y `./details/…` desde `content/projects/`. */
const PROJECT_DETAILS = String.raw`(?:^|/)projects/details(?:/|$)|^\./details(?:/|$)`;

const PROJECT_DETAILS_DOOR = {
  regex: PROJECT_DETAILS,
  caseSensitive: true,
  message:
    'El detalle de las fichas solo lo importa content/projects/index.ts (ADR-036): la home lee content/projects/entries.',
};
const PROJECTS_DOOR = {
  // Con `regex` y no con `group`, que cerraría también lo que cuelga de la carpeta: el índice queda cerrado y
  // `content/projects/entries` (las tarjetas), abierto. Desde dentro de `content` (`./projects`, `.`) queda
  // abierto, para su test: un dato de `content` que lo importara lo para el e2e de `budgets.spec.ts` (el JS de
  // la home sin el detalle).
  regex: PROJECTS_INDEX,
  caseSensitive: true,
  message:
    'Los proyectos enteros (content/projects) solo los importa la página de proyecto: fuera de ella, las tarjetas de content/projects/entries (ADR-036).',
};
/** Las puertas que una regla de capa puede abrir (por defecto, todas cerradas). */
const DOORS = {
  telemetry: TELEMETRY_DOOR,
  projectDetails: PROJECT_DETAILS_DOOR,
  projects: PROJECTS_DOOR,
};

const FEATURES_FORBIDDEN = [...THREE, ...['scene', 'routes'].flatMap(layer)];
const FEATURES_MESSAGE =
  'features no toca Three ni la escena: solo features/scene-mount/SceneMount la carga, en diferido.';
const ROUTES_FORBIDDEN = [...THREE, ...layer('scene')];
const ROUTES_MESSAGE =
  'routes y root.tsx no tocan Three ni la escena: solo features/scene-mount/SceneMount la carga, en diferido.';

const LAYER_RULES = [
  {
    files: ['src/content/**'],
    ignores: ['src/content/telemetry.ts', 'src/content/projects/index.ts'],
    forbidden: CONTENT_FORBIDDEN,
    message: CONTENT_MESSAGE,
  },
  {
    files: ['src/content/telemetry.ts'],
    forbidden: CONTENT_FORBIDDEN,
    message: CONTENT_MESSAGE,
    opens: ['telemetry'],
  },
  {
    files: ['src/content/projects/index.ts'],
    forbidden: CONTENT_FORBIDDEN,
    message: CONTENT_MESSAGE,
    opens: ['projectDetails'],
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
    ignores: ['src/features/project/**'],
    forbidden: FEATURES_FORBIDDEN,
    message: FEATURES_MESSAGE,
  },
  // La página de proyecto: la misma capa, con el índice de los proyectos abierto (ADR-036).
  {
    files: ['src/features/project/**'],
    forbidden: FEATURES_FORBIDDEN,
    message: FEATURES_MESSAGE,
    opens: ['projects'],
  },
  // Las rutas y la raíz pueden importar todas las capas menos la escena: Three entraría en el JS inicial.
  {
    files: ['src/routes/**', 'src/root.tsx'],
    ignores: ['src/routes/project/**'],
    forbidden: ROUTES_FORBIDDEN,
    message: ROUTES_MESSAGE,
  },
  {
    files: ['src/routes/project/**'],
    forbidden: ROUTES_FORBIDDEN,
    message: ROUTES_MESSAGE,
    opens: ['projects'],
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

/** Los `import()` que se pueden comprobar (cadena fija) y, de ellos, la escena: solo desde `SceneMount`. */
const DYNAMIC_IMPORT_RULES = [
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
];
/** La página de proyecto: puede cargar los proyectos enteros (ADR-036). El detalle, solo `content/projects/index.ts`. */
const PROJECT_PAGE_FILES = ['src/features/project/**', 'src/routes/project/**'];
const PROJECTS_INDEX_FILE = 'src/content/projects/index.ts';
/** Las dos puertas de ADR-036 para un `import()` (`no-restricted-imports` no los mira). */
const [PROJECTS_DYNAMIC_DOOR, PROJECT_DETAILS_DYNAMIC_DOOR] = [PROJECTS_INDEX, PROJECT_DETAILS].map(
  (pattern) => ({
    selector: `ImportExpression[source.value=/${pattern.replaceAll('/', '\\/')}/]`,
    message:
      'Los proyectos enteros solo los carga la página de proyecto, y el detalle de las fichas solo content/projects/index.ts, tampoco con import() (ADR-036).',
  }),
);

export default defineConfig(
  globalIgnores([
    'build/',
    '.react-router/',
    'coverage/',
    'playwright-report/',
    'test-results/',
    'docs/',
    'Claude outputs/',
    // El buzón de la cadena de auditorías: fuera de git (.git/info/exclude), con herramientas sueltas de trabajo.
    '_claude',
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

  // `caseSensitive`: por defecto los grupos no distinguen mayúsculas, y `**/Particles/**` cerraría también
  // `shaders/particles/`, que el código puro sí puede importar.
  // Cada regla lleva cerradas las puertas (DOORS) que no abre: una regla posterior de `no-restricted-imports`
  // sustituiría a la de la capa, así que no pueden ir aparte.
  ...LAYER_RULES.map(({ files, ignores, forbidden, message, extra = [], opens = [] }) => ({
    files,
    ...(ignores === undefined ? {} : { ignores }),
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: forbidden, message, caseSensitive: true },
            ...extra,
            ...Object.entries(DOORS)
              .filter(([name]) => !opens.includes(name))
              .map(([, door]) => door),
          ],
        },
      ],
    },
  })),

  // `no-restricted-imports` no mira los `import()`: un import dinámico de la escena o de Three se
  // saltaría las capas. Solo `SceneMount` carga la escena así (arquitectura.md → «Carga de la escena»).
  // Un `import()` cuya ruta no es una cadena fija (plantilla, variable) no se puede comprobar: se prohíbe.
  // Las puertas del detalle de las fichas (ADR-036), también para un `import()`: fuera de la página de proyecto, ni el
  // índice ni `details/` se cargan en diferido; en ella, el índice sí.
  {
    files: ['src/**'],
    ignores: [
      'src/scene/**',
      'src/features/scene-mount/SceneMount/SceneMount.tsx',
      ...PROJECT_PAGE_FILES,
      PROJECTS_INDEX_FILE,
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...DYNAMIC_IMPORT_RULES,
        PROJECTS_DYNAMIC_DOOR,
        PROJECT_DETAILS_DYNAMIC_DOOR,
      ],
    },
  },
  {
    files: PROJECT_PAGE_FILES,
    rules: {
      'no-restricted-syntax': ['error', ...DYNAMIC_IMPORT_RULES, PROJECT_DETAILS_DYNAMIC_DOOR],
    },
  },
  {
    files: [PROJECTS_INDEX_FILE],
    rules: { 'no-restricted-syntax': ['error', ...DYNAMIC_IMPORT_RULES] },
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
    // Los e2e usan el `test` de `tests/e2e/support/test.ts`: en los tres motores, presentados como GPU con poca
    // memoria, arranca la escena en Bajo (calidad.md → «Pirámide de tests»). Con el de Playwright, un spec nuevo
    // dependería del nivel que elija la máquina. El glob es el `testMatch` de `playwright.config.ts`, y se cierran
    // las dos puertas del módulo (`@playwright/test` reexporta `playwright/test`) y el import por defecto, que
    // también es `test`.
    files: ['tests/e2e/**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['@playwright/test', 'playwright/test'].map((name) => ({
            name,
            importNames: ['test', 'default'],
            message:
              "Import `test` from './support/test.ts' (the scene starts in Low in every engine).",
          })),
        },
      ],
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  prettier,
);
