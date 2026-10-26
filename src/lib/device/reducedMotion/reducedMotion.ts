const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * ¿Pide el sistema movimiento reducido? Se consulta en el momento de actuar (un salto de scroll), así
 * que no hace falta suscribirse. Sin `matchMedia` (pre-render, tests) se responde que no.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Comportamiento de un salto de scroll: suave, o instantáneo con movimiento reducido. Instantáneo es
 * `auto` (el CSS no pide scroll suave): `instant` aún no lo entienden todos los motores.
 */
export function jumpBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}

/**
 * Avisa de la preferencia de movimiento reducido ahora y cada vez que cambie (la escena la lee en cada frame
 * sin consultar `matchMedia`, que crea un objeto por llamada). Devuelve cómo dejar de escuchar. Sin
 * `matchMedia`, avisa una vez con «no».
 */
export function watchReducedMotion(onChange: (reduced: boolean) => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    onChange(false);
    return () => undefined;
  }
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  const listener = (event: MediaQueryListEvent): void => {
    onChange(event.matches);
  };
  onChange(query.matches);
  query.addEventListener('change', listener);
  return () => {
    query.removeEventListener('change', listener);
  };
}
