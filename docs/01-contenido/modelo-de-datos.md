# Modelo de datos del contenido

> Forma tipada de todo el contenido. Es especificación: el código final puede ajustar nombres,
> pero no la idea (contenido separado de la escena, bilingüe y validado por tests).

## Dónde vive en el código (F2 · paso 2)

```
src/content/
  types.ts            ← los tipos de este documento
  profile.ts          ← perfil.md
  skills.ts           ← habilidades.md
  experience.ts       ← experiencia.md (el Mission log y la misión rápida)
  chapters.ts         ← orden y anclas de los capítulos, interludios, paradas del raíl y tramos del viaje
  workflow.ts         ← la secuencia de lanzamiento de Mission control (y la misión rápida) y el nombre de cada navegador
  telemetry.ts        ← `siteTelemetry`: las cifras del repo, contadas al construir (`virtual:site-telemetry`, ADR-035)
  projects/
    chessmate.ts      ← proyectos/chessmate.md: la tarjeta (`ProjectEntry`: lo que pinta la home)
    astrohub.ts
    cosmos.ts
    details/
      chessmate.ts    ← proyectos/chessmate.md: el detalle (`ProjectDetail`: lo que solo pinta su página, ADR-036)
      astrohub.ts
      cosmos.ts
    entries.ts        ← `projectEntries`: las tarjetas, en orden de lectura (home, rutas, sitemap, escena)
    media.ts          ← `projectMedia`: portada y galería de cada proyecto, por slug (imports de imagen)
    index.ts          ← `projects`: tarjeta + detalle + imágenes, lo que pinta la ficha (solo la página de
                         proyecto lo importa; es el único que importa `details/`)
    labels.ts         ← etiquetas que comparten varias fichas (RESPONSIVE_DESIGN, DEMO_USER_LABEL)
  texts/
    en.ts             ← textos-sitio.md (EN); sus claves definen `UiKey`
    es.ts             ← textos-sitio.md (ES), tipado como `UiTexts`
    index.ts          ← `uiTexts`: los dos idiomas
  imageWidths.ts      ← anchos de las capturas (variantes y JPEG para compartir): presets, Vitest y tests
  validate/
    validate.ts       ← comprobaciones puras de las reglas de abajo (solo las usan los tests)
    validate.test.ts  ← cada comprobación, con casos rotos a propósito
  content.test.ts     ← las reglas sobre el contenido real
```

- La carpeta de textos se llama `texts/` y no `ui/`: `content/ui` chocaría con la capa `ui` en las reglas de
  importación de ESLint (patrón `**/ui/**`).
- Los textos de interfaz usan **claves planas** (`'project.stack.core'`), las mismas de `textos-sitio.md`: con
  objetos anidados no cabrían `project.stack` y `project.stack.core` a la vez. `es` se declara como `UiTexts`,
  así que una clave que falte o sobre no compila.

- **Imágenes aparte de los textos (F2.8, ADR-023).** Los imports de imagen (`?project`, `?share`) solo los
  entiende Vite con `vite-imagetools`. La config de React Router (`prerender`, sitemap) y los e2e cargan el
  contenido sin Vite: importan `projectEntries`, que no toca `media.ts`. Vitest los sustituye por la misma forma
  con las medidas reales del PNG (`vitest.config.ts`). Las capturas viven en `src/assets/projects/<slug>/`.

El contenido es **código TypeScript tipado** (no JSON ni CMS): no viene de fuera, así que el compilador y los
tests bastan para validarlo. Si en el futuro llega contenido externo (por ejemplo, la API de la NASA), ese dato
sí se valida en el borde con un esquema en tiempo de ejecución.

## Tipos

```ts
export type Locale = 'en' | 'es';
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALES: readonly Locale[] = ['en', 'es'];

/** Texto en los dos idiomas. Obligatorio en ambos. */
export type Localized<T = string> = Readonly<Record<Locale, T>>;

/** Nombres propios que no se traducen (string) o etiquetas que sí (Localized). */
export type Label = string | Localized;

/** Claves de los textos de interfaz, sacadas de texts/en.ts. */
export type UiKey = keyof typeof en;
/** Texto EN literal de una clave: de él salen los huecos `{x}` que exige `translate` (lib/i18n). */
export type UiTemplate<K extends UiKey> = (typeof en)[K];
export type UiTexts = Readonly<Record<UiKey, string>>;

export interface ImageFile {                   // un archivo con sus medidas (reservan el hueco: sin CLS)
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

export interface ResponsiveImage extends ImageFile {
  // Import con `?project` (vite-imagetools, vite.config.ts): AVIF y WebP a 640, 1280 y 1920 px.
  // `src` y las medidas = la WebP mayor (respaldo del <img>); `sources` = el srcset de cada formato.
  readonly sources: { readonly avif: string; readonly webp: string };
}

export interface ImageAsset extends ResponsiveImage {
  readonly alt: Localized;
}

export interface CoverAsset extends ImageAsset {
  readonly share: ImageFile;                   // import con `?share`: JPEG de 1200 px para `og:image`
}

export type WorkMode = 'remote' | 'hybrid' | 'onsite';

export interface Profile {
  readonly name: string;                     // 'Víctor Pérez'
  readonly fullName: string;                 // 'Víctor David Pérez Alarcón'
  readonly alias: string;                    // 'Tortoise_code'
  readonly role: Localized;
  readonly headline: Localized;              // línea corta para SEO y tarjetas
  readonly bio: Localized<readonly string[]>;
  readonly location: { readonly city: string; readonly country: Localized };
  readonly availability: {
    readonly openToWork: boolean;
    readonly modes: readonly WorkMode[];
    readonly openToRelocation: boolean;
    readonly workPermit: Localized;          // como el CV: «EU citizen – full right to work in Ireland»
    readonly availableNow: boolean;          // «Available immediately»
  };
  readonly contact: {
    readonly email: string;
    readonly github: string;                 // URL
    readonly linkedin: string;               // URL
  };
  readonly cv: Localized<string | null>;     // ruta al PDF por idioma ('/Victor_Perez_CV.pdf'); null = no se muestra
  readonly education: readonly Education[];
}

// La experiencia como misión (src/content/experience.ts; docs/01-contenido/experiencia.md).
export interface Experience {
  readonly id: string;
  readonly company: string;
  readonly role: Localized;
  readonly location: Localized;
  readonly period: Localized;
  readonly status: Localized;
  readonly summary: Localized;                       // lo que hizo, nunca qué es el producto
  readonly modules: readonly MissionModule[];        // { id, name: Label, purpose: Localized, entries: number[] }
  readonly log: readonly MissionLogEntry[];          // { tag: Localized, text: Localized }: las viñetas del CV
  readonly reference: MissionReference | null;       // { quote: Localized, author, title: Localized }
}

export interface Education {
  readonly id: string;
  readonly title: Localized;
  readonly school: string;
  readonly period: Localized;                // como el CV: 'Jan 2023 – Oct 2024' / 'ene 2023 – oct 2024'
  readonly hours: number;
  readonly grade?: Localized;                // nota en palabras ('Distinction'); nunca la numérica
  readonly status: 'completed' | 'in-progress';
  readonly skills: readonly string[];
}

export type SkillGroupId = 'web' | 'libraries' | 'tools' | 'ai';

export interface Skill {
  readonly id: string;                       // 'react-ts' (la escena lo usa para colocar la estrella)
  readonly label: Label;
}

export interface SkillGroup {
  readonly id: SkillGroupId;
  readonly title: Localized;
  readonly skills: readonly Skill[];
}

export type ProjectRole = 'frontend' | 'fullstack';
export type ProjectContext = 'personal' | 'course';

export interface Project {
  readonly slug: string;                     // 'chessmate' → ruta del proyecto
  readonly order: number;                    // orden de lectura (1 = primero)
  readonly featured: boolean;                // ocupa la placa central del caparazón
  readonly name: string;
  readonly tagline: Localized;               // una línea
  readonly year: number;
  readonly role: ProjectRole;
  readonly context: ProjectContext;
  readonly summary: Localized;               // 2–3 frases para la fila del capítulo y el modo misión rápida
  readonly about: Localized<readonly string[]>;
  readonly features: readonly Localized[];   // lo que hace el producto
  readonly stack: {
    readonly core: readonly Label[];         // lenguajes y frameworks
    readonly libraries: readonly Label[];
    readonly design: readonly Label[];       // Label: «Responsive design» sí se traduce
    readonly tooling: readonly Label[];
  };
  readonly process: Localized<readonly string[]>;   // vacío = la sección no se pinta
  readonly highlights: readonly Localized[]; // retos técnicos resueltos; vacío = no se pinta
  readonly notes: readonly ProjectNote[];
  readonly tryIt: TryIt | null;
  readonly cover: CoverAsset | null;        // null = sin portada (Cosmos, hasta F6): ni se pinta ni hay
                                             // og:image. La de Chessmate y AstroHub = su captura de Inicio
  readonly gallery: readonly ImageAsset[];  // vacía = la sección no se pinta
  readonly links: {
    readonly code: string;                   // URL del repo
    readonly demo: string | null;
    readonly readme: string;                 // URL del README
  };
}

// En el código, cada proyecto se parte en tres (ADR-036): la tarjeta `projects/<slug>.ts` (`ProjectEntry`, lo que
// pinta la home), el detalle `projects/details/<slug>.ts` (`ProjectDetail`, lo que solo pinta su página) y sus
// imágenes en `media.ts` (`ProjectMedia`). `projects/index.ts` los junta en `Project`.
type ProjectDetailKey = 'about' | 'features' | 'process' | 'highlights' | 'notes' | 'tryIt';
export type ProjectEntry = Omit<Project, ProjectDetailKey | 'stack' | 'cover' | 'gallery'> & {
  readonly stack: Pick<Project['stack'], 'core'>;            // el stack principal: las filas lo enseñan
};
export type ProjectDetail = Pick<Project, ProjectDetailKey> & {
  readonly stack: Omit<Project['stack'], 'core'>;            // el resto del stack
};
export type ProjectMedia = Pick<Project, 'cover' | 'gallery'>;

export interface ProjectNote {
  readonly kind: 'info' | 'warning';
  readonly text: Localized;
}

export interface TryIt {
  readonly intro: Localized;
  readonly steps: readonly Localized[];
  readonly credentials: readonly DemoCredential[];
}

export interface DemoCredential {
  readonly label: Localized;
  readonly user: string;
  readonly password: string;
}

/** Mission control (C.4): las cifras del repo, contadas al construir (ADR-035; `content/telemetry.ts`). */
export interface SiteTelemetry {
  readonly unitTests: number; // tests escritos, no ejecuciones
  readonly e2eTests: number;
  readonly browsers: readonly string[]; // la matriz de los e2e del CI, por proyecto de Playwright
  readonly decisions: number; // los ADR de DECISIONS.md
  readonly month: string; // el mes del build, AAAA-MM en UTC
}

/** Un paso de la cuenta atrás de Mission control (`content/workflow.ts`). */
export interface LaunchStep {
  readonly id: 'plan' | 'greenLight' | 'build' | 'audit' | 'launch';
  readonly countdown: number; // T-4 … T-0
  readonly beforeCode: boolean; // bajo la cota «No code yet»
  readonly name: UiKey; // sus textos, en texts/ (missionControl.*)
  readonly detail: UiKey;
}
// `LAUNCH_SEQUENCE` (los cinco en orden), `AUDIT_LOOP` (de la auditoría vuelve a construcción) y
// `browserName(project)` (el nombre de un navegador del CI; uno desconocido, tal cual).
```

## Reglas que comprueban los tests de contenido

1. Todo texto del contenido está escrito (no vacío, sin espacios sobrantes en los extremos) y cada `Localized`
   tiene exactamente `en` y `es`, del mismo tipo; si son listas (párrafos), con el mismo número de elementos;
   `null` (el CV) en los dos o en ninguno.
2. `slug` único, en minúsculas y con formato `^[a-z0-9]+(?:-[a-z0-9]+)*$` (sin guiones al principio, al
   final ni dobles). Mismo formato para los ids de skills y de formación.
3. La lista `projects` va en orden de lectura: `order` = 1, 2, 3… en su posición; **exactamente un** proyecto
   `featured`.
4. URLs válidas (`https://`) en `links` y `contact`; email con formato válido.
5. Toda imagen (portada, galería e imagen para compartir) tiene `src` y `width`/`height` enteros positivos; sus
   dos `srcset` (AVIF y WebP) van de menor a mayor ancho, su variante mayor mide `width` y `src` es la WebP mayor.
   Un proyecto con galería tiene portada, que es su primera captura, y su JPEG para compartir mide 1200 px;
   ninguna captura se repite en una galería. Portada y galería coinciden con la tabla «Imágenes» de su ficha
   (archivo, textos alternativos y orden; lista escrita a mano en `content.test.ts`). Que el archivo exista lo
   garantiza el import (el build y Vitest fallan si falta). Las claves de `projectMedia` son slugs de proyectos.
   Vitest comprueba la regla sobre su sustituto de los presets; `project-images.spec.ts`, sobre cada `<picture>`
   y el `og:image` de las fichas del build.
6. Cada `Skill.id` es único entre todos los grupos (desde F2.2) y existe en el mapa de posiciones de la escena
   (desde F4.3a: lo comprueba el test de `scene/config/constellationLayout`, no los de contenido).
7. Los textos `en` y `es` tienen exactamente las mismas claves (el compilador y un test) y, en cada clave, los
   mismos huecos `{x}` (en cualquier orden).
8. Además: `LOCALES` = `en`, `es`, con EN primero; las 4 constelaciones en su orden y ninguna vacía; formación con
   ids únicos y horas enteras positivas; la misión con seis entradas y un manifiesto que las cubre todas, sin
   números que no existan; cada `cv` que no es `null`, un PDF que existe en `public/`; y al menos un elemento en las listas que la interfaz siempre pinta
   (`bio`, `availability.modes`, y por proyecto `about`, `features`, `stack.core` y `tryIt.steps`).
   `process` y `highlights` sí pueden ir vacíos: la sección no se pinta. La cuenta atrás de Mission control va de
   T-4 a T-0 sin huecos ni ids repetidos, con los pasos de antes del código seguidos y al principio, y su bucle va
   hacia atrás (de la auditoría a un paso anterior); `browserName` nombra los tres navegadores del CI y deja uno
   desconocido tal cual.

## Relación con la escena

- La escena **no** guarda textos: recibe `slug`, `name` y el orden, y coloca cada proyecto en una placa del
  caparazón. El proyecto `featured` va en la placa central; el resto, en las placas contiguas por `order`.
  La rejilla admite más placas, así que añadir un proyecto no obliga a tocar la escena.
- Las constelaciones se construyen con `SkillGroup.id` y `Skill.id`; las posiciones 3D viven en la escena.

## Credenciales de demo

Las credenciales de `TryIt` son **cuentas de demostración públicas** de proyectos de ejemplo (sin datos reales).
No son secretos del portfolio y pueden estar en el repo. Nunca se pondrá aquí una credencial real.
