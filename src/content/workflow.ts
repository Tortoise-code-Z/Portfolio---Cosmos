// Cómo trabaja Víctor, como una secuencia de lanzamiento (docs/02-experiencia/capitulos/interludio-2-mission-control.md):
// la pinta Mission control y la resume la misión rápida. Los textos de cada paso están en `texts/` (`missionControl.*`).

import type { UiKey } from './types';

/** Un paso de la cuenta atrás. */
export type LaunchStepId = 'plan' | 'greenLight' | 'build' | 'audit' | 'launch';

export interface LaunchStep {
  readonly id: LaunchStepId;
  /** Lo que falta para el lanzamiento: T-4 … T-0. */
  readonly countdown: number;
  /** Si el paso va antes de escribir código (la cota «no code yet» del esquema). */
  readonly beforeCode: boolean;
  /** Su nombre y su detalle (el del lanzamiento lleva `{browsers}`: los navegadores del CI). */
  readonly name: UiKey;
  readonly detail: UiKey;
}

/**
 * La cuenta atrás en orden: plan, luz verde, construcción, auditoría y lanzamiento (T-4 → T-0). Sus claves de texto
 * quedan literales (`as const`): `t(step.detail, { browsers })` exige el hueco que tenga cualquiera de ellas.
 */
export const LAUNCH_SEQUENCE = [
  {
    id: 'plan',
    countdown: 4,
    beforeCode: true,
    name: 'missionControl.plan',
    detail: 'missionControl.plan.detail',
  },
  {
    id: 'greenLight',
    countdown: 3,
    beforeCode: true,
    name: 'missionControl.greenLight',
    detail: 'missionControl.greenLight.detail',
  },
  {
    id: 'build',
    countdown: 2,
    beforeCode: false,
    name: 'missionControl.build',
    detail: 'missionControl.build.detail',
  },
  {
    id: 'audit',
    countdown: 1,
    beforeCode: false,
    name: 'missionControl.audit',
    detail: 'missionControl.audit.detail',
  },
  {
    id: 'launch',
    countdown: 0,
    beforeCode: false,
    name: 'missionControl.launch',
    detail: 'missionControl.launch.detail',
  },
] as const satisfies readonly LaunchStep[];

/** El bucle del esquema: lo que corrige la auditoría vuelve a construcción. */
export const AUDIT_LOOP: { readonly from: LaunchStepId; readonly to: LaunchStepId } = {
  from: 'audit',
  to: 'build',
};

/** El nombre de cada navegador del CI (su proyecto de Playwright, `chromium`): uno nuevo se enseña tal cual. */
const BROWSER_NAMES: Readonly<Record<string, string>> = {
  chromium: 'Chromium',
  firefox: 'Firefox',
  webkit: 'WebKit',
};

/** El nombre de un navegador del CI para el sitio: `webkit` → `WebKit`. */
export function browserName(project: string): string {
  return BROWSER_NAMES[project] ?? project;
}
