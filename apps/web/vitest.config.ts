import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '#test-support': new URL('../../test-support', import.meta.url).pathname,
    },
  },
  test: {
    name: 'web',
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
