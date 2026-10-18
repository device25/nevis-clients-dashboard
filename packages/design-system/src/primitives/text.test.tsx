import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { expectNoAxeViolations } from '#test-support/axe';
import { describe, expect, it } from 'vitest';
import { Heading, Surface, Text, VisuallyHidden } from '#primitives';

describe('Heading', () => {
  it.each([1, 2, 3, 4] as const)('renders level %i', (level) => {
    render(<Heading level={level}>Clients</Heading>);
    expect(
      screen.getByRole('heading', { name: 'Clients', level }),
    ).toBeInTheDocument();
  });

  it('can take focus programmatically through tabIndex and ref', () => {
    const ref = createRef<HTMLHeadingElement>();
    render(
      <Heading level={1} tabIndex={-1} ref={ref}>
        Clients
      </Heading>,
    );
    ref.current?.focus();
    expect(screen.getByRole('heading', { name: 'Clients' })).toHaveFocus();
  });
});

describe('Text', () => {
  it('is a paragraph with an id other elements can reference', () => {
    render(
      <>
        <Text id="note">Reported 301, children add up to 279.</Text>
        <button aria-describedby="note">Open</button>
      </>,
    );
    expect(screen.getByRole('button')).toHaveAccessibleDescription(
      'Reported 301, children add up to 279.',
    );
  });

  it('renders as a span inside running text', () => {
    render(
      <Text variant="footnote" tone="secondary">
        Company ›{' '}
        <Text as="span" tone="primary">
          Branch 1
        </Text>
      </Text>,
    );
    expect(screen.getByText('Branch 1').tagName).toBe('SPAN');
  });
});

describe('Surface', () => {
  it('is a labelled region when rendered as a section', async () => {
    const { container } = render(
      <Surface as="section" aria-labelledby="h">
        <VisuallyHidden as="h2" id="h">
          Table
        </VisuallyHidden>
      </Surface>,
    );
    expect(screen.getByRole('region', { name: 'Table' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('VisuallyHidden', () => {
  it('stays in the accessibility tree as a heading', () => {
    render(
      <VisuallyHidden as="h2" id="chart-heading">
        Chart
      </VisuallyHidden>,
    );
    expect(
      screen.getByRole('heading', { name: 'Chart', level: 2 }),
    ).toBeInTheDocument();
  });

  it('can be a status message', () => {
    render(<VisuallyHidden role="status">Loading clients</VisuallyHidden>);
    expect(screen.getByRole('status')).toHaveTextContent('Loading clients');
  });
});
