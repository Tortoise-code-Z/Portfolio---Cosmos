import type { ProjectEntry } from '../types';
import { astrohub } from './astrohub';
import { chessmate } from './chessmate';
import { cosmos } from './cosmos';

/**
 * Los proyectos sin sus imágenes, en orden de lectura (`order`). De aquí salen las rutas, el `prerender` y
 * el sitemap: lo importan también la config de React Router y los e2e, que cargan el contenido sin Vite y
 * no entienden los imports de imagen (media.ts).
 */
export const projectEntries: readonly ProjectEntry[] = [chessmate, astrohub, cosmos];
