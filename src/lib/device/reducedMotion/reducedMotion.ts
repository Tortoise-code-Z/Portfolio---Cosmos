const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * ¿Pide el sistema movimiento reducido? Se consulta en el momento de actuar (un salto de scroll), así
 * que no hace falta suscribirse. Sin `matchMedia` (pre-render, tests) se responde que no.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Comportamiento de un salto de scroll: suave, o instantáneo con movimiento reducido. */
export function jumpBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'instant' : 'smooth';
}
