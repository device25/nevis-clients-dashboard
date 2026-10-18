import { describe, expect, it } from 'vitest';
import * as designSystem from './index';

describe('public API', () => {
  it('exports exactly the components and hooks of this package', () => {
    expect(Object.keys(designSystem).sort()).toEqual(
      [
        'Avatar',
        'Button',
        'Chevron',
        'ErrorBoundary',
        'ErrorState',
        'Heading',
        'Inline',
        'Skeleton',
        'Stack',
        'StackedBarChart',
        'StatusDot',
        'Surface',
        'Text',
        'TreeGrid',
        'VisuallyHidden',
        'useTreeState',
      ].sort(),
    );
  });
});
