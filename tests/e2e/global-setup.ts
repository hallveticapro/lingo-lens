import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const dbName = "lingo_lens_e2e";
const databaseUrl = `postgresql://andrew@localhost:5432/${dbName}`;

function run(command: string, args: string[], env: Record<string, string | undefined> = {}) {
  execFileSync(command, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      ...env
    }
  });
}

export default async function globalSetup() {
  run("dropdb", ["--if-exists", dbName]);
  run("createdb", [dbName]);

  const env = {
    DATABASE_URL: databaseUrl,
    AUTH_SECRET: "e2e-auth-secret-change-me",
    ADMIN_EMAIL: "admin@example.com",
    ADMIN_PASSWORD: "test-password-123",
    BOOTSTRAP_ADMIN: "true",
    OPENAI_API_KEY: "sk-replace-me",
    OPENAI_MODEL: "gpt-5.1",
    APP_URL: "http://127.0.0.1:3100"
  };

  run("pnpm", ["prisma", "migrate", "deploy"], env);
  run("pnpm", ["seed"], env);
  run("pnpm", ["bootstrap-admin"], env);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await globalSetup();
}
