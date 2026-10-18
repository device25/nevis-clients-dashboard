import { SeededDataProvider, type SeededDataProviderProps } from '#provider';

/**
 * For consumers' tests, in place of `DataProvider`. With `tree`,
 * `useClientsTree()` returns it at once, without suspending or requesting. With
 * `error`, `useClientsTree()` throws it to the nearest error boundary.
 */
export function TestDataProvider(props: SeededDataProviderProps) {
  return <SeededDataProvider {...props} />;
}
