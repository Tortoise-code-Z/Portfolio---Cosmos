/**
 * Avisa de si casa una media query ahora y cada vez que cambie; devuelve cómo dejar de escuchar. Para lo que se
 * lee en cada frame (la escena): una consulta a `matchMedia` crea un objeto por llamada, y así solo se crea uno
 * al empezar. Sin `matchMedia` (pre-render, jsdom), avisa una vez con «no».
 */
export function watchMediaQuery(query: string, onChange: (matches: boolean) => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    onChange(false);
    return () => undefined;
  }
  const list = window.matchMedia(query);
  const listener = (event: MediaQueryListEvent): void => {
    onChange(event.matches);
  };
  onChange(list.matches);
  list.addEventListener('change', listener);
  return () => {
    list.removeEventListener('change', listener);
  };
}
