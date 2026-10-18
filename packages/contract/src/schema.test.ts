import { describe, expect, it } from 'vitest';
import { ClientNodeSchema, MONTHS } from './index';

const twelve = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

describe('ClientNodeSchema', () => {
  it('accepts a nested tree', () => {
    const result = ClientNodeSchema.safeParse({
      id: 'a',
      name: 'Company',
      values: twelve,
      branches: [{ id: 'b', name: 'Branch', values: twelve }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a node with 11 values', () => {
    const result = ClientNodeSchema.safeParse({
      id: 'a',
      name: 'Company',
      values: twelve.slice(0, 11),
    });
    expect(result.success).toBe(false);
  });

  it('rejects a negative value', () => {
    const result = ClientNodeSchema.safeParse({
      id: 'a',
      name: 'Company',
      values: [...twelve.slice(0, 11), -1],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid descendant', () => {
    const result = ClientNodeSchema.safeParse({
      id: 'a',
      name: 'Company',
      values: twelve,
      branches: [
        { id: 'b', name: 'Branch', values: [1.5, ...twelve.slice(1)] },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe('MONTHS', () => {
  it('runs from Feb 2024 to Jan 2025', () => {
    expect(MONTHS).toHaveLength(12);
    expect(MONTHS[0]).toEqual({ key: '2024-02', label: 'Feb 2024' });
    expect(MONTHS[11]).toEqual({ key: '2025-01', label: 'Jan 2025' });
  });
});
