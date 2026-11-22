// Tipos del contenido (docs/01-contenido/modelo-de-datos.md). El contenido es código tipado:
// el compilador y los tests de `content.test.ts` lo validan; no hay datos externos.

import type { en } from './texts/en';

export type Locale = 'en' | 'es';

export const DEFAULT_LOCALE: Locale = 'en';

/** Todos los idiomas del sitio, con el principal primero. */
export const LOCALES: readonly Locale[] = ['en', 'es'];

/** Texto en los dos idiomas. Obligatorio en ambos. */
export type Localized<T = string> = Readonly<Record<Locale, T>>;

/** Para nombres propios que no se traducen (string) o etiquetas que sí (Localized). */
export type Label = string | Localized;

/** Claves de los textos de interfaz: planas (`'project.stack.core'`), sacadas de `texts/en.ts`. */
export type UiKey = keyof typeof en;

/** Texto EN literal de una clave: de él salen los huecos `{x}` que exige `translate` (lib/i18n). */
export type UiTemplate<K extends UiKey> = (typeof en)[K];

/** Textos de interfaz de un idioma: exactamente las claves de EN. */
export type UiTexts = Readonly<Record<UiKey, string>>;

/** Un archivo de imagen con sus medidas (para reservar su hueco sin saltos de layout). */
export interface ImageFile {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

/**
 * Una captura ya procesada por `vite-imagetools` (import con `?project`, vite.config.ts): `src` y las
 * medidas son las de la variante mayor en WebP (el respaldo del `<img>`) y `sources`, el `srcset` de
 * cada formato (AVIF y WebP a 640, 1280 y 1920 px).
 */
export interface ResponsiveImage extends ImageFile {
  readonly sources: {
    readonly avif: string;
    readonly webp: string;
  };
}

/** Imagen del contenido: la captura procesada y su texto alternativo en los dos idiomas. */
export interface ImageAsset extends ResponsiveImage {
  readonly alt: Localized;
}

/** Portada: además, la imagen para compartir (`og:image`), un JPEG de 1200 px (import con `?share`). */
export interface CoverAsset extends ImageAsset {
  readonly share: ImageFile;
}

export type WorkMode = 'remote' | 'hybrid' | 'onsite';

/** Un módulo del manifiesto de una misión: una herramienta, para qué se usó y qué entradas del registro le tocan. */
export interface MissionModule {
  readonly id: string;
  readonly name: Label;
  readonly purpose: Localized;
  /** Números (desde 1) de las entradas del registro. */
  readonly entries: readonly number[];
}

/** Una entrada del registro: una viñeta del CV con su etiqueta de terminal. */
export interface MissionLogEntry {
  readonly tag: Localized;
  readonly text: Localized;
}

/** Una frase de la carta de recomendación, citada con permiso de quien la firma. */
export interface MissionReference {
  readonly quote: Localized;
  readonly author: string;
  readonly title: Localized;
}

/**
 * Una experiencia profesional como misión (docs/02-experiencia/capitulos/interludio-1-mission-log.md): lo que hizo
 * Víctor, sacado del CV y suavizado; nada de qué es ni de cómo está construido el producto de la empresa (nota de
 * ADR-034; docs/01-contenido/experiencia.md → «Regla de privacidad»).
 */
export interface Experience {
  readonly id: string;
  readonly company: string;
  readonly role: Localized;
  readonly location: Localized;
  readonly period: Localized;
  readonly status: Localized;
  readonly summary: Localized;
  readonly modules: readonly MissionModule[];
  readonly log: readonly MissionLogEntry[];
  readonly reference: MissionReference | null;
}

/**
 * La telemetría del propio repo que enseña Mission control (docs/02-experiencia/capitulos/interludio-2-mission-control.md
 * → «Telemetría»): se cuenta al construir el sitio leyendo el código (`scripts/siteTelemetry.ts`), nunca a mano.
 */
export interface SiteTelemetry {
  /** Tests unitarios escritos (Vitest): cada `it` o `test` una vez, también un `it.each`. */
  readonly unitTests: number;
  /** Tests e2e escritos (Playwright), contados igual. */
  readonly e2eTests: number;
  /** Los navegadores de los e2e del CI, por su nombre de proyecto de Playwright (`chromium`…). */
  readonly browsers: readonly string[];
  /** Las decisiones registradas: los ADR de `DECISIONS.md`. */
  readonly decisions: number;
  /** El mes en que se contó (el del build), `AAAA-MM` en UTC. */
  readonly month: string;
}

export interface Education {
  readonly id: string;
  readonly title: Localized;
  readonly school: string;
  /** Fechas como las dice el CV: 'Jan 2023 – Oct 2024' / 'ene 2023 – oct 2024', o solo el año. */
  readonly period: Localized;
  readonly hours: number;
  /** Nota final en palabras, como en el CV ('Distinction'); nunca la numérica. Sin nota, se omite. */
  readonly grade?: Localized;
  readonly status: 'completed' | 'in-progress';
  readonly skills: readonly string[];
}

export interface Profile {
  readonly name: string;
  readonly fullName: string;
  readonly alias: string;
  readonly role: Localized;
  /** Línea corta para SEO y tarjetas. */
  readonly headline: Localized;
  readonly bio: Localized<readonly string[]>;
  readonly location: { readonly city: string; readonly country: Localized };
  readonly availability: {
    readonly openToWork: boolean;
    readonly modes: readonly WorkMode[];
    readonly openToRelocation: boolean;
    /** Permiso de trabajo, como lo dice el CV («EU citizen – full right to work in Ireland»). */
    readonly workPermit: Localized;
    /** Puede empezar ya («Available immediately» en el CV). */
    readonly availableNow: boolean;
  };
  readonly contact: {
    readonly email: string;
    readonly github: string;
    readonly linkedin: string;
  };
  /** Ruta al PDF por idioma; `null` = aún no existe y la interfaz no muestra el enlace. */
  readonly cv: Localized<string | null>;
  readonly education: readonly Education[];
  /** Los idiomas que hablo, sin nivel (Crew file, C.6). */
  readonly languages: readonly Localized[];
}

export type SkillGroupId = 'web' | 'libraries' | 'tools' | 'ai';

export interface Skill {
  /** La escena lo usa para colocar la estrella (`scene/config/constellationLayout`). */
  readonly id: string;
  readonly label: Label;
}

export interface SkillGroup {
  readonly id: SkillGroupId;
  readonly title: Localized;
  /** En orden de lectura del panel. */
  readonly skills: readonly Skill[];
}

export type ProjectRole = 'frontend' | 'fullstack';
export type ProjectContext = 'personal' | 'course';

export interface ProjectNote {
  readonly kind: 'info' | 'warning';
  readonly text: Localized;
}

/** Cuenta de demostración pública de un proyecto de ejemplo. Nunca una credencial real. */
export interface DemoCredential {
  readonly label: Localized;
  readonly user: string;
  readonly password: string;
}

export interface TryIt {
  readonly intro: Localized;
  readonly steps: readonly Localized[];
  readonly credentials: readonly DemoCredential[];
}

export interface Project {
  /** Segmento de la ruta: `/projects/<slug>`. */
  readonly slug: string;
  /** Orden de lectura (1 = primero). */
  readonly order: number;
  /** Ocupa la placa central del caparazón. Exactamente uno. */
  readonly featured: boolean;
  readonly name: string;
  readonly tagline: Localized;
  readonly year: number;
  readonly role: ProjectRole;
  readonly context: ProjectContext;
  /** 2–3 frases para la fila del capítulo y el modo misión rápida. */
  readonly summary: Localized;
  /**
   * La meta description de la ficha cuando el `summary` es demasiado largo para los buscadores (cortan hacia
   * 155–160 caracteres): como mucho 160 en cada idioma (test). Sin ella, la descripción es el `summary`.
   */
  readonly metaDescription?: Localized;
  readonly about: Localized<readonly string[]>;
  readonly features: readonly Localized[];
  readonly stack: {
    readonly core: readonly Label[];
    readonly libraries: readonly Label[];
    readonly design: readonly Label[];
    readonly tooling: readonly Label[];
  };
  /** Vacío = la sección no se pinta (hoy todas las fichas lo tienen). */
  readonly process: Localized<readonly string[]>;
  /** Retos técnicos resueltos. Vacío = la sección no se pinta. */
  readonly highlights: readonly Localized[];
  readonly notes: readonly ProjectNote[];
  readonly tryIt: TryIt | null;
  /**
   * `null` = sin portada todavía: la interfaz no la pinta y la ficha no lleva `og:image` (Cosmos, hasta
   * F6). La de Chessmate y AstroHub es su captura de Inicio, la misma que abre la galería.
   */
  readonly cover: CoverAsset | null;
  readonly gallery: readonly ImageAsset[];
  readonly links: {
    readonly code: string;
    readonly demo: string | null;
    readonly readme: string;
  };
}

/** Lo que solo pinta la página de proyecto (ADR-036): fuera del JS de la home. */
type ProjectDetailKey =
  'metaDescription' | 'about' | 'features' | 'process' | 'highlights' | 'notes' | 'tryIt';

/**
 * La tarjeta de un proyecto (`projects/<slug>.ts`): lo que pintan la fila del capítulo y la misión
 * rápida, más lo que usan las rutas, el sitemap y la escena (las placas). Del stack, solo el principal.
 */
export type ProjectEntry = Omit<Project, ProjectDetailKey | 'stack' | 'cover' | 'gallery'> & {
  readonly stack: Pick<Project['stack'], 'core'>;
};

/**
 * El detalle de un proyecto (`projects/details/<slug>.ts`): lo que solo lee su página. Solo lo importa
 * `projects/index.ts` (ESLint), y a ese, solo la página de proyecto: así no viaja en el JS de la home
 * (ADR-036). Del stack, todo menos el principal, que va en la tarjeta.
 */
export type ProjectDetail = Pick<Project, ProjectDetailKey> & {
  readonly stack: Omit<Project['stack'], 'core'>;
};

/** Las imágenes de un proyecto (`projects/media.ts`): portada y galería. */
export type ProjectMedia = Pick<Project, 'cover' | 'gallery'>;
