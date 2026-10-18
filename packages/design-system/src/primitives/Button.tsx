import type { ComponentPropsWithRef } from 'react';
import styles from './Button.module.scss';

export type ButtonProps = Omit<
  ComponentPropsWithRef<'button'>,
  'className' | 'style' | 'type'
>;

/** A native button. It never submits a form: its type is always `button`. */
export function Button({ children, ...rest }: ButtonProps) {
  return (
    <button {...rest} type="button" className={styles.button}>
      {children}
    </button>
  );
}
