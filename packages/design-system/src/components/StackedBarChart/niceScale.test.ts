import { describe, expect, it } from 'vitest';
import { niceScale } from './niceScale';

describe('niceScale', () => {
  it.each([
    [350, 400, [0, 100, 200, 300, 400]],
    [216, 240, [0, 60, 120, 180, 240]],
    [45, 60, [0, 15, 30, 45, 60]],
    [38, 40, [0, 10, 20, 30, 40]],
    [0, 4, [0, 1, 2, 3, 4]],
  ])('maps a maximum of %i to %i', (maximum, top, ticks) => {
    const scale = niceScale(maximum);
    expect(scale.max).toBe(top);
    expect(scale.ticks).toEqual(ticks);
  });

  it('keeps the step an integer for small maxima', () => {
    // 1.5 and 2.5 are not integers at k = 0, so 5 needs a step of 2.
    expect(niceScale(5).ticks).toEqual([0, 2, 4, 6, 8]);
  });

  it('never returns a top below the maximum', () => {
    for (let maximum = 0; maximum <= 2000; maximum += 1) {
      expect(niceScale(maximum).max).toBeGreaterThanOrEqual(maximum);
    }
  });
});
