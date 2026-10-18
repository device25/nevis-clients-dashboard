import { describe, expect, it } from 'vitest';
import { clientsPayload } from '../fixtures/clients';
import { DataError } from '#transport';
import { toHierarchy, type HierarchyNode } from './index';

function flatten(node: HierarchyNode): HierarchyNode[] {
  return [node, ...node.children.flatMap(flatten)];
}

describe('toHierarchy', () => {
  const root = toHierarchy(clientsPayload);

  it('turns the payload into the 12-node tree, depth first in source order', () => {
    expect(
      flatten(root).map((node) => [node.level, node.kind, node.name]),
    ).toEqual([
      [1, 'company', 'Company'],
      [2, 'branch', 'Branch 1'],
      [3, 'adviser', 'Anna Blackwood'],
      [4, 'channel', 'Existing clients'],
      [4, 'channel', 'New organic'],
      [4, 'channel', 'New paid'],
      [3, 'adviser', 'James Walker'],
      [3, 'adviser', 'Maria Gutierrez'],
      [3, 'adviser', 'Robert Chen'],
      [3, 'adviser', 'Sarah Smith'],
      [2, 'branch', 'Branch 2'],
      [2, 'branch', 'Branch 3'],
    ]);
  });

  it('gives leaves an empty children array', () => {
    const leaves = flatten(root)
      .filter((node) => node.children.length === 0)
      .map((node) => node.name);

    expect(leaves).toEqual([
      'Existing clients',
      'New organic',
      'New paid',
      'James Walker',
      'Maria Gutierrez',
      'Robert Chen',
      'Sarah Smith',
      'Branch 2',
      'Branch 3',
    ]);
  });

  it('keeps ids and reported values exactly as given', () => {
    expect(root.id).toBe('d6e00056-dce4-4ef4-b034-d6467db6187d');
    expect(root.values).toEqual([
      250, 267, 284, 301, 317, 334, 350, 250, 250, 250, 250, 350,
    ]);
    const anna = root.children[0]?.children[0];
    expect(anna?.id).toBe('e3c4637b-2f21-4b7e-883e-b13ae1a6df6a');
    expect(anna?.values).toEqual([
      25, 26, 28, 31, 32, 34, 38, 27, 27, 27, 27, 38,
    ]);
  });

  it('rejects a tree deeper than the four known levels', () => {
    const values = clientsPayload.values;
    const tooDeep = {
      ...clientsPayload,
      branches: [
        {
          id: 'b',
          name: 'b',
          values,
          employees: [
            {
              id: 'e',
              name: 'e',
              values,
              channels: [
                {
                  id: 'c',
                  name: 'c',
                  values,
                  channels: [{ id: 'x', name: 'x', values }],
                },
              ],
            },
          ],
        },
      ],
    };

    expect(() => toHierarchy(tooDeep)).toThrow(DataError);
  });
});
