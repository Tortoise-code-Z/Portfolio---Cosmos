// URL absolutas del sitio, con una sola forma (EST-F2-3-8): origen + ruta, sin barra final salvo la
// home EN, sin `?` ni `#`. Imports relativos: lo carga `react-router.config.ts` (sitemap, robots).

/** `/`, o tramos en minúscula separados por `/`; un tramo puede acabar en extensión (`sitemap.xml`). */
const PATH_SHAPE = /^\/(?:[a-z0-9-]+(?:\.[a-z0-9]+)?(?:\/[a-z0-9-]+(?:\.[a-z0-9]+)?)*)?$/;

/** `https://…/`, `https://…/es`, `https://…/projects/chessmate`. Una ruta con otra forma es un error de programa. */
export function absoluteUrl(origin: string, path: string): string {
  if (!PATH_SHAPE.test(path)) {
    throw new Error(`absoluteUrl: ruta no canónica «${path}» (sin barra final, sin ? ni #)`);
  }
  return new URL(path, origin).href;
}
