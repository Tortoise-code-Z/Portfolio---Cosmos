/** Une clases de CSS Modules ignorando las que faltan o están apagadas: `cx(a, isHot && b)`. */
export function cx(...classes: readonly (string | false | null | undefined)[]): string {
  return classes
    .filter((name): name is string => typeof name === 'string' && name !== '')
    .join(' ');
}
