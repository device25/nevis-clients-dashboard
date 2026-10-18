// Vitest provides the directory of the test file; the DOM typings do not know it.
interface ImportMeta {
  readonly dirname: string;
}
