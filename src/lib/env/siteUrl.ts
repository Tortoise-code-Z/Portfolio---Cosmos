/** Error de configuración del entorno: corta el build con un mensaje accionable. */
export class EnvError extends Error {
  override readonly name = 'EnvError';
}

/**
 * Valida `VITE_SITE_URL` y la devuelve normalizada (solo el origen, sin barra final).
 * Debe existir, ser una URL válida, usar https y no llevar ruta, query ni hash.
 */
export function parseSiteUrl(value: string | undefined): string {
  const raw = value?.trim() ?? '';
  if (raw === '') {
    throw new EnvError(
      'VITE_SITE_URL is missing. Copy .env.example to .env (local) or set it in Vercel/CI.',
    );
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch (error) {
    throw new EnvError(`VITE_SITE_URL is not a valid URL: "${raw}".`, { cause: error });
  }

  if (url.protocol !== 'https:') {
    throw new EnvError(`VITE_SITE_URL must use https:// (got "${raw}").`);
  }
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
    throw new EnvError(
      `VITE_SITE_URL must be an origin without path, query or hash (got "${raw}").`,
    );
  }

  return url.origin;
}
