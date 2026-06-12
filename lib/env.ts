import { z } from "zod";

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().trim().url().default("http://localhost:3000"),
  AUTH_SECRET: z.string().optional(),
  ADMIN_EMAIL: z.string().trim().email().default("admin@example.com"),
  REQUIRE_RIGHTS_APPROVAL_TO_PUBLISH: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().trim().min(1).default("gpt-5.1"),
  UPLOAD_DIR: z.string().trim().min(1).optional(),
  MAX_UPLOAD_MB: z.coerce.number().int().min(1).max(100).default(10),
  RSS_MAX_ITEMS: z.coerce.number().int().min(1).max(100).default(25),
  DATABASE_URL: z.string().trim().url().optional()
});

let cachedEnv: z.infer<typeof rawEnvSchema> | null = null;

function readEnv() {
  cachedEnv ??= rawEnvSchema.parse(process.env);
  return cachedEnv;
}

function isPlaceholder(value: string | undefined, placeholders: string[]) {
  return !value || placeholders.includes(value);
}

export function isProduction() {
  return readEnv().NODE_ENV === "production";
}

export function appUrl() {
  return readEnv().APP_URL;
}

export function authSecret() {
  const { AUTH_SECRET } = readEnv();
  if (isProduction() && isPlaceholder(AUTH_SECRET, ["change-me", "development-change-me"])) {
    throw new Error("AUTH_SECRET must be set to a non-placeholder value in production.");
  }
  return AUTH_SECRET || "development-change-me";
}

export function adminEmail() {
  return readEnv().ADMIN_EMAIL;
}

export function requireRightsApproval() {
  return readEnv().REQUIRE_RIGHTS_APPROVAL_TO_PUBLISH;
}

export function openAIApiKey() {
  const key = readEnv().OPENAI_API_KEY;
  return isPlaceholder(key, ["sk-replace-me"]) ? null : key;
}

export function openAIModel() {
  return readEnv().OPENAI_MODEL;
}

export function uploadDir() {
  return readEnv().UPLOAD_DIR;
}

export function maxRemoteImageBytes() {
  return readEnv().MAX_UPLOAD_MB * 1024 * 1024;
}

export function rssMaxItems() {
  return readEnv().RSS_MAX_ITEMS;
}
