import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:3001';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // The production server serves the API and the built web app together.
    command: 'pnpm start',
    cwd: '../..',
    url: `${baseURL}/api/clients`,
    reuseExistingServer: false,
  },
});
