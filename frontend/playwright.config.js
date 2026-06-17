import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Playwright boots both servers automatically (reusing them if they
 * are already running), so `npx playwright test` is enough for the demo.
 * Tests share the real backend database, so they run serially for determinism.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      // Run the Flask app without the debug reloader so the process is easy to manage.
      command: 'python -c "from app import create_app; create_app().run(port=5000, use_reloader=False)"',
      cwd: '../backend',
      url: 'http://localhost:5000/api/status',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
