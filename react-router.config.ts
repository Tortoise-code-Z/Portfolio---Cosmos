import type { Config } from '@react-router/dev/config';

/**
 * Sitio estático pre-renderizado (ADR-001): HTML completo por ruta e idioma en el build,
 * sin servidor en producción.
 */
export default {
  appDirectory: 'src',
  ssr: false,
  prerender: ['/', '/es'],
} satisfies Config;
