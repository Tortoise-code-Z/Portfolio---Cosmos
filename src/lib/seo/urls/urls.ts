// URL absolutas del sitio, con una sola forma: origen + ruta, sin barra final salvo la
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

/** Archivo del build (`/assets/01-home-CaIUKrxu.jpeg`): el hash lleva mayúsculas, `_` y `-`; sin `?`, `#` ni `..`. */
const ASSET_SHAPE = /^\/(?:[\w-]+\/)*[\w-]+(?:\.[\w-]+)*\.[a-z0-9]+$/;

/**
 * La misma imagen en `npm run dev`: `vite-imagetools` la sirve desde memoria en `/@imagetools/<hash>`, sin
 * extensión. Solo existe en desarrollo (el build escribe archivos en `/assets/`).
 */
const DEV_IMAGE_SHAPE = /^\/@imagetools\/[0-9a-f]+$/;

/** URL absoluta de un archivo del build (la imagen para compartir). Otra forma es un error de programa. */
export function assetUrl(origin: string, path: string): string {
  if (!ASSET_SHAPE.test(path) && !DEV_IMAGE_SHAPE.test(path)) {
    throw new Error(`assetUrl: ruta de archivo no válida «${path}»`);
  }
  return new URL(path, origin).href;
}
