import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.RELAY_E2E_BASE_URL;
if (!baseURL) throw new Error("RELAY_E2E_BASE_URL is required");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "deployed-desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "deployed-dark", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, colorScheme: "dark" } },
    { name: "deployed-mobile", use: { ...devices["Pixel 7"] } },
  ],
});
