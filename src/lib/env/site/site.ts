import { parseSiteUrl } from '../siteUrl/siteUrl';

/**
 * Origen público del sitio (`https://…`, sin barra final), validado al cargar el módulo. En dev y en
 * build lo garantiza antes `vite.config.ts` (EST-F2-3-15); en los tests lo fija `tests/setup.ts`.
 * Los builders de `lib/seo` no lo leen: lo reciben por parámetro.
 */
export const SITE_ORIGIN: string = parseSiteUrl(import.meta.env.VITE_SITE_URL);
