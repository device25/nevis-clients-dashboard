import { expect, it } from 'vitest';

it('runs the contract project in a node environment', () => {
  expect(globalThis).not.toHaveProperty('document');
});
