import { ErrorBoundary, ErrorState } from '@nevis/design-system';
import { useEffect, useRef, type ReactNode } from 'react';

interface WidgetBoundaryProps {
  title: string;
  message: string;
  /** The widget is on screen again after the user chose "Try again". */
  onRecovered: () => void;
  children: ReactNode;
}

/**
 * Renders after the widget in the same boundary, so it mounts only once the
 * widget has rendered without throwing.
 */
function RecoveryProbe({ onMounted }: { onMounted: () => void }) {
  useEffect(() => {
    onMounted();
  }, [onMounted]);
  return null;
}

/**
 * Keeps a rendering failure inside one widget (D17). "Try again" mounts the
 * widget anew; what the user chose lives above it, so nothing is lost. The
 * button that had focus is gone by then, so the page is told when the widget
 * is back and puts focus on the "Clients" heading (D24).
 */
export function WidgetBoundary({
  title,
  message,
  onRecovered,
  children,
}: WidgetBoundaryProps) {
  const retried = useRef(false);

  function handleMounted() {
    if (!retried.current) return;
    retried.current = false;
    onRecovered();
  }

  return (
    <ErrorBoundary
      fallback={(_error, reset) => (
        <ErrorState
          headingLevel={3}
          title={title}
          message={message}
          actionLabel="Try again"
          onAction={() => {
            retried.current = true;
            reset();
          }}
        />
      )}
    >
      {children}
      <RecoveryProbe onMounted={handleMounted} />
    </ErrorBoundary>
  );
}
