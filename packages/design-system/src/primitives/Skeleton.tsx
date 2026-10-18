import styles from './Skeleton.module.scss';
import { Surface } from './Surface';

export type SkeletonProps =
  | {
      /** The chart card: caption, axes, 12 empty bar slots and the legend. */
      variant: 'chart';
    }
  | {
      /** The table card: a header row and `rows` body rows. */
      variant: 'table';
      /** Number of body rows; defaults to 4. */
      rows?: number;
    };

const MONTHS = 12;
const Y_LABELS = 5;

function repeat(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}

function ChartSkeleton() {
  return (
    <Surface padding="card">
      <div className={styles.chartStack}>
        <div className={styles.caption} />
        <div className={styles.plot}>
          <div className={styles.yAxis}>
            {repeat(Y_LABELS).map((line) => (
              <div
                key={`y-${String(line)}`}
                className={styles.yLabel}
                data-slot="y-label"
              />
            ))}
          </div>
          <div className={styles.grid}>
            {repeat(Y_LABELS).map((line) => (
              <div key={`grid-${String(line)}`} className={styles.gridLine} />
            ))}
          </div>
          <div className={styles.bars}>
            {repeat(MONTHS).map((month) => (
              <div
                key={`bar-${String(month)}`}
                className={styles.bar}
                data-slot="bar"
              />
            ))}
          </div>
          <div className={styles.xLabels}>
            {repeat(MONTHS).map((month) => (
              <div
                key={`x-${String(month)}`}
                className={styles.xLabel}
                data-slot="x-label"
              />
            ))}
          </div>
        </div>
        <div className={styles.legend}>
          {repeat(3).map((item) => (
            <div key={`legend-${String(item)}`} className={styles.legendItem} />
          ))}
        </div>
      </div>
    </Surface>
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  const cells = (
    <>
      <div className={styles.nameCell} />
      {repeat(MONTHS).map((month) => (
        <div key={`cell-${String(month)}`} className={styles.monthCell} />
      ))}
    </>
  );
  return (
    <Surface>
      <div className={styles.table}>
        <div className={styles.headerRow} data-slot="header-row">
          <div className={styles.nameCell} />
          {repeat(MONTHS).map((month) => (
            <div key={`head-${String(month)}`} className={styles.monthCell} />
          ))}
        </div>
        {repeat(rows).map((row) => (
          <div
            key={`row-${String(row)}`}
            className={styles.row}
            data-slot="row"
          >
            {cells}
          </div>
        ))}
      </div>
    </Surface>
  );
}

/**
 * Placeholder for the loaded page, with the same cards and sizes so nothing
 * moves when data arrives. Hidden from assistive technology: announce the
 * loading state with a separate status message. It fades in after 150ms, so a
 * fast response never shows it, and does not animate under reduced motion.
 */
export function Skeleton(props: SkeletonProps) {
  return (
    <div className={styles.fade} aria-hidden="true">
      {props.variant === 'chart' ? (
        <ChartSkeleton />
      ) : (
        <TableSkeleton rows={props.rows ?? 4} />
      )}
    </div>
  );
}
