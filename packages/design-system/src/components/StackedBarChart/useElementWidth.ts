import { useEffect, useRef, useState } from 'react';

/**
 * Width of an element, kept current with a ResizeObserver. 0 until the first
 * measurement, which the browser delivers before the first paint.
 */
export function useElementWidth<T extends Element>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries.at(-1);
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, width] as const;
}
