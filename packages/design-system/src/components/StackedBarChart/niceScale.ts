const MULTIPLIERS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8] as const;
const INTERVALS = 4;

export interface NiceScale {
  step: number;
  /** The top of the axis: four steps. */
  max: number;
  /** Five tick values from 0 to `max`. */
  ticks: number[];
}

/**
 * Axis for a maximum value: the smallest whole-number step of the form
 * m x 10^k (m from a short list) whose four intervals reach the maximum.
 */
export function niceScale(maximum: number): NiceScale {
  // Non-finite input would never be reached by any step.
  const target = Number.isFinite(maximum) ? Math.max(0, maximum) : 0;
  for (let power = 1; ; power *= 10) {
    for (const multiplier of MULTIPLIERS) {
      const step = multiplier * power;
      if (Number.isInteger(step) && step * INTERVALS >= target) {
        return {
          step,
          max: step * INTERVALS,
          ticks: Array.from({ length: INTERVALS + 1 }, (_, i) => i * step),
        };
      }
    }
  }
}
