import type { ProjectEntry } from '../types';
import { astrohub } from './astrohub';
import { chessmate } from './chessmate';
import { cosmos } from './cosmos';

/**
 * Las tarjetas de los proyectos —sin el detalle de su página (`details/`, ADR-036) ni sus imágenes—, en
 * orden de lectura (`order`). Es lo que lee la home (filas, misión rápida, placas de la escena). De aquí
 * salen también las rutas, el `prerender` y el sitemap: lo importan la config de React Router y los e2e,
 * que cargan el contenido sin Vite y no entienden los imports de imagen (media.ts).
 */
export const projectEntries: readonly ProjectEntry[] = [chessmate, astrohub, cosmos];
