import styles from './StatusDot.module.scss';

/**
 * A 6px warning dot placed before a value. It is decorative: whatever it flags
 * must also be described in text, for example through `aria-describedby`.
 */
export function StatusDot() {
  return <span className={styles.dot} aria-hidden="true" />;
}
