import { describe, expect, it } from 'vitest';

import { stageFocusScroll } from './stageFocus';

describe('stageFocusScroll', () => {
  const base = { landingY: 10_000, bar: 64, viewport: 720, margin: 6 };

  it('lo que cabe con el escenario pegado: al final de la llegada, con el marcador bajo la barra', () => {
    expect(stageFocusScroll({ ...base, offset: 100, height: 44 })).toBe(10_000 - 64);
  });

  it('lo que cae por debajo de la ventana: lo justo más allá, para que quepa entero con su anillo', () => {
    // Abajo del escenario (a 700 px de su borde): 64 + 700 + 44 + 6 + 2 − 720 = 96 px pasado el final de la llegada.
    expect(stageFocusScroll({ ...base, offset: 700, height: 44 })).toBe(10_000 - 64 + 96);
  });

  it('en píxeles enteros, redondeando hacia abajo de la página (un scroll con decimales se queda corto)', () => {
    expect(stageFocusScroll({ ...base, landingY: 10_000.2, offset: 700, height: 44 })).toBe(
      Math.ceil(10_000.2 - 64 + 96),
    );
  });
});
