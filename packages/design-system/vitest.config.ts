import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '#test-support': fileURLToPath(
        new URL('../../test-support', import.meta.url),
      ),
    },
  },
  test: {
    name: 'design-system',
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
