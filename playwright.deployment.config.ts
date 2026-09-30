import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: 'tests/deployment', timeout: 90000, workers: 1, use: { baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173/Tree-Flim/', headless: true, screenshot: 'only-on-failure' }, reporter: 'list' });
