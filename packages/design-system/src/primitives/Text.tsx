import type { ComponentPropsWithRef, ElementType } from 'react';
import { cx } from '#tokens';
import styles from './Text.module.scss';

export interface TextProps extends Omit<
  ComponentPropsWithRef<'p'>,
  'className' | 'style'
> {
  as?: 'p' | 'span' | 'div';
  variant?: 'body' | 'footnote';
  tone?: 'primary' | 'secondary' | 'warning';
  align?: 'start' | 'center' | 'end';
}

const TONE = {
  primary: styles.primary,
  secondary: styles.secondary,
  warning: styles.warning,
} as const;

const ALIGN = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
} as const;

/** Body or footnote text. Pass `id` to reference it from `aria-*` attributes. */
export function Text({
  as = 'p',
  variant = 'body',
  tone = 'primary',
  align,
  children,
  ...rest
}: TextProps) {
  // A union of tags cannot share one ref type; the props are typed above.
  const Tag = as as ElementType;
  return (
    <Tag
      {...rest}
      className={cx(
        styles.text,
        variant === 'footnote' ? styles.footnote : styles.body,
        TONE[tone],
        align !== undefined && ALIGN[align],
      )}
    >
      {children}
    </Tag>
  );
}
