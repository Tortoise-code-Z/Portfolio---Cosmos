import { index, route, type RouteConfig } from '@react-router/dev/routes';

// Cada ruta se declara una vez por idioma con el mismo módulo (docs/05-tecnico/arquitectura.md).
// `*` recoge todo lo demás: la 404 del idioma del prefijo (EST-F2-3-12).
export default [
  index('routes/journey/journey.tsx', { id: 'journey-en' }),
  route('es', 'routes/journey/journey.tsx', { id: 'journey-es' }),
  route('projects/:slug', 'routes/project/project.tsx', { id: 'project-en' }),
  route('es/projects/:slug', 'routes/project/project.tsx', { id: 'project-es' }),
  route('*', 'routes/not-found/not-found.tsx', { id: 'not-found' }),
] satisfies RouteConfig;
