// Las cifras del repo que enseña Mission control: las cuenta el build leyendo el código (scripts/siteTelemetry.ts,
// ADR-035), nunca se escriben a mano. Vitest las cuenta igual al arrancar (vitest.config.ts).

import counted from 'virtual:site-telemetry';

import type { SiteTelemetry } from './types';

export const siteTelemetry: SiteTelemetry = counted;
