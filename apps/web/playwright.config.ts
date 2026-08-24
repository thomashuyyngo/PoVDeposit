import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://127.0.0.1:3108", channel: "chrome", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Passing PORT through `env` keeps this working off Windows, where `set VAR=`
    // is not how a POSIX shell exports a variable and the API would bind 3000.
    command: "corepack pnpm --filter @pov-deposit/api start",
    env: { PORT: "3108" },
    cwd: "../..",
    url: "http://127.0.0.1:3108/health",
    reuseExistingServer: true,
  },
});
