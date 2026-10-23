import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HoldButton } from './HoldButton';

function setup(
  done = false,
  className?: string,
): {
  button: HTMLElement;
  onPress: ReturnType<typeof vi.fn>;
  onRelease: ReturnType<typeof vi.fn>;
} {
  const onPress = vi.fn();
  const onRelease = vi.fn();
  render(
    <HoldButton
      label="Hold to detonate"
      description="Hold to trigger the Big Bang and start the journey"
      done={done}
      onPress={onPress}
      onRelease={onRelease}
      className={className}
    />,
  );
  return { button: screen.getByRole('button'), onPress, onRelease };
}

describe('HoldButton', () => {
  it('its name is the visible label and the explanation is its description', () => {
    const { button } = setup();
    expect(button).toHaveAccessibleName('Hold to detonate');
    expect(button).toHaveAccessibleDescription(
      'Hold to trigger the Big Bang and start the journey',
    );
    expect(button).not.toHaveAttribute('aria-disabled');
  });

  it('the description is hidden from view and from browse mode (no second reading)', () => {
    const { button } = setup();
    const id = button.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(id)).toHaveAttribute('hidden');
    expect(
      screen.queryByText('Hold to trigger the Big Bang and start the journey'),
    ).not.toBeVisible();
  });

  it('takes an extra class from its owner', () => {
    const { button } = setup(false, 'wide');
    expect(button).toHaveClass('wide');
  });

  it('primary pointer down presses; up, leave and cancel release', () => {
    const { button, onPress, onRelease } = setup();
    fireEvent.pointerDown(button, { button: 2 });
    expect(onPress).not.toHaveBeenCalled();
    fireEvent.pointerDown(button, { button: 0 });
    expect(onPress).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(button);
    fireEvent.pointerLeave(button);
    fireEvent.pointerCancel(button);
    expect(onRelease).toHaveBeenCalledTimes(3);
  });

  it.each([' ', 'Enter'])('holding the %j key presses once and releases on key up', (key) => {
    const { button, onPress, onRelease } = setup();
    fireEvent.keyDown(button, { key });
    fireEvent.keyDown(button, { key, repeat: true });
    expect(onPress).toHaveBeenCalledTimes(1);
    fireEvent.keyUp(button, { key });
    expect(onRelease).toHaveBeenCalledTimes(1);
  });

  it('other keys do nothing; losing focus releases', () => {
    const { button, onPress, onRelease } = setup();
    fireEvent.keyDown(button, { key: 'a' });
    fireEvent.keyUp(button, { key: 'a' });
    expect(onPress).not.toHaveBeenCalled();
    expect(onRelease).not.toHaveBeenCalled();
    fireEvent.blur(button);
    expect(onRelease).toHaveBeenCalledTimes(1);
  });

  it('blocks the context menu (long press on touch)', () => {
    const { button } = setup();
    expect(fireEvent.contextMenu(button)).toBe(false);
  });

  it('done: aria-disabled but still focusable', () => {
    const { button } = setup(true);
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
  });
});
