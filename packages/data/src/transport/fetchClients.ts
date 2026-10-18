import { ClientNodeSchema, type RawClientNode } from '@nevis/contract';
import { DataError } from './DataError';

function isAbort(error: unknown, signal: AbortSignal): boolean {
  return (
    signal.aborted ||
    (error instanceof DOMException && error.name === 'AbortError')
  );
}

/**
 * Requests the client tree and validates it with the shared contract. Every
 * failure leaves as a `DataError` so callers never see a raw `TypeError` or
 * `ZodError`.
 */
export async function fetchClients(
  signal: AbortSignal,
  baseUrl = '',
): Promise<RawClientNode> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/clients`, {
      signal,
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (isAbort(error, signal)) {
      throw new DataError('aborted', { cause: error });
    }
    throw new DataError('network', { cause: error });
  }

  if (!response.ok) {
    throw new DataError('http', { status: response.status });
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    // The body can be cut short by an abort as well as by bad JSON.
    if (isAbort(error, signal)) {
      throw new DataError('aborted', { cause: error });
    }
    throw new DataError('invalid-response', { cause: error });
  }

  const parsed = ClientNodeSchema.safeParse(body);
  if (!parsed.success) {
    throw new DataError('invalid-response', { cause: parsed.error });
  }
  return parsed.data;
}
