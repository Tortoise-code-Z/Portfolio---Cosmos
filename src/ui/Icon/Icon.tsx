import type { ReactNode } from 'react';

import styles from './Icon.module.css';

/**
 * Iconos propios en SVG en línea (docs/03-diseno/design-system.md → «Iconos»): trazo 1,5 px sobre una
 * rejilla de 16, `currentColor` y siempre decorativos. El botón o enlace que lo lleva pone el texto.
 */
const PATHS = {
  'arrow-down': 'M8 2.5v11M3.5 9 8 13.5 12.5 9',
  'arrow-right': 'M2.5 8h11M9 3.5 13.5 8 9 12.5',
  external: 'M9.5 2.5h4v4M13.5 2.5 7 9M11.5 9.5v4h-9v-9h4',
  download: 'M8 2.5v8M4.5 7 8 10.5 11.5 7M2.5 13.5h11',
} as const;

export type IconName = keyof typeof PATHS;

/** Los dos tamaños del sistema: 16 px junto al texto pequeño, 20 px en botones. */
export type IconSize = 16 | 20;

interface IconProps {
  readonly name: IconName;
  readonly size?: IconSize;
}

export function Icon({ name, size = 16 }: IconProps): ReactNode {
  return (
    <svg
      className={styles.icon}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
