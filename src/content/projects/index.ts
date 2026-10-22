import type { Project } from '../types';
import { astrohub } from './astrohub';
import { chessmate } from './chessmate';
import { cosmos } from './cosmos';

/** Todos los proyectos, en orden de lectura (`order`). Las rutas y el `prerender` salen de aquí. */
export const projects: readonly Project[] = [chessmate, astrohub, cosmos];
