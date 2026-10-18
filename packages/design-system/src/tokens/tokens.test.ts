import * as sass from 'sass';
import { describe, expect, it } from 'vitest';

// Vitest does not compile stylesheets itself, so compile the entry point here.
const stylesheet = sass.compile(`${import.meta.dirname}/global.scss`).css;

function declared(name: string): string | undefined {
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(stylesheet);
  return match?.[1]?.trim();
}

const family = "'Inter Variable', Inter, system-ui, sans-serif";

// Literal values copied from docs/DESIGN.md "Tokens", read from the compiled
// stylesheet.
const expected: Record<string, string> = {
  '--color-background-primary': '#F7F5ED',
  '--color-background-secondary': '#FFFFFF',
  '--color-content-primary': '#141413',
  '--color-content-secondary': 'rgb(20 20 19 / 60%)',
  '--color-line-dotted': 'rgb(20 20 19 / 16%)',
  '--color-line-solid': 'rgb(20 20 19 / 8%)',
  '--color-surface-hover': 'rgb(20 20 19 / 4%)',
  '--color-surface-selected': 'rgb(20 20 19 / 7%)',
  '--color-focus': '#3B5BDB',
  '--color-warning': '#C2410C',
  '--color-chart-1': '#B29DF8',
  '--color-chart-2': '#F4BEB4',
  '--color-chart-3': '#A75E6E',
  '--color-chart-4': '#7FC8B4',
  '--color-chart-5': '#4F6BB0',
  '--color-avatar-1': '#B29DF8',
  '--color-avatar-2': '#F4BEB4',
  '--color-avatar-3': '#7FC8B4',
  '--color-avatar-4': '#E9D48A',
  '--radius-card': '8px',
  '--radius-bar': '4px',
  '--radius-swatch': '2px',
  '--space-1': '4px',
  '--space-2': '8px',
  '--space-3': '12px',
  '--space-4': '16px',
  '--space-5': '24px',
  '--space-6': '32px',
  '--font-title': `400 35px/1.25 ${family}`,
  '--font-body': `400 14px/20px ${family}`,
  '--font-footnote': `400 12px/16px ${family}`,
};

describe('styles.css', () => {
  it.each(Object.entries(expected))('declares %s as %s', (name, value) => {
    expect(declared(name)?.toLowerCase()).toBe(value.toLowerCase());
  });

  it('uses the optical size axis, tabular numbers and the page background', () => {
    expect(stylesheet).toContain('font-optical-sizing: auto');
    expect(stylesheet).toContain(
      'font-variant-numeric: tabular-nums lining-nums',
    );
    expect(stylesheet).toContain('background: var(--color-background-primary)');
  });

  it('turns animation off under reduced motion', () => {
    expect(stylesheet).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });
});
