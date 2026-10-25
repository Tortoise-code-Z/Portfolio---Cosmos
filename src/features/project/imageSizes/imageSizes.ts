/**
 * Medidas de la página de proyecto de las que salen los `sizes` de la portada y de las miniaturas
 * (docs/02-experiencia/pagina-proyecto.md → «Layout»). Copian tokens de `src/styles/tokens.css` (un
 * `sizes` no puede leer variables CSS): `imageSizes.test.ts` comprueba que siguen siendo esos valores.
 */
export const PROJECT_LAYOUT = {
  /** `--read-w`: la columna de lectura. */
  readWidth: 720,
  /** `--project-col-min`: ancho mínimo de cada columna de la galería. */
  columnMin: 220,
  /** `--space-3`: hueco entre miniaturas y marco de la portada. */
  gap: 12,
  /** `--gutter`, desde el breakpoint sm. */
  gutter: 24,
  /** `--gutter` por debajo del breakpoint sm. */
  gutterSmall: 16,
  /** Breakpoint sm (520 px): por debajo, el margen lateral es `gutterSmall`. */
  smallBelow: 520,
} as const;

/** Ancho de ventana a partir del cual la columna mide al menos `content` px (con su margen a cada lado). */
function viewportFor(content: number): number {
  const small = content + 2 * PROJECT_LAYOUT.gutterSmall;
  return small < PROJECT_LAYOUT.smallBelow ? small : content + 2 * PROJECT_LAYOUT.gutter;
}

/**
 * `sizes` de la portada: dentro de su marco (`gap` a cada lado), mide la columna de lectura entera desde que
 * esta cabe; por debajo, algo menos que la ventana.
 */
export function coverSizes(): string {
  const { readWidth, gap } = PROJECT_LAYOUT;
  return `(min-width: ${String(viewportFor(readWidth))}px) ${String(readWidth - 2 * gap)}px, 100vw`;
}

/**
 * `sizes` de las miniaturas (`repeat(auto-fill, minmax(columnMin, 1fr))`): tres columnas desde que caben,
 * cada una de un tercio de la columna de lectura como mucho; dos, la mitad de la ventana como mucho; y una.
 * Los cortes no cuentan una barra de scroll clásica (escritorio): en esos ~15 px se pide una variante
 * algo menor, que solo se nota a densidad 2.
 */
export function thumbSizes(): string {
  const { readWidth, columnMin, gap } = PROJECT_LAYOUT;
  const three = viewportFor(3 * columnMin + 2 * gap);
  const two = viewportFor(2 * columnMin + gap);
  const third = Math.ceil((readWidth - 2 * gap) / 3);
  return `(min-width: ${String(three)}px) ${String(third)}px, (min-width: ${String(two)}px) 50vw, 100vw`;
}
