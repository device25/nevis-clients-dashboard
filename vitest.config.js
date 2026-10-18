import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/contract',
      'packages/data',
      'packages/design-system',
      'apps/api',
      'apps/web',
    ],
  },
});
