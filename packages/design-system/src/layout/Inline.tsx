import type { ComponentPropsWithRef, ElementType } from 'react';
import { cx, type Gap } from '#tokens';
import gapStyles from './gap.module.scss';
import styles from './Inline.module.scss';

export interface InlineProps extends Omit<
  ComponentPropsWithRef<'section'>,
  'className' | 'style'
> {
  /** Element to render; a landmark needs `section` plus `aria-labelledby`. */
  as?: 'div' | 'section' | 'header' | 'footer' | 'ul' | 'ol';
  /** Space between children, as a step of the spacing tokens. */
  gap?: Gap;
  align?: 'start' | 'center' | 'end' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
}

const ALIGN = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
  baseline: styles.alignBaseline,
} as const;

const JUSTIFY = {
  start: styles.justifyStart,
  center: styles.justifyCenter,
  end: styles.justifyEnd,
  between: styles.justifyBetween,
} as const;

/** Horizontal flex layout. */
export function Inline({
  as = 'div',
  gap,
  align,
  justify,
  wrap = false,
  children,
  ...rest
}: InlineProps) {
  // A union of tags cannot share one ref type; the props are typed above.
  const Tag = as as ElementType;
  return (
    <Tag
      {...rest}
      className={cx(
        styles.inline,
        gap !== undefined && gapStyles[`gap${String(gap)}`],
        align !== undefined && ALIGN[align],
        justify !== undefined && JUSTIFY[justify],
        wrap && styles.wrap,
      )}
    >
      {children}
    </Tag>
  );
}
