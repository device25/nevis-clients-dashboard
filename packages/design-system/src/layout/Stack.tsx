import type { ComponentPropsWithRef, ElementType } from 'react';
import { cx, type Gap } from '#tokens';
import gapStyles from './gap.module.scss';
import styles from './Stack.module.scss';

export interface StackProps extends Omit<
  ComponentPropsWithRef<'section'>,
  'className' | 'style'
> {
  /** Element to render; a landmark needs `section` plus `aria-labelledby`. */
  as?: 'div' | 'section' | 'header' | 'footer' | 'main' | 'article';
  /** Space between children, as a step of the spacing tokens. */
  gap?: Gap;
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** `page` is the padding of the page's content column. */
  padding?: 'page';
}

const ALIGN = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
  stretch: styles.alignStretch,
} as const;

/** Vertical flex layout. */
export function Stack({
  as = 'div',
  gap,
  align,
  padding,
  children,
  ...rest
}: StackProps) {
  // A union of tags cannot share one ref type; the props are typed above.
  const Tag = as as ElementType;
  return (
    <Tag
      {...rest}
      className={cx(
        styles.stack,
        gap !== undefined && gapStyles[`gap${String(gap)}`],
        align !== undefined && ALIGN[align],
        padding === 'page' && styles.paddingPage,
      )}
    >
      {children}
    </Tag>
  );
}
