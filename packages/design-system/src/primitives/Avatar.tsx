import { avatarColor } from '#tokens';
import styles from './Avatar.module.scss';

export interface AvatarProps {
  /** Chooses the background: the same id always gets the same colour. */
  id: string;
  /** Full name; the avatar shows its initials. */
  name: string;
}

/** First letters of the first and last word; one letter for a one-word name. */
function initials(name: string): string {
  const words = name.split(/\s+/).filter((word) => word !== '');
  const first = words[0];
  const last = words.at(-1);
  if (first === undefined || last === undefined) return '';
  const letter = (word: string) => Array.from(word)[0]?.toUpperCase() ?? '';
  return first === last || words.length === 1
    ? letter(first)
    : letter(first) + letter(last);
}

/**
 * A 20px circle with initials. It is decorative: the name always sits next to
 * it, so it is hidden from assistive technology.
 */
export function Avatar({ id, name }: AvatarProps) {
  return (
    <span
      className={styles.avatar}
      style={{ backgroundColor: avatarColor(id) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
