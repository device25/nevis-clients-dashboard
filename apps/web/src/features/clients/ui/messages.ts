import type { DataError } from '@nevis/data';

/** What the user reads for each way the request can fail (D17). */
const MESSAGES = {
  network: "Can't reach the server. Check your connection and try again.",
  http: 'The server ran into a problem. Try again.',
  'invalid-response': "We received data we couldn't read.",
} satisfies Record<Exclude<DataError['kind'], 'aborted'>, string>;

/** A cancelled request has no message: nothing is shown for it (D24). */
export function dataErrorMessage(kind: keyof typeof MESSAGES): string {
  return MESSAGES[kind];
}
