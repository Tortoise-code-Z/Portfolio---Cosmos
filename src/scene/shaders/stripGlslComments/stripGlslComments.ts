/**
 * Los dos tipos de comentario, en una sola pasada de izquierda a derecha: el que empieza antes manda, así que un
 * `/*` dentro de un `//` (o un `//` dentro de un comentario de bloque) no abre otro. GLSL no tiene cadenas de
 * texto: fuera de un comentario, `//` y `/*` siempre abren uno.
 */
const COMMENT = /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g;

/**
 * Quita los comentarios de un shader GLSL al compilar (F33-6, docs/04-escena/rendimiento.md → «Presupuesto»):
 * los `.glsl` van comentados para leerlos, pero el navegador no necesita los comentarios y pesan en el chunk de
 * la escena. Lo usa el plugin `cosmos:glsl-without-comments` de `vite.config.ts` con los imports `?raw`; Vitest
 * lee los archivos tal cual.
 *
 * Conserva los saltos de línea (también los de dentro de un comentario de bloque): la línea de un error de
 * compilación sigue siendo la del archivo, más las de la cabecera (`glslHeader`). Quita también los espacios
 * que quedan al final de cada línea.
 */
export function stripGlslComments(source: string): string {
  return source
    .replace(COMMENT, (comment) => comment.replace(/[^\n]/g, ''))
    .replace(/[ \t]+$/gm, '');
}
