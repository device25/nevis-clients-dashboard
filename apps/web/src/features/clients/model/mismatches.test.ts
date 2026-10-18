import { describe, expect, it } from 'vitest';
import { ANNA, BRANCH_1, BRANCH_2, COMPANY } from './fixture';
import { describeMismatch, findMismatches, getMismatch } from './mismatches';

const SEVEN = [
  ['Company', 3, 'May 2024', 301, 279],
  ['Branch 1', 6, 'Aug 2024', 214, 216],
  ['Anna Blackwood', 3, 'May 2024', 31, 30],
  ['Anna Blackwood', 4, 'Jun 2024', 32, 33],
  ['Anna Blackwood', 5, 'Jul 2024', 34, 35],
  ['Anna Blackwood', 6, 'Aug 2024', 38, 36],
  ['Anna Blackwood', 7, 'Sep 2024', 27, 28],
];

describe('findMismatches', () => {
  it('returns exactly the seven entries of D2, in order', () => {
    expect(
      findMismatches(COMPANY).map((m) => [
        m.nodeName,
        m.monthIndex,
        m.monthLabel,
        m.reported,
        m.childrenTotal,
      ]),
    ).toEqual(SEVEN);
  });

  it('carries the id of the node each entry belongs to', () => {
    expect(findMismatches(COMPANY).map((m) => m.nodeId)).toEqual([
      COMPANY.id,
      BRANCH_1.id,
      ANNA.id,
      ANNA.id,
      ANNA.id,
      ANNA.id,
      ANNA.id,
    ]);
  });

  it('finds nothing in a leaf', () => {
    expect(findMismatches(BRANCH_2)).toEqual([]);
  });

  it('finds only the entries inside the subtree it is given', () => {
    expect(findMismatches(ANNA)).toHaveLength(5);
  });
});

describe('getMismatch', () => {
  const all = findMismatches(COMPANY);

  it('finds the mismatch of a node in a month', () => {
    expect(getMismatch(all, COMPANY.id, 3)).toMatchObject({
      reported: 301,
      childrenTotal: 279,
    });
  });

  it('returns nothing for a month or a node that adds up', () => {
    expect(getMismatch(all, COMPANY.id, 4)).toBeUndefined();
    expect(getMismatch(all, BRANCH_2.id, 3)).toBeUndefined();
  });
});

describe('describeMismatch', () => {
  it('words the description as the accessibility spec does', () => {
    const [company, branch] = findMismatches(COMPANY);
    expect(company && describeMismatch(company)).toBe(
      'Reported 301, children add up to 279.',
    );
    expect(branch && describeMismatch(branch)).toBe(
      'Reported 214, children add up to 216.',
    );
  });
});
