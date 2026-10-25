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

export interface Education {
  readonly id: string;
  readonly title: Localized;
  readonly school: string;
  /** Curso académico o año: '2023/24', '2025'. */
  readonly period: string;
  readonly hours: number;
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
  readonly strengths: readonly Localized[];
  readonly location: { readonly city: string; readonly country: Localized };
  readonly availability: {
    readonly openToWork: boolean;
    readonly modes: readonly WorkMode[];
    readonly openToRelocation: boolean;
  };
  readonly contact: {
    readonly email: string;
    readonly github: string;
    readonly linkedin: string;
  };
  /** Ruta al PDF por idioma; `null` = aún no existe y la interfaz no muestra el enlace. */
  readonly cv: Localized<string | null>;
  readonly education: readonly Education[];
}

export type SkillGroupId = 'web' | 'libraries' | 'tools' | 'ai';

export interface Skill {
  /** La escena lo usa para colocar la estrella (F4: `config/constellationLayout.ts`). */
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
  readonly about: Localized<readonly string[]>;
  readonly features: readonly Localized[];
  readonly stack: {
    readonly core: readonly Label[];
    readonly libraries: readonly Label[];
    readonly design: readonly Label[];
    readonly tooling: readonly Label[];
  };
  /** Vacío = la sección no se pinta (Cosmos hasta F6). */
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

/** Un proyecto sin sus imágenes: sus textos y datos (`projects/<slug>.ts`). */
export type ProjectEntry = Omit<Project, 'cover' | 'gallery'>;

/** Las imágenes de un proyecto (`projects/media.ts`): portada y galería. */
export type ProjectMedia = Pick<Project, 'cover' | 'gallery'>;
