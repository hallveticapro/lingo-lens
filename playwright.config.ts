import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;
const databaseUrl = "postgresql://andrew@localhost:5432/lingo_lens_e2e";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5000 },
  use: {
    baseURL,
    trace: "retain-on-failure"
  },
  webServer: {
    command: "pnpm start",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
    env: {
      APP_URL: baseURL,
      PORT: String(port),
      DATABASE_URL: databaseUrl,
      AUTH_SECRET: "e2e-auth-secret-change-me",
      ADMIN_EMAIL: "admin@example.com",
      OPENAI_API_KEY: "sk-replace-me",
      OPENAI_MODEL: "gpt-5.1"
    }
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
