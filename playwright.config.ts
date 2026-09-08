import { defineConfig } from "@playwright/test";

/**
 * e2e 冒烟（计划 §7）：构建产物上跑 preview 服务器。
 * CI 中先 pnpm build 再 pnpm test:e2e。
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:4322/i-ve-learned/",
  },
  webServer: {
    command: "pnpm preview --port 4322",
    url: "http://localhost:4322/i-ve-learned/",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
