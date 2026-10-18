import { describe, expect, it } from 'vitest';
import * as designSystem from './index';

describe('public API', () => {
  it('exports exactly the components and hooks of this package', () => {
    // TreeGrid and useTreeState are added by the TreeGrid task.
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
        'VisuallyHidden',
      ].sort(),
    );
  });
});
