/**
 * `localStorage` sin sustos: en una ventana privada, con los datos del sitio bloqueados o en el
 * pre-render, leer o escribir puede no existir o lanzar. Entonces se recuerda en memoria hasta recargar
 * (la interfaz funciona igual: un aviso contestado no vuelve a salir al ir y volver de un proyecto) y
 * se avisa en la consola una sola vez por clave y operación, con la clave y sin el valor.
 * Solo para comodidades de quien visita (un aviso descartado), nunca para datos que importen.
 */

/** Lo que no se pudo guardar en `localStorage`: vive hasta recargar la página. */
const memory = new Map<string, string>();

/** Avisos ya dados («read:clave», «write:clave», «available»): cada uno sale una sola vez. */
const warned = new Set<string>();

function warnOnce(id: string, message: string, error: unknown): void {
  if (warned.has(id)) return;
  warned.add(id);
  console.warn(message, error);
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch (error) {
    warnOnce('available', '[storage] localStorage is not available', error);
    return null;
  }
}

/** Valor guardado con esa clave, o `null` si no hay (lo que no se pudo guardar, de la memoria). */
export function readStorage(key: string): string | null {
  try {
    return storage()?.getItem(key) ?? memory.get(key) ?? null;
  } catch (error) {
    warnOnce(`read:${key}`, `[storage] Could not read "${key}"`, error);
    return memory.get(key) ?? null;
  }
}

/** Guarda el valor; si no se puede, lo recuerda en memoria (se olvidará al recargar) y lo avisa. */
export function writeStorage(key: string, value: string): void {
  const store = storage();
  if (store === null) {
    memory.set(key, value);
    return;
  }
  try {
    store.setItem(key, value);
  } catch (error) {
    memory.set(key, value);
    warnOnce(`write:${key}`, `[storage] Could not write "${key}"`, error);
  }
}
