import { afterEach, describe, expect, it, vi } from 'vitest';

import { readStorage, writeStorage } from './storage';

const KEY = 'cosmos.test';

afterEach(() => {
  // Primero se quitan los espías: con el de `localStorage` puesto, ni siquiera se podría limpiar.
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('storage', () => {
  it('guarda y lee un valor', () => {
    expect(readStorage(KEY)).toBeNull();
    writeStorage(KEY, 'done');
    expect(readStorage(KEY)).toBe('done');
  });

  it('si leer lanza (datos del sitio bloqueados), responde null y lo avisa con la clave', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(readStorage(KEY)).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      `[storage] Could not read "${KEY}"`,
      expect.any(DOMException),
    );
  });

  it('si escribir lanza (cuota, ventana privada), no rompe y lo avisa sin el valor', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
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

  it('si ni siquiera se puede tocar localStorage, se sigue sin recordar nada', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(readStorage(KEY)).toBeNull();
    expect(() => {
      writeStorage(KEY, 'done');
    }).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      '[storage] localStorage is not available',
      expect.any(DOMException),
    );
  });
});
