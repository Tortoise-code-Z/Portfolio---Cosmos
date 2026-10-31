import { describe, expect, it } from 'vitest';

import { GRAVITY } from '../../config/sceneConfig';
import { createScenePointer } from '../../pointer/pointer';
import { createGravity, followGravity } from './gravity';

const mouseAt = (x: number, y: number): ReturnType<typeof createScenePointer> => ({
  x,
  y,
  inside: true,
});

describe('createGravity', () => {
  it('starts off', () => {
    expect(createGravity()).toEqual({ strength: 0, x: 0, y: 0 });
  });
});

describe('followGravity', () => {
  it('with the mouse inside, it goes where the mouse is and builds up smoothly', () => {
    const gravity = createGravity();
    followGravity(gravity, mouseAt(0.4, -0.2), true, 0.05);
    expect(gravity.x).toBe(0.4);
    expect(gravity.y).toBe(-0.2);
    expect(gravity.strength).toBeCloseTo(0.05 * GRAVITY.rate, 10);
    for (let frame = 0; frame < 30; frame += 1)
      followGravity(gravity, mouseAt(0.4, -0.2), true, 0.05);
    expect(gravity.strength).toBe(1);
  });

  it('is nearly full in about a quarter of a second', () => {
    const gravity = createGravity();
    for (let frame = 0; frame < 15; frame += 1) followGravity(gravity, mouseAt(0, 0), true, 1 / 60);
    expect(gravity.strength).toBeGreaterThan(0.9);
  });

  it('when the mouse leaves, it fades out where it was, without jumping', () => {
    const gravity = createGravity();
    for (let frame = 0; frame < 30; frame += 1)
      followGravity(gravity, mouseAt(-0.6, 0.3), true, 0.05);
    const away = { ...createScenePointer(), x: 0.9, y: 0.9 };
    followGravity(gravity, away, true, 0.05);
    expect(gravity.strength).toBeCloseTo(1 - 0.05 * GRAVITY.rate, 10);
    expect([gravity.x, gravity.y]).toEqual([-0.6, 0.3]);
    for (let frame = 0; frame < 30; frame += 1) followGravity(gravity, away, true, 0.05);
    expect(gravity.strength).toBe(0);
  });

  it('turned off (reduced motion) it is 0 at once, even with the mouse inside', () => {
    const gravity = createGravity();
    for (let frame = 0; frame < 30; frame += 1) followGravity(gravity, mouseAt(0, 0), true, 0.05);
    followGravity(gravity, mouseAt(0.2, 0.2), false, 0.05);
    expect(gravity.strength).toBe(0);
  });

  it('does not move without time', () => {
    const gravity = createGravity();
    followGravity(gravity, mouseAt(0.1, 0.1), true, 0);
    expect(gravity.strength).toBe(0);
    expect(gravity.x).toBe(0.1);
  });
});
