import type { ComponentPropsWithRef, ElementType } from 'react';
import styles from './VisuallyHidden.module.scss';

export interface VisuallyHiddenProps extends Omit<
  ComponentPropsWithRef<'span'>,
  'className' | 'style'
> {
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * Content that is not painted but stays in the accessibility tree: hidden
 * headings, live regions and descriptions referenced by `aria-describedby`.
 */
export function VisuallyHidden({
  as = 'span',
  children,
  ...rest
}: VisuallyHiddenProps) {
  // A union of tags cannot share one ref type; the props are typed above.
  const Tag = as as ElementType;
  return (
    <Tag {...rest} className={styles.hidden}>
      {children}
    </Tag>
  );
}
