import { describe, expect, it } from 'vitest';

import { stageFocusScroll } from './stageFocus';

describe('stageFocusScroll', () => {
  const base = { landingY: 10_000, bar: 64, end: 0, viewport: 720, margin: 6 };

  it('lo que cabe con el escenario pegado: al final de la llegada, con el marcador bajo la barra', () => {
    expect(stageFocusScroll({ ...base, offset: 100, height: 44 })).toBe(9936);
  });

  it('lo que cabe justo (su anillo y la seguridad tocan el borde): se queda en el marcador', () => {
    // 64 + 604 + 44 + 6 + 2 = 720: ni un píxel de más.
    expect(stageFocusScroll({ ...base, offset: 604, height: 44 })).toBe(9936);
    expect(stageFocusScroll({ ...base, offset: 605, height: 44 })).toBe(9937);
  });

  it('lo que cae por debajo de la ventana: lo justo más allá, para que quepa entero con su anillo', () => {
    // Abajo del escenario (a 700 px de su borde): 64 + 700 + 44 + 6 + 2 − 720 = 96 px pasado el final de la llegada.
    expect(stageFocusScroll({ ...base, offset: 700, height: 44 })).toBe(10_032);
  });

  it('deja el aire de abajo (`scroll-padding-block-end`: el del sitio, o el del aviso «Copied»)', () => {
    expect(stageFocusScroll({ ...base, end: 48, offset: 700, height: 44 })).toBe(10_080);
    expect(stageFocusScroll({ ...base, end: 48, offset: 100, height: 44 })).toBe(9936);
  });

  it('en píxeles enteros, redondeando hacia abajo de la página (un scroll con decimales se queda corto)', () => {
    expect(stageFocusScroll({ ...base, landingY: 10_000.2, offset: 700, height: 44 })).toBe(10_033);
  });
});
