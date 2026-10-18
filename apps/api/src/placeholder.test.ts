import { expect, it } from 'vitest';

it('runs the api project in a node environment', () => {
  expect(globalThis).not.toHaveProperty('document');
});
