import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://127.0.0.1:3108", channel: "chrome", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "set PORT=3108&& corepack pnpm --filter @pov-deposit/api start",
    cwd: "../..",
    url: "http://127.0.0.1:3108/health",
    reuseExistingServer: true,
  },
});
