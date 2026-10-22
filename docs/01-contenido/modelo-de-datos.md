# Modelo de datos del contenido

> Forma tipada de todo el contenido. Es especificación: el código final puede ajustar nombres,
> pero no la idea (contenido separado de la escena, bilingüe y validado por tests).

## Dónde vive en el código (propuesta, se confirma en `docs/05-tecnico/arquitectura.md`)

```
src/content/
  types.ts            ← los tipos de este documento
  profile.ts          ← perfil.md
  skills.ts           ← habilidades.md
  projects/
    chessmate.ts      ← proyectos/chessmate.md
    astrohub.ts
    cosmos.ts
    index.ts          ← lista ordenada de proyectos
  ui/
    en.ts             ← textos-sitio.md (EN)
    es.ts             ← textos-sitio.md (ES)
```

El contenido es **código TypeScript tipado** (no JSON ni CMS): no viene de fuera, así que el compilador y los
tests bastan para validarlo. Si en el futuro llega contenido externo (por ejemplo, la API de la NASA), ese dato
sí se valida en el borde con un esquema en tiempo de ejecución.

## Tipos

```ts
export type Locale = 'en' | 'es';
export const DEFAULT_LOCALE: Locale = 'en';

/** Texto en los dos idiomas. Obligatorio en ambos. */
export type Localized<T = string> = Readonly<Record<Locale, T>>;

/** Para nombres propios que no se traducen. */
export type Label = string | Localized;

export interface ImageAsset {
  readonly src: string;          // ruta relativa a src/assets/
  readonly width: number;
  readonly height: number;
  readonly alt: Localized;
}

export type WorkMode = 'remote' | 'hybrid' | 'onsite';

export interface Profile {
  readonly name: string;                     // 'Víctor Pérez'
  readonly fullName: string;                 // 'Víctor David Pérez Alarcón'
  readonly alias: string;                    // 'Tortoise_code'
  readonly role: Localized;
  readonly headline: Localized;              // línea corta para SEO y tarjetas
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
    readonly github: string;                 // URL
    readonly linkedin: string;               // URL
  };
  readonly cv: Localized<string | null>;     // ruta al PDF por idioma; null = aún no existe (no se muestra)
  readonly education: readonly Education[];
}

export interface Education {
  readonly id: string;
  readonly title: Localized;
  readonly school: string;
  readonly period: string;                   // '2023/24'
  readonly hours: number;
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
    readonly core: readonly string[];        // lenguajes y frameworks
    readonly libraries: readonly string[];
    readonly design: readonly string[];
    readonly tooling: readonly string[];
  };
  readonly process: Localized<readonly string[]>;
  readonly highlights: readonly Localized[]; // retos técnicos resueltos
  readonly notes: readonly ProjectNote[];
  readonly tryIt: TryIt | null;
  readonly cover: ImageAsset;
  readonly gallery: readonly ImageAsset[];
  readonly links: {
    readonly code: string;                   // URL del repo
    readonly demo: string | null;
    readonly readme: string;                 // URL del README
  };
}

export interface ProjectNote {
  readonly kind: 'info' | 'warning';
  readonly text: Localized;
}

export interface TryIt {
  readonly intro: Localized;
  readonly steps: readonly Localized[];
  readonly credentials: readonly { readonly label: Localized; readonly user: string; readonly password: string }[];
}
```

## Reglas que comprueban los tests de contenido

1. Cada `Localized` tiene texto no vacío en `en` y en `es`.
2. `slug` único, en minúsculas y con formato `^[a-z0-9-]+$`.
3. `order` único y consecutivo desde 1; **exactamente un** proyecto `featured`.
4. URLs válidas (`https://`) en `links` y `contact`.
5. Todo `ImageAsset.src` existe en `src/assets/` y tiene `width`/`height` positivos.
6. Cada `Skill.id` es único y existe en el mapa de posiciones de la escena (`docs/04-escena/`).
7. El objeto de textos `en` y el `es` tienen exactamente las mismas claves.

## Relación con la escena

- La escena **no** guarda textos: recibe `slug`, `name` y el orden, y coloca cada proyecto en una placa del
  caparazón. El proyecto `featured` va en la placa central; el resto, en las placas contiguas por `order`.
  La rejilla admite más placas, así que añadir un proyecto no obliga a tocar la escena.
- Las constelaciones se construyen con `SkillGroup.id` y `Skill.id`; las posiciones 3D viven en la escena.

## Credenciales de demo

Las credenciales de `TryIt` son **cuentas de demostración públicas** de proyectos de ejemplo (sin datos reales).
No son secretos del portfolio y pueden estar en el repo. Nunca se pondrá aquí una credencial real.
