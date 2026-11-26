import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { expect } from '@playwright/test';

import { test } from './support/test.ts';

import { PROJECT_IMAGE_WIDTHS } from '../../src/content/imageWidths.ts';
import { astrohub } from '../../src/content/projects/details/astrohub.ts';
import { chessmate } from '../../src/content/projects/details/chessmate.ts';
import { cosmos } from '../../src/content/projects/details/cosmos.ts';
import { projectEntries } from '../../src/content/projects/entries.ts';
import {
  STILL_CHAPTERS,
  STILL_FRAMES,
} from '../../src/features/scene-mount/stillFrames/stillFrames.ts';
import { stripGlslComments } from '../../src/scene/shaders/stripGlslComments/stripGlslComments.ts';
import { stillsFingerprint } from '../stills/fingerprint.ts';

/**
 * Presupuestos que se pueden medir sobre el build antes de Lighthouse CI (F6).
 * Cifras en docs/05-tecnico/calidad.md («Presupuestos»).
 */

const CLIENT_DIR = fileURLToPath(new URL('../../build/client/', import.meta.url));
const ASSETS_DIR = join(CLIENT_DIR, 'assets');
/** Fuentes (todas, woff2 subconjunto latino) ≤ 150 KB. */
const FONT_BUDGET_BYTES = 150_000;
/** Caras de `src/styles/fonts.css`: Anybody, Geologica y Plex Mono 400 y 500. */
const EXPECTED_FONT_FILES = 4;
/**
 * JS inicial (sin escena), gzip, en dos partes (ADR-020). Es una alarma propia, no un requisito externo:
 * lo que manda son los Core Web Vitals y Lighthouse del brief (F6).
 * - Framework: React 19 + React Router 8 y demás dependencias del JS inicial, en un solo chunk por el
 *   grupo `framework` de `vite.config.ts`. Se llama `entry.client-*` porque la entrada por defecto de
 *   React Router vive en node_modules y el grupo la absorbe; con una entrada propia en src/ saldría como
 *   `framework-*`: se aceptan los dos nombres. Medido en F2.4: 107,3 KB. Salta si una subida de versión
 *   lo engorda.
 * - Código propio de cada página: todo lo demás que pide su HTML. Medido en F2.4: home 17,4 KB, proyecto
 *   12,6 KB, 404 7,0 KB; el margen cubre lo que falta de F2 (navegación, misión rápida, galería). En C.2
 *   (Mission log), la home pasó de 35 KB: 35,5 KB; se sube a 38 KB por las secciones de la fase C (calidad.md). En
 *   C.4 (Mission control, sus textos en los dos idiomas) llega a 38,4 KB: se sube a 40 KB, con margen para C.6. En
 *   C.5, con el detalle de las fichas fuera de la home (ADR-036), baja a 34,7 KB; la ficha, 33,8 KB al sacar el
 *   detalle y 35,4 KB con la de Cosmos completa. En C.6a, con el Crew file, la home llega a 35,5 KB.
 */
const FRAMEWORK_JS_BUDGET_BYTES = 112_000;
const PAGE_OWN_JS_BUDGET_BYTES = 40_000;
const FRAMEWORK_CHUNK = /\/assets\/(?:entry\.client|framework)-[^/]+\.js$/;
/**
 * Cada variante de imagen que ofrecen las páginas (AVIF, WebP y el JPEG para compartir), sin comprimir más:
 * ≤ 200 KB. Medido en F2.8: la mayor, 148 KB (WebP de 1920 px de las noticias de AstroHub).
 */
const IMAGE_BUDGET_BYTES = 200_000;
const IMAGE_FILE = /\/assets\/[^"' ,]+\.(?:avif|webp|jpe?g|png)/g;
/** Las fotos fijas del modo sin WebGL (ADR-029), tal cual las deja `npm run stills`: el build las copia sin tocar. */
const STILLS_DIR = fileURLToPath(new URL('../../src/assets/scene-stills/', import.meta.url));
/**
 * Las imágenes del retrato (forma 5) en el build: las pide el worker con `?url`, ninguna página. Mismo límite que
 * las demás; medido en C.6b, sin metadatos: 63 KB la foto y 89 KB el paquete de profundidad.
 */
const PORTRAIT_ASSET = /^portrait-(?:color|depth)-[\w-]+\.(?:jpg|png)$/;
/**
 * JS de la escena (Three.js, React Three Fiber, lo que arrastran y `SceneRoot`), gzip: se pide en diferido
 * y ningún HTML lo nombra (ADR-020). Medido en F3.1, con el lienzo vacío: 241,6 KB, casi todo Three.js
 * entero (React Three Fiber lo importa completo). En F4.2, 249 066 B; ADR-032 lo sube a 260 KB para las
 * constelaciones, los pins y el Sol (F4.3–F4.5), y ADR-041 a 268 KB para las naves de C.7 (el satélite, 262 992 B, más
 * la nave nodriza y un margen).
 */
const SCENE_JS_BUDGET_BYTES = 268_000;
/**
 * Lo que la escena carga aparte, fuera de sus 268 KB, cada cosa con su límite gzip: el worker de
 * las formas y los generadores del reintento en el hilo principal (el mismo código: el mismo límite). Medido
 * en F3.2: worker 4,4 KB, reintento 3,8 KB. Cualquier otro `import()` o `new URL(…)` que salga de la escena
 * hace fallar el test hasta que se clasifique aquí.
 */
const SCENE_SATELLITES = [
  { name: 'shapes worker', pattern: /\/assets\/shapes\.worker-[^/]+\.js$/, budget: 10_000 },
  { name: 'main-thread retry', pattern: /\/assets\/generateShapes-[^/]+\.js$/, budget: 10_000 },
] as const;
/** Los shaders de la escena: llegan sin comentarios (el plugin de vite.config.ts). */
const SHADERS_DIR = fileURLToPath(new URL('../../src/scene/shaders/', import.meta.url));
const SHADER_FILES = readdirSync(SHADERS_DIR, { recursive: true, encoding: 'utf8' }).filter(
  (file) => file.endsWith('.glsl'),
);

/** Las líneas de código de un shader, tal como llegan al build (sin comentarios) y sin la sangría. */
function shaderCodeLines(source: string): string[] {
  return stripGlslComments(source)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\w/.test(line));
}

/**
 * La línea más larga de un shader que ningún otro tiene: la que prueba que ese archivo, y no otro con su misma
 * primera línea (`uniform float uOpacity;`), está en el chunk.
 */
function ownCodeLine(shader: string): string | undefined {
  const others = SHADER_FILES.filter((file) => file !== shader).map((file) =>
    stripGlslComments(readFileSync(join(SHADERS_DIR, file), 'utf8')),
  );
  return shaderCodeLines(readFileSync(join(SHADERS_DIR, shader), 'utf8'))
    .filter((line) => others.every((other) => !other.includes(line)))
    .sort((a, b) => b.length - a.length)[0];
}
/** La URL de un worker (o de cualquier recurso) que Vite resuelve con `new URL(…, import.meta.url)`. */
const ASSET_URL = /new URL\(\s*[`"'](\/assets\/[^`"']+\.js)[`"']/g;
/** El import dinámico de `SceneMount` que trae la escena (en el chunk de `root`). */
const SCENE_ROOT_IMPORT = /import\(`\.\/(SceneRoot-[^`]+\.js)`\)/;
const STATIC_IMPORT = /(?:from|import)\s*"\.\/([^"]+\.js)"/g;
/** Un import dinámico en el JS del build (Vite lo escribe con comillas invertidas o dobles). */
const DYNAMIC_IMPORT = /import\([`"]\.\/([^`"]+\.js)[`"]\)/g;
const SCENE_ROOT_CHUNK = /\/assets\/SceneRoot-[^/]+\.js$/;
/** El grupo `scene` de vite.config.ts: las dependencias que no pide ninguna entrada (ADR-020). */
const SCENE_GROUP_CHUNK = /\/assets\/scene-[^/]+\.js$/;
/** Hoja única (ADR-019), gzip: por encima, revisar si conviene volver a partirla. */
const CSS_BUDGET_BYTES = 50_000;

/** Todos los HTML del build, relativos a build/client: una página nueva entra sola en el presupuesto. */
function htmlPages(dir = CLIENT_DIR): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlPages(path);
    return entry.name.endsWith('.html') ? [relative(CLIENT_DIR, path).replaceAll('\\', '/')] : [];
  });
}

const PAGES = htmlPages();

/** Los JS que pide el HTML de una página (scripts y modulepreload), como `/assets/x.js`. */
function pageScripts(htmlFile: string): Set<string> {
  const html = readFileSync(join(CLIENT_DIR, htmlFile), 'utf8');
  return new Set(Array.from(html.matchAll(/\/assets\/[^"']+\.js/g), (match) => match[0]));
}

/** JS que pide el HTML pre-renderizado (scripts y modulepreload), comprimido con gzip estándar. */
function initialJs(htmlFile: string): {
  framework: string[];
  frameworkBytes: number;
  ownBytes: number;
} {
  const scripts = pageScripts(htmlFile);
  const result = { framework: [] as string[], frameworkBytes: 0, ownBytes: 0 };
  for (const script of scripts) {
    const bytes = gzipSync(readFileSync(join(CLIENT_DIR, script))).length;
    if (FRAMEWORK_CHUNK.test(script)) {
      result.framework.push(script);
      result.frameworkBytes += bytes;
    } else {
      result.ownBytes += bytes;
    }
  }
  return result;
}

/**
 * Los chunks que solo trae el import dinámico de la escena: `SceneRoot-*` y lo que importa, menos lo que
 * ya pide el HTML (el framework). Se sigue desde el JS inicial de la home, no desde lo que haya en assets/.
 */
function sceneChunks(): string[] {
  const initial = pageScripts('index.html');
  const sceneRoot = [...initial]
    .map((script) => SCENE_ROOT_IMPORT.exec(readFileSync(join(CLIENT_DIR, script), 'utf8'))?.[1])
    .find((name) => name !== undefined);
  if (sceneRoot === undefined) return [];
  const chunks = new Set<string>();
  const pending = [`/assets/${sceneRoot}`];
  for (let chunk = pending.pop(); chunk !== undefined; chunk = pending.pop()) {
    if (chunks.has(chunk) || initial.has(chunk)) continue;
    chunks.add(chunk);
    const code = readFileSync(join(CLIENT_DIR, chunk), 'utf8');
    for (const [, name] of code.matchAll(STATIC_IMPORT)) pending.push(`/assets/${name ?? ''}`);
  }
  return [...chunks];
}

/** Lo que importa un chunk: estático y dinámico, como `/assets/x.js`. */
function chunkImports(chunk: string): { static: string[]; dynamic: string[] } {
  const code = readFileSync(join(CLIENT_DIR, chunk), 'utf8');
  const names = (pattern: RegExp): string[] =>
    Array.from(code.matchAll(pattern), ([, name]) => `/assets/${name ?? ''}`);
  return { static: names(STATIC_IMPORT), dynamic: names(DYNAMIC_IMPORT) };
}

/** Todos los chunks que puede llegar a cargar alguna página (desde su HTML, por imports de los dos tipos). */
function reachableChunks(): Set<string> {
  const chunks = new Set<string>();
  const pending = PAGES.flatMap((page) => [...pageScripts(page)]);
  for (let chunk = pending.pop(); chunk !== undefined; chunk = pending.pop()) {
    if (chunks.has(chunk)) continue;
    chunks.add(chunk);
    const imports = chunkImports(chunk);
    pending.push(...imports.static, ...imports.dynamic);
  }
  return chunks;
}

/** Lo que un chunk de la escena carga aparte: `import()` y `new URL(…)`, y si alguno no se pudo leer. */
function sceneOutgoing(chunk: string): { targets: string[]; unreadable: string[] } {
  const code = readFileSync(join(CLIENT_DIR, chunk), 'utf8');
  const dynamic = chunkImports(chunk).dynamic;
  const urls = Array.from(code.matchAll(ASSET_URL), ([, url]) => url ?? '');
  const unreadable: string[] = [];
  // Un `import()` o un `import.meta.url` que los patrones no leen (una ruta calculada) no se puede pesar.
  if (code.split('import(').length - 1 !== dynamic.length) unreadable.push(`${chunk}: import()`);
  if (code.split('import.meta.url').length - 1 !== urls.length)
    unreadable.push(`${chunk}: new URL()`);
  return { targets: [...dynamic, ...urls], unreadable };
}

/** Un chunk y lo que importa de forma estática, sin lo ya cargado (`loaded`), comprimido con gzip. */
function gzipWithStaticImports(entry: string, loaded: ReadonlySet<string>): number {
  const seen = new Set<string>();
  const pending = [entry];
  let bytes = 0;
  for (let chunk = pending.pop(); chunk !== undefined; chunk = pending.pop()) {
    if (seen.has(chunk) || loaded.has(chunk)) continue;
    seen.add(chunk);
    bytes += gzipSync(readFileSync(join(CLIENT_DIR, chunk))).length;
    pending.push(...chunkImports(chunk).static);
  }
  return bytes;
}

test.describe('build budgets', () => {
  test('self-hosted fonts stay within the font budget', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    const fonts = readdirSync(ASSETS_DIR).filter((name) => name.endsWith('.woff2'));
    const totalBytes = fonts.reduce((sum, name) => sum + statSync(join(ASSETS_DIR, name)).size, 0);
    expect(fonts).toHaveLength(EXPECTED_FONT_FILES);
    expect(totalBytes).toBeLessThanOrEqual(FONT_BUDGET_BYTES);
  });

  test('the single stylesheet stays within the CSS budget', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    // La hoja que piden las páginas (no lo que haya en assets/, que puede guardar restos de otro build).
    const sheets = new Set(
      PAGES.flatMap((page) =>
        Array.from(
          readFileSync(join(CLIENT_DIR, page), 'utf8').matchAll(/\/assets\/[^"']+\.css/g),
          (match) => match[0],
        ),
      ),
    );
    expect(sheets.size).toBe(1);
    for (const sheet of sheets) {
      expect(gzipSync(readFileSync(join(CLIENT_DIR, sheet))).length).toBeLessThanOrEqual(
        CSS_BUDGET_BYTES,
      );
    }
  });

  test('every image variant the pages offer stays within the image budget', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    // Las que piden las páginas (srcset, src y og:image), no lo que haya en assets/ de otro build.
    const images = new Set(
      PAGES.flatMap((page) =>
        Array.from(
          readFileSync(join(CLIENT_DIR, page), 'utf8').matchAll(IMAGE_FILE),
          (match) => match[0],
        ),
      ),
    );
    // Chessmate y AstroHub: 21 capturas × 2 formatos × 3 anchos + sus 2 JPEG para compartir, y los 2 del sitio
    // (`og-en`, `og-es`: la home y Cosmos) (130).
    expect(images.size).toBe(21 * 2 * PROJECT_IMAGE_WIDTHS.length + 2 + 2);
    const over = [...images]
      .map((image) => ({ image, bytes: statSync(join(CLIENT_DIR, image)).size }))
      .filter(({ bytes }) => bytes > IMAGE_BUDGET_BYTES);
    expect(over).toEqual([]);
  });

  test('the scene stills of the no-WebGL mode stay within the image budget, and no page asks for them', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    const stills = ['avif', 'webp'].flatMap((format) =>
      readdirSync(join(STILLS_DIR, format)).map((name) => join(format, name)),
    );
    // Cada capítulo con foto, en los dos encuadres y los dos formatos. Ningún HTML las nombra (las pinta el
    // cliente sin WebGL): si alguna saliera en una página, la cuenta exacta de imágenes de arriba fallaría.
    expect(stills).toHaveLength(STILL_CHAPTERS.length * Object.keys(STILL_FRAMES).length * 2);
    const over = stills
      .map((still) => ({ still, bytes: statSync(join(STILLS_DIR, still)).size }))
      .filter(({ bytes }) => bytes > IMAGE_BUDGET_BYTES);
    expect(over).toEqual([]);
  });

  test('the portrait images (the worker downloads them from the turtle on) stay within the image budget', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    const portrait = readdirSync(ASSETS_DIR).filter((name) => PORTRAIT_ASSET.test(name));
    // La foto y el paquete de profundidad: si cambian de nombre o de formato, este test tiene que enterarse.
    expect(portrait).toHaveLength(2);
    const over = portrait
      .map((image) => ({ image, bytes: statSync(join(ASSETS_DIR, image)).size }))
      .filter(({ bytes }) => bytes > IMAGE_BUDGET_BYTES);
    expect(over).toEqual([]);
  });

  test('the scene stills reach the build as files, not inlined in the JS', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    // Vite mete en base64 los archivos de menos de 4 KB (`assetsInlineLimit`): una foto que bajara de ahí iría dentro
    // del JS del viaje y la descargaría todo el mundo, con escena o sin ella.
    const scripts = readdirSync(ASSETS_DIR)
      .filter((name) => name.endsWith('.js'))
      .map((name) => readFileSync(join(ASSETS_DIR, name), 'utf8'));
    const named = new Set(
      scripts.flatMap((code) =>
        Array.from(code.matchAll(/\/assets\/scene-still-[\w-]+\.(?:avif|webp)/g), ([url]) => url),
      ),
    );
    expect(named.size).toBe(STILL_CHAPTERS.length * Object.keys(STILL_FRAMES).length * 2);
    for (const url of named) expect(statSync(join(CLIENT_DIR, url)).isFile()).toBe(true);
    expect(scripts.some((code) => /data:image\/(?:avif|webp)/.test(code))).toBe(false);
  });

  test('the scene stills show the current scene (npm run stills after changing shapes, shaders or camera)', () => {
    test.skip(
      test.info().project.name !== 'chromium',
      'Reads the sources from disk: once is enough',
    );
    const manifest: unknown = JSON.parse(readFileSync(join(STILLS_DIR, 'stills.json'), 'utf8'));
    const { fingerprint } = manifest as { fingerprint?: unknown };
    expect(
      fingerprint,
      'The scene changed since the stills were taken: run `npm run stills` (Docker) and commit them',
    ).toBe(stillsFingerprint(fileURLToPath(new URL('../..', import.meta.url))));
  });

  test('the scene JS is deferred: no page asks for it, and it stays within its budget', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    const chunks = sceneChunks();
    // SceneRoot y el chunk `scene` del grupo de vite.config.ts (Three.js, React Three Fiber…).
    expect(chunks).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/\/SceneRoot-[^/]+\.js$/),
        expect.stringMatching(/\/scene-[^/]+\.js$/),
      ]),
    );
    for (const page of PAGES) {
      expect(chunks.filter((chunk) => pageScripts(page).has(chunk))).toEqual([]);
    }
    const bytes = chunks.reduce(
      (sum, chunk) => sum + gzipSync(readFileSync(join(CLIENT_DIR, chunk))).length,
      0,
    );
    expect(bytes).toBeLessThanOrEqual(SCENE_JS_BUDGET_BYTES);
  });

  test('the shaders reach the scene without their comments', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    const code = sceneChunks()
      .map((chunk) => readFileSync(join(CLIENT_DIR, chunk), 'utf8'))
      .join('\n');
    expect(SHADER_FILES.length).toBeGreaterThan(0);
    for (const shader of SHADER_FILES) {
      const source = readFileSync(join(SHADERS_DIR, shader), 'utf8');
      // El código del shader sí llega (si no, el test buscaría en el sitio equivocado): una línea que solo tiene él…
      const ownLine = ownCodeLine(shader);
      expect(ownLine, shader).toBeDefined();
      expect(code, shader).toContain(ownLine);
      // …y ningún trozo de texto de sus comentarios, de línea o de bloque (el plugin
      // `cosmos:glsl-without-comments`). Solo letras ASCII: si el minificador escapara las tildes, un trozo con
      // «í» no casaría nunca y el test no vigilaría nada.
      const prose = Array.from(
        source.matchAll(/\/\/(.*)$|\/\*([\s\S]*?)\*\//gm),
        ([, line, block]) => /[A-Za-z ]{12,}/.exec(line ?? block ?? '')?.[0].trim(),
      ).filter((text): text is string => text !== undefined && text.length >= 12);
      expect(prose.length, shader).toBeGreaterThan(0);
      expect(
        prose.filter((text) => code.includes(text)),
        shader,
      ).toEqual([]);
    }
  });

  test('what the scene loads apart is known (the shapes worker, the retry) and within its budget', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    const scene = sceneChunks();
    const loaded = new Set([...pageScripts('index.html'), ...scene]);
    const outgoing = scene.map(sceneOutgoing);
    expect(outgoing.flatMap(({ unreadable }) => unreadable)).toEqual([]);
    const targets = [...new Set(outgoing.flatMap(({ targets }) => targets))];
    const unknown = targets.filter((target) =>
      SCENE_SATELLITES.every(({ pattern }) => !pattern.test(target)),
    );
    expect(unknown, 'Each import() or new URL() out of the scene needs its budget here').toEqual(
      [],
    );
    for (const { name, pattern, budget } of SCENE_SATELLITES) {
      const found = targets.filter((target) => pattern.test(target));
      expect(found, name).toHaveLength(1);
      expect(gzipWithStaticImports(found[0] ?? '', loaded), name).toBeLessThanOrEqual(budget);
    }
  });

  test('only SceneRoot pulls in the scene group: no other deferred import lands in it', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    // El grupo `scene` recoge toda dependencia diferida (ADR-020): si otra feature cargara así una
    // librería, esa librería y Three.js irían en el mismo chunk, y la feature lo descargaría sin WebGL2.
    const chunks = [...reachableChunks()];
    const sceneRoot = chunks.filter((chunk) => SCENE_ROOT_CHUNK.test(chunk));
    expect(sceneRoot).toHaveLength(1);
    expect(chunkImports(sceneRoot[0] ?? '').static).toContainEqual(
      expect.stringMatching(SCENE_GROUP_CHUNK),
    );
    const others = chunks.filter((chunk) => !SCENE_ROOT_CHUNK.test(chunk));
    const offenders = others.filter((chunk) => {
      const imports = chunkImports(chunk);
      return [...imports.static, ...imports.dynamic].some((name) => SCENE_GROUP_CHUNK.test(name));
    });
    expect(offenders).toEqual([]);
  });

  test('the budgets see every page type (home, project and 404, in both languages)', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    expect(PAGES).toEqual(
      expect.arrayContaining([
        'index.html',
        'es/index.html',
        'projects/chessmate/index.html',
        'es/projects/chessmate/index.html',
        '404.html',
        'es/404/index.html',
      ]),
    );
  });

  for (const page of PAGES) {
    test(`${page}: framework and own initial JS stay within budget`, () => {
      test.skip(
        test.info().project.name !== 'chromium',
        'Reads the build from disk: once is enough',
      );
      const { framework, frameworkBytes, ownBytes } = initialJs(page);
      expect(framework).toHaveLength(1);
      expect(frameworkBytes).toBeLessThanOrEqual(FRAMEWORK_JS_BUDGET_BYTES);
      expect(ownBytes).toBeGreaterThan(0);
      expect(ownBytes).toBeLessThanOrEqual(PAGE_OWN_JS_BUDGET_BYTES);
    });
  }

  test('the detail of the project pages only travels in their JS, not in the home or the 404 (ADR-036)', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    // Los párrafos de «About» de cada ficha, en los dos idiomas: lo más largo del detalle. Una sola ruta pinta
    // todas las fichas, así que cada página de proyecto trae el detalle de las tres. La lista es a mano (los e2e no
    // pueden importar `content/projects/index.ts`, que junta las imágenes): que tenga todos los proyectos.
    const details = { chessmate, astrohub, cosmos };
    expect(Object.keys(details).sort()).toEqual(projectEntries.map(({ slug }) => slug).sort());
    const paragraphs = Object.values(details).flatMap(({ about }) => [...about.en, ...about.es]);
    const initialCode = (page: string): string =>
      [...pageScripts(page)]
        .map((script) => readFileSync(join(CLIENT_DIR, script), 'utf8'))
        .join('\n');
    for (const page of PAGES) {
      const code = initialCode(page);
      // Que las páginas de proyecto lo traigan demuestra que el texto se busca tal cual llega al build.
      const projectPage = /^(?:es\/)?projects\/[^/]+\/index\.html$/.test(page);
      for (const paragraph of paragraphs) {
        expect(code.includes(paragraph), `${page}: ${paragraph}`).toBe(projectPage);
      }
    }
  });
});
