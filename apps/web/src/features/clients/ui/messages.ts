import type { DataError } from '@nevis/data';

type Kind = DataError['kind'];

/** What the user reads for each way the request can fail (D17). */
const MESSAGES: Record<Exclude<Kind, 'aborted'>, string> = {
  network: "Can't reach the server. Check your connection and try again.",
  http: 'The server ran into a problem. Try again.',
  'invalid-response': "We received data we couldn't read.",
};

/**
 * A cancelled request is retried without a message. When it keeps being
 * cancelled the user still needs a way out, and from their side the server
 * cannot be reached, so it gets the connection message.
 */
export function dataErrorMessage(kind: Kind): string {
  return kind === 'aborted' ? MESSAGES.network : MESSAGES[kind];
}
