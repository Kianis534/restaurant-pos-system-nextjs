import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against the static export in `out/`, i.e. exactly what gets deployed.
 *
 *   npm run build && npm run test:e2e
 *
 * Locally you can reuse an installed browser instead of downloading one:
 *   PW_CHANNEL=msedge npm run test:e2e      (or chrome)
 *
 * To test a deployed copy instead (e.g. the GitHub Pages demo), point it at the site root;
 * keep the trailing slash:
 *   E2E_BASE_URL=https://<user>.github.io/<repo>/ npm run test:e2e
 */
const PORT = Number(process.env.E2E_PORT ?? 3300);
const CI = !!process.env.CI;
const REMOTE = process.env.E2E_BASE_URL;
const channel = process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {};

export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  // Half the CPU cores locally: one browser per core can starve a single static server.
  workers: CI ? 2 : '50%',
  reporter: CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: REMOTE ?? `http://localhost:${PORT}/`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 }, ...channel } },
    { name: 'mobile', use: { ...devices['Pixel 7'], ...channel } },
  ],
  webServer: REMOTE
    ? undefined
    : {
        command: `npx serve out -l ${PORT} --no-clipboard`,
        url: `http://localhost:${PORT}/login/`,
        reuseExistingServer: !CI,
        timeout: 60_000,
      },
});
