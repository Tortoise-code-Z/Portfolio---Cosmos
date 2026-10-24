/**
 * `localStorage` sin sustos: en una ventana privada, con los datos del sitio bloqueados o en el
 * pre-render, leer o escribir puede no existir o lanzar. Entonces se sigue sin recordar nada (la
 * interfaz funciona igual, solo olvida) y se avisa en la consola con la clave, sin el valor.
 * Solo para comodidades de quien visita (un aviso descartado), nunca para datos que importen.
 */

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch (error) {
    console.warn('[storage] localStorage is not available', error);
    return null;
  }
}

/** Valor guardado con esa clave, o `null` si no hay (o no se puede leer). */
export function readStorage(key: string): string | null {
  try {
    return storage()?.getItem(key) ?? null;
  } catch (error) {
    console.warn(`[storage] Could not read "${key}"`, error);
    return null;
  }
}

/** Guarda el valor; si no se puede, lo avisa y sigue (se olvidará al recargar). */
export function writeStorage(key: string, value: string): void {
  try {
    storage()?.setItem(key, value);
  } catch (error) {
    console.warn(`[storage] Could not write "${key}"`, error);
  }
}
