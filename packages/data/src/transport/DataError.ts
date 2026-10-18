type DataErrorKind = 'network' | 'http' | 'invalid-response' | 'aborted';

/**
 * The only error the data package surfaces. Consumers tell failures apart by
 * `kind`; `status` is set for `http` only.
 */
export class DataError extends Error {
  readonly kind: DataErrorKind;
  readonly status?: number;

  constructor(kind: 'http', options: { status: number; cause?: unknown });
  constructor(
    kind: Exclude<DataErrorKind, 'http'>,
    options?: { cause?: unknown },
  );
  constructor(
    kind: DataErrorKind,
    options: { status?: number; cause?: unknown } = {},
  ) {
    super(
      options.status === undefined
        ? `Request failed: ${kind}`
        : `Request failed: ${kind} ${String(options.status)}`,
      { cause: options.cause },
    );
    this.name = 'DataError';
    this.kind = kind;
    if (options.status !== undefined) this.status = options.status;
  }
}
