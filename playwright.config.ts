import { defineConfig } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './app/e2e',
  timeout: 60_000,
  use: {
    baseURL,
    headless: true,
  },
});
