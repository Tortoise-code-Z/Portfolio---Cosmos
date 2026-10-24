import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COPY_FEEDBACK_MS, CopyButton } from './CopyButton';

const EMAIL = 'hello@example.com';

function setup(path = '/'): HTMLElement {
  render(
    <MemoryRouter initialEntries={[path]}>
      <span id="email">{EMAIL}</span>
      <CopyButton text={EMAIL} targetId="email" subject="email" />
    </MemoryRouter>,
  );
  return screen.getByRole('button');
}

function mockClipboard(writeText: (text: string) => Promise<void>): ReturnType<typeof vi.fn> {
  const spy = vi.fn(writeText);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: spy }, configurable: true });
  return spy;
}

/** Deja correr las promesas pendientes (el `then` del portapapeles) dentro de `act`. */
async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

const status = (): string | null => screen.getByRole('status').textContent;
const selected = (): string => window.getSelection()?.toString() ?? '';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  window.getSelection()?.removeAllRanges();
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('CopyButton', () => {
  it('says what it copies to the screen reader and starts with nothing announced', () => {
    mockClipboard(() => Promise.resolve());
    expect(setup()).toHaveAccessibleName('Copy email');
    expect(status()).toBe('');
  });

  it('copies the text, shows and announces «Copied», and goes back to «Copy» after 1.8 s', async () => {
    const writeText = mockClipboard(() => Promise.resolve());
    const button = setup();
    fireEvent.click(button);
    await flush();
    expect(writeText).toHaveBeenCalledWith(EMAIL);
    expect(button).toHaveAccessibleName('Copied');
    expect(status()).toBe('Copied');

    act(() => {
      vi.advanceTimersByTime(COPY_FEEDBACK_MS - 1);
    });
    expect(button).toHaveAccessibleName('Copied');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(button).toHaveAccessibleName('Copy email');
    expect(status()).toBe('');
  });

  it('a second copy restarts the 1.8 s', async () => {
    mockClipboard(() => Promise.resolve());
    const button = setup();
    fireEvent.click(button);
    await flush();
    act(() => {
      vi.advanceTimersByTime(COPY_FEEDBACK_MS - 100);
    });
    fireEvent.click(button);
    await flush();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(button).toHaveAccessibleName('Copied');
  });

  it('if the clipboard refuses, selects the text by hand, says so and logs why', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockClipboard(() => Promise.reject(new DOMException('denied', 'NotAllowedError')));
    const button = setup();
    fireEvent.click(button);
    await flush();
    expect(selected()).toBe(EMAIL);
    expect(button).toHaveAccessibleName('Select and copy it');
    expect(status()).toBe('Select and copy it');
    expect(warn).toHaveBeenCalledWith(
      '[copy] Clipboard write was rejected',
      expect.any(DOMException),
    );
  });

  it('without a clipboard (http, old browser), selects the text by hand', () => {
    const button = setup();
    fireEvent.click(button);
    expect(selected()).toBe(EMAIL);
    expect(button).toHaveAccessibleName('Select and copy it');
  });

  it('speaks the page language', async () => {
    mockClipboard(() => Promise.resolve());
    const button = setup('/es');
    expect(button).toHaveAccessibleName('Copiar email');
    fireEvent.click(button);
    await flush();
    expect(status()).toBe('Copiado');
  });

  it('does nothing after unmounting (a late answer from the clipboard does not set a timer)', async () => {
    let resolve: () => void = () => undefined;
    mockClipboard(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const { unmount } = render(
      <MemoryRouter>
        <CopyButton text={EMAIL} targetId="email" subject="email" />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button'));
    unmount();
    resolve();
    await flush();
    expect(vi.getTimerCount()).toBe(0);
  });
});
