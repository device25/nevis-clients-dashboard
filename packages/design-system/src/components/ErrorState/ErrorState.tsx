import { useEffect, useRef } from 'react';
import { Stack } from '#layout';
import { Button, Heading, Text } from '#primitives';
import styles from './ErrorState.module.scss';

export interface ErrorStateProps {
  /** Level of the heading; pick the one that fits the page outline. */
  headingLevel?: 1 | 2 | 3;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}

/**
 * An error announced as an alert. Focus moves to the heading when it appears,
 * so keyboard and screen reader users land on the problem, one Tab away from
 * the action.
 */
export function ErrorState({
  headingLevel = 2,
  title,
  message,
  actionLabel,
  onAction,
}: ErrorStateProps) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <div className={styles.container}>
      <Stack role="alert" gap={4} align="center">
        <Heading
          level={headingLevel}
          appearance="body"
          tabIndex={-1}
          ref={heading}
        >
          {title}
        </Heading>
        <Text tone="secondary" align="center">
          {message}
        </Text>
        <Button onClick={onAction}>{actionLabel}</Button>
      </Stack>
    </div>
  );
}
