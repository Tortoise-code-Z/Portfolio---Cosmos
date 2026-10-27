import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  type BrowserSignals,
  chooseInitialLevel,
  FEW_CORES,
  isHandheld,
  LEVEL_SETTINGS,
  LOW_MEMORY_GB,
  NARROW_VIEWPORT_PX,
  nextLowerLevel,
  readBrowserSignals,
} from './sceneLevel';

/** Un escritorio potente: Alto. Cada test cambia una señal. */
const DESKTOP: BrowserSignals = {
  saveData: false,
  deviceMemory: 8,
  hardwareConcurrency: 8,
  coarsePointer: false,
  viewportWidth: 1440,
  softwareRendering: false,
};

describe('chooseInitialLevel', () => {
  it('picks high on a capable desktop', () => {
    expect(chooseInitialLevel(DESKTOP)).toBe('high');
  });

  it('picks low when painted by the CPU (WebGL2 only with a major performance caveat)', () => {
    expect(chooseInitialLevel({ ...DESKTOP, softwareRendering: true })).toBe('low');
  });

  it('picks low with save-data on, whatever the rest', () => {
    expect(chooseInitialLevel({ ...DESKTOP, saveData: true })).toBe('low');
  });

  it('picks low with little memory (the limit included)', () => {
    expect(chooseInitialLevel({ ...DESKTOP, deviceMemory: LOW_MEMORY_GB })).toBe('low');
    expect(chooseInitialLevel({ ...DESKTOP, deviceMemory: 0.5 })).toBe('low');
    expect(chooseInitialLevel({ ...DESKTOP, deviceMemory: 4 })).toBe('high');
  });

  it('picks low with a coarse pointer or a narrow window', () => {
    expect(chooseInitialLevel({ ...DESKTOP, coarsePointer: true })).toBe('low');
    expect(chooseInitialLevel({ ...DESKTOP, viewportWidth: NARROW_VIEWPORT_PX - 1 })).toBe('low');
    expect(chooseInitialLevel({ ...DESKTOP, viewportWidth: NARROW_VIEWPORT_PX })).toBe('high');
  });

  it('picks medium with few cores (the limit included)', () => {
    expect(chooseInitialLevel({ ...DESKTOP, hardwareConcurrency: FEW_CORES })).toBe('medium');
    expect(chooseInitialLevel({ ...DESKTOP, hardwareConcurrency: FEW_CORES + 1 })).toBe('high');
  });

  it('low wins over medium', () => {
    expect(chooseInitialLevel({ ...DESKTOP, hardwareConcurrency: 2, coarsePointer: true })).toBe(
      'low',
    );
  });

  it('a signal the browser does not give never lowers the level (Firefox, Safari)', () => {
    expect(
      chooseInitialLevel({
        ...DESKTOP,
        saveData: undefined,
        deviceMemory: undefined,
        hardwareConcurrency: undefined,
      }),
    ).toBe('high');
  });
});

describe('isHandheld', () => {
  it('a coarse pointer or a narrow window, the same line as the initial level', () => {
    expect(isHandheld(DESKTOP)).toBe(false);
    expect(isHandheld({ ...DESKTOP, coarsePointer: true })).toBe(true);
    expect(isHandheld({ ...DESKTOP, viewportWidth: NARROW_VIEWPORT_PX - 1 })).toBe(true);
    expect(isHandheld({ ...DESKTOP, viewportWidth: NARROW_VIEWPORT_PX })).toBe(false);
  });
});

describe('nextLowerLevel', () => {
  it('goes down one level at a time and stops at low (never off)', () => {
    expect(nextLowerLevel('high')).toBe('medium');
    expect(nextLowerLevel('medium')).toBe('low');
    expect(nextLowerLevel('low')).toBeNull();
  });
});

describe('LEVEL_SETTINGS', () => {
  it('matches the table in rendimiento.md and goes down level by level', () => {
    expect(LEVEL_SETTINGS).toEqual({
      high: { particles: 60_000, stars: 5_000, maxDpr: 2, extras: true },
      medium: { particles: 36_000, stars: 3_500, maxDpr: 1.5, extras: true },
      low: { particles: 20_000, stars: 2_000, maxDpr: 1, extras: false },
    });
  });
});

describe('readBrowserSignals', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function stubMatchMedia(coarse: boolean): void {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: coarse && query === '(pointer: coarse)',
        media: query,
      })),
    );
  }

  it('reads the Chromium-only signals when they exist', () => {
    stubMatchMedia(true);
    vi.stubGlobal('innerWidth', 390);
    vi.spyOn(navigator, 'hardwareConcurrency', 'get').mockReturnValue(6);
    Object.defineProperties(navigator, {
      connection: { configurable: true, value: { saveData: true } },
      deviceMemory: { configurable: true, value: 4 },
    });
    try {
      expect(readBrowserSignals({ softwareRendering: false })).toEqual({
        saveData: true,
        deviceMemory: 4,
        hardwareConcurrency: 6,
        coarsePointer: true,
        viewportWidth: 390,
        softwareRendering: false,
      });
    } finally {
      Reflect.deleteProperty(navigator, 'connection');
      Reflect.deleteProperty(navigator, 'deviceMemory');
    }
  });

  it('leaves out what the browser does not expose or gives malformed', () => {
    stubMatchMedia(false);
    vi.spyOn(navigator, 'hardwareConcurrency', 'get').mockReturnValue(0);
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 'lots' });
    try {
      expect(readBrowserSignals({ softwareRendering: false })).toMatchObject({
        saveData: undefined,
        deviceMemory: undefined,
        hardwareConcurrency: undefined,
        coarsePointer: false,
      });
    } finally {
      Reflect.deleteProperty(navigator, 'deviceMemory');
    }
  });

  it('passes on what the WebGL2 detection said about software rendering', () => {
    stubMatchMedia(false);
    expect(readBrowserSignals({ softwareRendering: true }).softwareRendering).toBe(true);
  });

  it('answers fine pointer without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(readBrowserSignals({ softwareRendering: false }).coarsePointer).toBe(false);
  });
});
