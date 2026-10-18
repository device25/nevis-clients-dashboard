import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from './app';

const payload: unknown = JSON.parse(
  readFileSync(new URL('./data/clients.json', import.meta.url), 'utf8'),
);

afterEach(() => {
  vi.useRealTimers();
});

describe('GET /api/clients', () => {
  it('returns the payload unchanged as JSON', async () => {
    const response = await buildApp().inject('/api/clients');
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.json()).toEqual(payload);
  });

  it('answers 500 with the exact error body when failing', async () => {
    const response = await buildApp({ fail: true }).inject('/api/clients');
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ error: 'Internal Server Error' });
  });

  it('waits for the configured delay', async () => {
    // Only setTimeout is faked: inject itself relies on setImmediate.
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    let settled = false;
    const pending = buildApp({ delayMs: 1500 })
      .inject('/api/clients')
      .then((response) => {
        settled = true;
        return response;
      });

    await vi.advanceTimersByTimeAsync(1499);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect((await pending).statusCode).toBe(200);
  });
});

describe('unknown routes', () => {
  it('answer 404 with a JSON body', async () => {
    const response = await buildApp().inject('/api/nothing');
    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.json()).toEqual({ error: 'Not Found' });
  });
});
