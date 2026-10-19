import { describe, expect, it } from 'vitest';
import {
  chartAccessibleName,
  SCOPE_NOTE,
  showsScopeNote,
  toChartModel,
} from './chart';
import { ANNA, BRANCH_1, BRANCH_2, BRANCH_3, COMPANY } from './fixture';

describe('toChartModel', () => {
  it('stacks one series per branch at Company scope', () => {
    const model = toChartModel(COMPANY, COMPANY.id);
    expect(model.scopePath).toEqual(['Company']);
    expect(model.grouping).toBe('By branch');
    expect(model.series).toEqual([
      {
        id: BRANCH_1.id,
        name: 'Branch 1',
        values: [147, 157, 166, 156, 188, 201, 214, 147, 147, 147, 147, 214],
        colorIndex: 0,
      },
      {
        id: BRANCH_2.id,
        name: 'Branch 2',
        values: [76, 80, 84, 87, 90, 92, 94, 75, 75, 75, 75, 91],
        colorIndex: 1,
      },
      {
        id: BRANCH_3.id,
        name: 'Branch 3',
        values: [27, 30, 34, 36, 39, 41, 42, 28, 28, 28, 28, 45],
        colorIndex: 2,
      },
    ]);
  });

  it('keeps the children total and the reported total apart at Company scope', () => {
    const model = toChartModel(COMPANY, COMPANY.id);
    expect(model.childTotals).toEqual([
      250, 267, 284, 279, 317, 334, 350, 250, 250, 250, 250, 350,
    ]);
    expect(model.reported[3]).toBe(301);
    expect(model.childTotals[3]).toBe(279);
  });

  it('stacks the five advisers at Branch 1 scope', () => {
    const model = toChartModel(COMPANY, BRANCH_1.id);
    expect(model.scopePath).toEqual(['Company', 'Branch 1']);
    expect(model.grouping).toBe('By adviser');
    expect(model.series.map((s) => s.name)).toEqual([
      'Anna Blackwood',
      'James Walker',
      'Maria Gutierrez',
      'Robert Chen',
      'Sarah Smith',
    ]);
    expect(model.series.map((s) => s.colorIndex)).toEqual([0, 1, 2, 3, 4]);
    expect(model.reported[6]).toBe(214);
    expect(model.childTotals[6]).toBe(216);
  });

  it('stacks the three channels at Anna Blackwood scope', () => {
    const model = toChartModel(COMPANY, ANNA.id);
    expect(model.scopePath).toEqual(['Company', 'Branch 1', 'Anna Blackwood']);
    expect(model.grouping).toBe('By acquisition channel');
    expect(model.series.map((s) => s.name)).toEqual([
      'Existing clients',
      'New organic',
      'New paid',
    ]);
    expect(model.series[2]?.values).toEqual([
      0, 0, 1, 1, 2, 1, 0, 2, 1, 1, 1, 2,
    ]);
    expect(model.childTotals).toEqual([
      25, 26, 28, 30, 33, 35, 36, 28, 27, 27, 27, 38,
    ]);
    expect(model.reported[3]).toBe(31);
  });

  it('shows a leaf as one series coloured as among its siblings', () => {
    const model = toChartModel(COMPANY, BRANCH_2.id);
    expect(model.scopePath).toEqual(['Company', 'Branch 2']);
    expect(model.grouping).toBe('Monthly total');
    expect(model.series).toEqual([
      {
        id: BRANCH_2.id,
        name: 'Branch 2',
        values: [76, 80, 84, 87, 90, 92, 94, 75, 75, 75, 75, 91],
        colorIndex: 1,
      },
    ]);
    expect(model.childTotals).toEqual([
      76, 80, 84, 87, 90, 92, 94, 75, 75, 75, 75, 91,
    ]);
    expect(model.reported).toEqual([
      76, 80, 84, 87, 90, 92, 94, 75, 75, 75, 75, 91,
    ]);
  });

  it('gives the path of a channel down to the channel', () => {
    const model = toChartModel(COMPANY, 'abbf873a-a0eb-46b8-b4cf-dc58e5f7a2d7');
    expect(model.scopePath).toEqual([
      'Company',
      'Branch 1',
      'Anna Blackwood',
      'New paid',
    ]);
    expect(model.grouping).toBe('Monthly total');
    expect(model.series[0]?.colorIndex).toBe(2);
  });

  it('tells a scope with children from a leaf', () => {
    expect(toChartModel(COMPANY, COMPANY.id).hasChildren).toBe(true);
    expect(toChartModel(COMPANY, ANNA.id).hasChildren).toBe(true);
    expect(toChartModel(COMPANY, BRANCH_2.id).hasChildren).toBe(false);
    expect(
      toChartModel(COMPANY, 'abbf873a-a0eb-46b8-b4cf-dc58e5f7a2d7').hasChildren,
    ).toBe(false);
  });

  it('falls back to the root scope for an unknown id', () => {
    expect(toChartModel(COMPANY, 'nobody')).toEqual(
      toChartModel(COMPANY, COMPANY.id),
    );
  });

  it('shows a root without children as one series', () => {
    const model = toChartModel(BRANCH_3, BRANCH_3.id);
    expect(model.grouping).toBe('Monthly total');
    expect(model.series.map((s) => [s.name, s.colorIndex])).toEqual([
      ['Branch 3', 0],
    ]);
  });
});

describe('chartAccessibleName', () => {
  it('names the Company chart exactly as the accessibility spec does', () => {
    expect(chartAccessibleName(toChartModel(COMPANY, COMPANY.id))).toBe(
      'Company, by branch, Feb 2024 to Jan 2025, between 250 and 350 a month.',
    );
  });

  it('names the scope path, the grouping and the range of the stack totals', () => {
    expect(chartAccessibleName(toChartModel(COMPANY, ANNA.id))).toBe(
      'Company › Branch 1 › Anna Blackwood, by acquisition channel, Feb 2024 to Jan 2025, between 25 and 38 a month.',
    );
  });

  it('names a leaf by its monthly total', () => {
    expect(chartAccessibleName(toChartModel(COMPANY, BRANCH_2.id))).toBe(
      'Company › Branch 2, monthly total, Feb 2024 to Jan 2025, between 75 and 94 a month.',
    );
  });
});

describe('SCOPE_NOTE', () => {
  it('is the text D3 specifies', () => {
    expect(SCOPE_NOTE).toBe(
      'Acquisition channels are recorded for one adviser only, so the company view is split by branch. Select Anna Blackwood to see the channel split.',
    );
  });
});

describe('showsScopeNote', () => {
  it('applies at Company scope only', () => {
    expect(showsScopeNote(COMPANY, COMPANY.id)).toBe(true);
    expect(showsScopeNote(COMPANY, BRANCH_1.id)).toBe(false);
    expect(showsScopeNote(COMPANY, ANNA.id)).toBe(false);
  });

  it('applies when an unknown id falls back to Company', () => {
    expect(showsScopeNote(COMPANY, 'nobody')).toBe(true);
  });
});
