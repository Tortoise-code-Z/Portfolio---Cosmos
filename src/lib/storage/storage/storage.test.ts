import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const KEY = 'cosmos.test';

/** Cada test con el módulo recién cargado: su memoria y sus avisos ya dados empiezan vacíos. */
let readStorage: (key: string) => string | null;
let writeStorage: (key: string, value: string) => void;

beforeEach(async () => {
  vi.resetModules();
  ({ readStorage, writeStorage } = await import('./storage'));
});

afterEach(() => {
  // Primero se quitan los espías: con el de `localStorage` puesto, ni siquiera se podría limpiar.
  vi.restoreAllMocks();
  window.localStorage.clear();
});

function blockReads(): void {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError');
  });
}

function blockWrites(): void {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError');
  });
}

describe('storage', () => {
  it('guarda y lee un valor', () => {
    expect(readStorage(KEY)).toBeNull();
    writeStorage(KEY, 'done');
    expect(readStorage(KEY)).toBe('done');
  });

  it('si leer lanza (datos del sitio bloqueados), responde null y lo avisa con la clave', () => {
    blockReads();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(readStorage(KEY)).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      `[storage] Could not read "${KEY}"`,
      expect.any(DOMException),
    );
  });

  it('el mismo fallo se avisa una sola vez (se lee en cada render)', () => {
    blockReads();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    readStorage(KEY);
    readStorage(KEY);
    readStorage(KEY);
    expect(warn).toHaveBeenCalledTimes(1);
    readStorage('cosmos.other');
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('si escribir lanza (cuota, ventana privada), no rompe y lo avisa sin el valor', () => {
    blockWrites();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(() => {
      writeStorage(KEY, 'secret-value');
    }).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      `[storage] Could not write "${KEY}"`,
      expect.any(DOMException),
    );
    expect(JSON.stringify(warn.mock.calls)).not.toContain('secret-value');
  });

  it('lo que no se pudo guardar se recuerda en memoria hasta recargar', () => {
    blockWrites();
    blockReads();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    writeStorage(KEY, 'answered');
    expect(readStorage(KEY)).toBe('answered');
  });

  it('si solo falla escribir, leer encuentra lo de la memoria', () => {
    blockWrites();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    writeStorage(KEY, 'answered');
    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(readStorage(KEY)).toBe('answered');
  });

  it('si ni siquiera se puede tocar localStorage, se recuerda en memoria y se avisa una vez', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(readStorage(KEY)).toBeNull();
    expect(() => {
      writeStorage(KEY, 'done');
    }).not.toThrow();
    expect(readStorage(KEY)).toBe('done');
    expect(warn).toHaveBeenCalledWith(
      '[storage] localStorage is not available',
      expect.any(DOMException),
    );
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
