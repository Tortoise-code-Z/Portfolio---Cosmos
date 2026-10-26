import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateShapes } from '../../shapes/generateShapes/generateShapes';
import type { ShapeRequest } from '../../shapes/shapeContract/shapeContract';
import { handleShapesRequest } from '../handleShapesRequest/handleShapesRequest';
import { loadShapes, SHAPES_WORKER_TIMEOUT_MS } from './loadShapes';

const request: ShapeRequest = { count: 6, seed: 9, plates: [20] };

/** Worker falso: guarda lo que se le manda y deja al test decidir qué responde y cuándo. */
class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  readonly sent: unknown[] = [];
  terminated = false;
  postMessage(message: unknown): void {
    this.sent.push(message);
  }
  terminate(): void {
    this.terminated = true;
  }
  /** Responde como el worker de verdad (o con lo que se le dé). */
  reply(data: unknown = handleShapesRequest(this.sent[0]).message): void {
    this.onmessage?.(new MessageEvent('message', { data }));
  }
}

let worker: FakeWorker;
const createWorker = (): Worker => worker as unknown as Worker;

beforeEach(() => {
  vi.useFakeTimers();
  worker = new FakeWorker();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('loadShapes', () => {
  it('sends the request, returns the shapes and closes the worker', async () => {
    const pending = loadShapes(request, { createWorker });
    expect(worker.sent).toEqual([request]);
    worker.reply();
    await expect(pending).resolves.toEqual({ ok: true, shapes: generateShapes(request) });
    expect(worker.terminated).toBe(true);
  });

  it('gives up after the deadline, closes the worker and ignores a late answer', async () => {
    const pending = loadShapes(request, { createWorker });
    vi.advanceTimersByTime(SHAPES_WORKER_TIMEOUT_MS - 1);
    expect(worker.terminated).toBe(false);
    vi.advanceTimersByTime(1);
    await expect(pending).resolves.toMatchObject({ ok: false, reason: 'timeout' });
    expect(worker.terminated).toBe(true);
    worker.reply();
    await expect(pending).resolves.toMatchObject({ ok: false, reason: 'timeout' });
  });

  it('a worker that cannot be created (no Worker in this browser) is «unavailable»', async () => {
    // jsdom no tiene `Worker`: el worker real no se puede crear.
    await expect(loadShapes(request)).resolves.toMatchObject({
      ok: false,
      reason: 'unavailable',
      detail: expect.stringMatching(/Worker/) as unknown,
    });
  });

  it('a worker that fails to load or throws is an «error», without an uncaught report', async () => {
    const pending = loadShapes(request, { createWorker });
    const event = new ErrorEvent('error', { message: 'Failed to fetch', cancelable: true });
    worker.onerror?.(event);
    await expect(pending).resolves.toEqual({
      ok: false,
      reason: 'error',
      detail: 'Failed to fetch',
    });
    expect(event.defaultPrevented).toBe(true);
    expect(worker.terminated).toBe(true);
  });

  it('an error without a message still says what happened', async () => {
    const pending = loadShapes(request, { createWorker });
    worker.onerror?.(new ErrorEvent('error', { cancelable: true }));
    await expect(pending).resolves.toMatchObject({
      reason: 'error',
      detail: expect.stringMatching(/worker/) as unknown,
    });
  });

  it('a response that cannot be deserialised is a «message-error»', async () => {
    const pending = loadShapes(request, { createWorker });
    worker.onmessageerror?.();
    await expect(pending).resolves.toMatchObject({ ok: false, reason: 'message-error' });
  });

  it('a rejection from the worker is «rejected», with its reason', async () => {
    const pending = loadShapes(request, { createWorker });
    worker.reply({ ok: false, reason: 'count must be…' });
    await expect(pending).resolves.toEqual({
      ok: false,
      reason: 'rejected',
      detail: 'count must be…',
    });
  });

  it('a response that does not validate is «invalid»', async () => {
    const pending = loadShapes(request, { createWorker });
    worker.reply({ ok: true, shapes: generateShapes({ ...request, count: 5 }) });
    await expect(pending).resolves.toMatchObject({ ok: false, reason: 'invalid' });
  });

  it('a postMessage that throws (the request cannot be cloned) is an «error»', async () => {
    worker.postMessage = () => {
      throw new DOMException('could not be cloned', 'DataCloneError');
    };
    await expect(loadShapes(request, { createWorker })).resolves.toMatchObject({
      reason: 'error',
      detail: 'DataCloneError: could not be cloned',
    });
    expect(worker.terminated).toBe(true);
  });

  it('cancelled (unmounted): closes the worker, stops the clock and ignores the answer', async () => {
    const controller = new AbortController();
    const pending = loadShapes(request, { createWorker, signal: controller.signal });
    controller.abort();
    await expect(pending).resolves.toMatchObject({ ok: false, reason: 'aborted' });
    expect(worker.terminated).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    worker.reply();
  });

  it('cancelled before starting: no worker at all', async () => {
    const controller = new AbortController();
    controller.abort();
    const create = vi.fn(createWorker);
    await expect(
      loadShapes(request, { createWorker: create, signal: controller.signal }),
    ).resolves.toMatchObject({ reason: 'aborted' });
    expect(create).not.toHaveBeenCalled();
  });

  it('a constructor that throws something that is not an Error still says what', async () => {
    await expect(
      loadShapes(request, {
        createWorker: () => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw 'blocked by CSP';
        },
      }),
    ).resolves.toEqual({ ok: false, reason: 'unavailable', detail: 'blocked by CSP' });
  });

  it('honours a custom deadline', async () => {
    const pending = loadShapes(request, { createWorker, timeoutMs: 50 });
    vi.advanceTimersByTime(50);
    await expect(pending).resolves.toMatchObject({
      reason: 'timeout',
      detail: 'no answer in 50 ms',
    });
  });
});
