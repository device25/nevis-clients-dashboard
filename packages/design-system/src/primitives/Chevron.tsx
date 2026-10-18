import styles from './Chevron.module.scss';

export interface ChevronProps {
  /** Points down when true, right when false. */
  expanded: boolean;
}

/**
 * A 16px chevron. It is decorative: the row that contains it carries
 * `aria-expanded`, so the icon is hidden from assistive technology.
 */
export function Chevron({ expanded }: ChevronProps) {
  return (
    <svg
      className={styles.chevron}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      data-expanded={expanded}
    >
      <path
        d="M6 3.5 10.5 8 6 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
