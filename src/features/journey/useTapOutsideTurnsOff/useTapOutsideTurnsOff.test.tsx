import { fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useTapOutsideTurnsOff } from './useTapOutsideTurnsOff';

describe('useTapOutsideTurnsOff', () => {
  it('a click anywhere turns off, before the page handles it (capture), only while active', () => {
    const turnOff = vi.fn();
    const order: string[] = [];
    turnOff.mockImplementation(() => order.push('off'));
    const button = document.body.appendChild(document.createElement('button'));
    button.addEventListener('click', () => order.push('button'));
    const { rerender, unmount } = renderHook(
      ({ active }: { active: boolean }) => {
        useTapOutsideTurnsOff(active, turnOff);
      },
      { initialProps: { active: false } },
    );
    fireEvent.click(document.body);
    expect(turnOff).not.toHaveBeenCalled();
    rerender({ active: true });
    fireEvent.click(button);
    expect(order).toEqual(['off', 'button']);
    rerender({ active: false });
    fireEvent.click(document.body);
    expect(turnOff).toHaveBeenCalledTimes(1);
    rerender({ active: true });
    unmount();
    fireEvent.click(document.body);
    expect(turnOff).toHaveBeenCalledTimes(1);
    button.remove();
  });

  it('a swipe (no click) does not turn off', () => {
    const turnOff = vi.fn();
    renderHook(() => {
      useTapOutsideTurnsOff(true, turnOff);
    });
    fireEvent.pointerDown(document.body, { pointerType: 'touch' });
    fireEvent.pointerMove(document.body, { pointerType: 'touch' });
    fireEvent.pointerUp(document.body, { pointerType: 'touch' });
    fireEvent.scroll(window);
    expect(turnOff).not.toHaveBeenCalled();
  });
});
