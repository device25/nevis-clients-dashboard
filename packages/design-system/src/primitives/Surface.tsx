import type { ComponentPropsWithRef, ElementType } from 'react';
import { cx } from '#tokens';
import styles from './Surface.module.scss';

export interface SurfaceProps extends Omit<
  ComponentPropsWithRef<'section'>,
  'className' | 'style'
> {
  /** Element to render; a landmark needs `section` plus `aria-labelledby`. */
  as?: 'div' | 'section';
  /** `card` is the padding of a chart card; the default has none. */
  padding?: 'card';
}

/** A white card on the page background. */
export function Surface({
  as = 'div',
  padding,
  children,
  ...rest
}: SurfaceProps) {
  // A union of tags cannot share one ref type; the props are typed above.
  const Tag = as as ElementType;
  return (
    <Tag
      {...rest}
      className={cx(styles.surface, padding === 'card' && styles.paddingCard)}
    >
      {children}
    </Tag>
  );
}
