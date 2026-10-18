/** What React tells us about where an error happened. */
export interface ErrorContext {
  readonly componentStack?: string | null | undefined;
}

/**
 * The single place errors are reported (D17): React's root callbacks call it,
 * boundaries never log. A real product would send the error to a service
 * here; the console is the whole destination for now.
 */
export function reportError(error: unknown, context: ErrorContext): void {
  console.error('Unhandled error', error, context.componentStack ?? '');
}
