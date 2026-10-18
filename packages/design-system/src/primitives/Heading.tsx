import type { ComponentPropsWithRef, ElementType } from 'react';
import { cx } from '#tokens';
import styles from './Heading.module.scss';

export interface HeadingProps extends Omit<
  ComponentPropsWithRef<'h1'>,
  'className' | 'style'
> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Visual style, independent of the level. Defaults to `title` for level 1
   * and `body` (semibold body text) for every other level.
   */
  appearance?: 'title' | 'body';
}

/**
 * A heading. Give it `tabIndex={-1}` and a `ref` when focus has to be moved to
 * it by code, for example after a retry.
 */
export function Heading({
  level,
  appearance = level === 1 ? 'title' : 'body',
  children,
  ...rest
}: HeadingProps) {
  const Tag = `h${String(level)}` as ElementType;
  return (
    <Tag
      {...rest}
      className={cx(
        styles.heading,
        appearance === 'title' ? styles.title : styles.body,
      )}
    >
      {children}
    </Tag>
  );
}
