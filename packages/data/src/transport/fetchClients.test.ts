import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { clientsPayload } from '../fixtures/clients';
import { DataError, fetchClients } from './index';

// jsdom has no origin for Node's fetch, so tests use an absolute base URL.
const baseUrl = 'http://api.test';
const url = `${baseUrl}/api/clients`;

const server = setupServer();
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});

async function failureOf(promise: Promise<unknown>): Promise<DataError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof DataError) return error;
    throw error;
  }
  throw new Error('Expected the request to fail.');
}

describe('fetchClients', () => {
  it('resolves with the payload unchanged on 200', async () => {
    server.use(http.get(url, () => HttpResponse.json(clientsPayload)));

    const result = await fetchClients(new AbortController().signal, baseUrl);

    expect(result).toEqual(clientsPayload);
  });

  it('fails with kind network when the request cannot reach the server', async () => {
    server.use(http.get(url, () => HttpResponse.error()));

    const error = await failureOf(
      fetchClients(new AbortController().signal, baseUrl),
    );

    expect(error.kind).toBe('network');
    expect(error.status).toBeUndefined();
  });

  it('fails with kind http and the status on a 500', async () => {
    server.use(
      http.get(url, () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    const error = await failureOf(
      fetchClients(new AbortController().signal, baseUrl),
    );

    expect(error.kind).toBe('http');
    expect(error.status).toBe(500);
  });

  it('fails with kind invalid-response when the body is not JSON', async () => {
    server.use(http.get(url, () => HttpResponse.text('<html>oops</html>')));

    const error = await failureOf(
      fetchClients(new AbortController().signal, baseUrl),
    );

    expect(error.kind).toBe('invalid-response');
  });

  it('fails with kind invalid-response when the body fails the schema', async () => {
    server.use(
      http.get(url, () =>
        HttpResponse.json({ ...clientsPayload, values: [1, 2, 3] }),
      ),
    );

    const error = await failureOf(
      fetchClients(new AbortController().signal, baseUrl),
    );

    expect(error.kind).toBe('invalid-response');
  });

  it('fails with kind aborted when the signal is aborted mid-request', async () => {
    server.use(
      http.get(url, async () => {
        await delay(1000);
        return HttpResponse.json(clientsPayload);
      }),
    );
    const controller = new AbortController();

    const pending = failureOf(fetchClients(controller.signal, baseUrl));
    controller.abort();

    expect((await pending).kind).toBe('aborted');
  });
});

describe('DataError', () => {
  it('is an Error that carries its kind and status', () => {
    const error = new DataError('http', { status: 503 });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DataError);
    expect(error.name).toBe('DataError');
    expect(error.kind).toBe('http');
    expect(error.status).toBe(503);
  });
});
