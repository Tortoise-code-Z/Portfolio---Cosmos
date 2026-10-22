import { index, route, type RouteConfig } from '@react-router/dev/routes';

// Cada ruta se declara una vez por idioma con el mismo módulo (docs/05-tecnico/arquitectura.md).
export default [
  index('routes/journey.tsx', { id: 'journey-en' }),
  route('es', 'routes/journey.tsx', { id: 'journey-es' }),
] satisfies RouteConfig;
