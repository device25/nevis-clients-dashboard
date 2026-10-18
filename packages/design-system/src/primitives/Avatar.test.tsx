import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '#test-support/axe';
import { describe, expect, it } from 'vitest';
import { Avatar } from '#primitives';

function background(container: HTMLElement): string {
  const avatar = container.firstElementChild;
  return avatar instanceof HTMLElement
    ? avatar.style.getPropertyValue('background-color')
    : '';
}

describe('Avatar', () => {
  it('shows the first and last initial of a full name', () => {
    render(<Avatar id="a" name="Anna Blackwood" />);
    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('shows the initial of a one-word name', () => {
    render(<Avatar id="a" name="Cher" />);
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('uses the first and last word of a longer name', () => {
    render(<Avatar id="a" name="maria de la Cruz" />);
    expect(screen.getByText('MC')).toBeInTheDocument();
  });

  it('keeps the same colour for the same id and uses all four tokens', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
    const colours = ids.map((id) => {
      const { container, unmount } = render(<Avatar id={id} name="Test" />);
      const first = background(container);
      unmount();
      const again = render(<Avatar id={id} name="Other Name" />);
      expect(background(again.container)).toBe(first);
      again.unmount();
      return first;
    });
    expect(new Set(colours)).toEqual(
      new Set([1, 2, 3, 4].map((n) => `var(--color-avatar-${String(n)})`)),
    );
  });

  it('is decorative: the name next to it is the accessible name', async () => {
    const { container } = render(
      <p>
        <Avatar id="a" name="Anna Blackwood" /> Anna Blackwood
      </p>,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent(
      'AB',
    );
    await expectNoAxeViolations(container);
  });
});
