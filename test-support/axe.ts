import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Fails the test when axe-core finds a violation inside `container`.
 *
 * `color-contrast` is off because jsdom does no layout or painting, so the rule
 * cannot compute colours; contrast is a design-token concern checked by hand.
 */
export async function expectNoAxeViolations(container: Element): Promise<void> {
  const { violations } = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  const summary = violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} (${violation.nodes
        .map((node) => node.target.join(' '))
        .join(', ')})`,
  );
  expect(summary).toEqual([]);
}
