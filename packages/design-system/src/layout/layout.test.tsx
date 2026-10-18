import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '#test-support/axe';
import { describe, expect, it } from 'vitest';
import { Inline, Stack } from '#layout';

describe.each([
  ['Stack', Stack],
  ['Inline', Inline],
])('%s', (_name, Layout) => {
  it('renders its children in order', () => {
    render(
      <Layout gap={3}>
        <span>first</span>
        <span>second</span>
      </Layout>,
    );
    const first = screen.getByText('first');
    const second = screen.getByText('second');
    expect(first.compareDocumentPosition(second)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('becomes a labelled region when rendered as a section', async () => {
    const { container } = render(
      <Layout as="section" aria-labelledby="heading">
        <h2 id="heading">Chart</h2>
      </Layout>,
    );
    expect(screen.getByRole('region', { name: 'Chart' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('is a plain div by default, with no role of its own', () => {
    render(
      <Layout>
        <span>content</span>
      </Layout>,
    );
    expect(screen.getByText('content').parentElement?.tagName).toBe('DIV');
  });

  it('forwards a ref to the element', () => {
    let element: HTMLElement | null = null;
    render(
      <Layout
        ref={(node) => {
          element = node;
        }}
      >
        <span>content</span>
      </Layout>,
    );
    expect(element).toBe(screen.getByText('content').parentElement);
  });
});
