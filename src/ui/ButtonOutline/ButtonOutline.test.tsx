import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ButtonOutline } from './ButtonOutline';

describe('ButtonOutline', () => {
  it('is a plain button (never submits) named by its text, and clicks call onClick', async () => {
    const onClick = vi.fn();
    render(<ButtonOutline onClick={onClick}>Back to the journey</ButtonOutline>);
    const button = screen.getByRole('button', { name: 'Back to the journey' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('takes a full name for a short visible label, what it opens, an id, a class and a ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <ButtonOutline
        onClick={vi.fn()}
        id="opener"
        aria-label="Quick mission"
        aria-haspopup="dialog"
        className="owner"
        ref={ref}
      >
        Quick
      </ButtonOutline>,
    );
    const button = screen.getByRole('button', { name: 'Quick mission' });
    expect(button).toHaveAttribute('id', 'opener');
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    expect(button).toHaveClass('owner');
    expect(ref.current).toBe(button);
  });
});
