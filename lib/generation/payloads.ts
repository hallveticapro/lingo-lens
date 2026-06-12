import { Prisma } from "@prisma/client";
import { z } from "zod";
import { isProduction } from "@/lib/env";

export type GenerationFailureCategory = "validation" | "provider" | "rate_limit" | "network" | "schema" | "unknown";

export class GenerationError extends Error {
  constructor(
    public readonly category: GenerationFailureCategory,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

type JsonInput = Prisma.InputJsonValue | null;

type FailurePayload = Prisma.InputJsonObject & {
  category: GenerationFailureCategory;
  message: string;
  guidance: string;
  error: JsonInput;
};

function stringifyFactValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = ["text", "quote", "value", "number", "name", "label", "description", "summary"]
      .map((key) => record[key])
      .find((entry) => typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean");

    if (preferred !== undefined) return String(preferred);
    return JSON.stringify(value);
  }
  return "";
}

function arrayInput(value: unknown) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

const flexibleStringArray = z.preprocess(
  arrayInput,
  z.array(z.unknown()).transform((values) => values.map(stringifyFactValue).map((value) => value.trim()).filter(Boolean))
);

function flexibleRecordArray(stringRecord: (text: string) => Record<string, unknown>) {
  return z.preprocess(
    arrayInput,
    z.array(z.unknown()).transform((values) =>
      values
        .map((value) => {
          if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
          const text = stringifyFactValue(value).trim();
          return text ? stringRecord(text) : null;
        })
        .filter((value): value is Record<string, unknown> => Boolean(value))
    )
  );
}

export const generatedSchema = z.object({
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  image_caption: z.string().nullable().optional(),
  body_markdown: z.string(),
  body_blocks: flexibleRecordArray((text) => ({ type: "paragraph", text })),
  vocabulary: flexibleRecordArray((text) => ({ term: text })),
  comprehension_questions: flexibleRecordArray((text) => ({ question: text, answer: "" })),
  content_warning: z.string().nullable().optional(),
  editor_notes: flexibleStringArray,
  fact_preservation_notes: flexibleStringArray
});

export type GeneratedPayload = z.infer<typeof generatedSchema>;

export const factBankSchema = z.object({
  facts: flexibleStringArray,
  entities: flexibleStringArray,
  dates: flexibleStringArray,
  numbers: flexibleStringArray,
  quotes: flexibleStringArray,
  sensitive_topics: flexibleStringArray,
  preservation_notes: flexibleStringArray
});

export type FactBankPayload = z.infer<typeof factBankSchema>;

function boundedText(value: unknown, maxLength = 700) {
  const text = String(value ?? "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function toInputJson(value: unknown): JsonInput {
  if (value === undefined || typeof value === "function" || typeof value === "symbol") return null;
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((entry) => toInputJson(entry));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, toInputJson(entry)])
    ) as Prisma.InputJsonObject;
  }
  return String(value);
}

export function classifyGenerationError(error: unknown): GenerationFailureCategory {
  if (error instanceof GenerationError) return error.category;
  if (error instanceof z.ZodError || error instanceof SyntaxError) return "schema";
  if (error instanceof TypeError) return "network";

  const maybeApiError = error as {
    code?: unknown;
    status?: unknown;
    type?: unknown;
    name?: unknown;
    message?: unknown;
  };

  if (maybeApiError.status === 429 || maybeApiError.code === "rate_limit_exceeded") return "rate_limit";
  if (typeof maybeApiError.status === "number" && maybeApiError.status >= 400) return "provider";
  if (typeof maybeApiError.type === "string" && maybeApiError.type.includes("api")) return "provider";
  return "unknown";
}

export function missingReadingLevelKeys(requestedKeys: string[], foundKeys: string[]) {
  const found = new Set(foundKeys);
  return Array.from(new Set(requestedKeys.map((key) => key.trim()).filter(Boolean))).filter((key) => !found.has(key));
}

function retryGuidance(category: GenerationFailureCategory) {
  if (category === "validation") return "Review the source content, locale, and selected levels before retrying.";
  if (category === "rate_limit") return "Wait briefly, then retry the job.";
  if (category === "network") return "Check network access from the worker, then retry the job.";
  if (category === "schema") return "Retry once; if this repeats, adjust the prompt or generated output schema.";
  if (category === "provider") return "Check provider availability and credentials, then retry the job.";
  return "Review the error details and retry if the underlying issue is temporary.";
}

export function errorDetails(error: unknown) {
  if (error instanceof GenerationError) {
    return {
      name: error.name,
      message: boundedText(error.message),
      category: error.category,
      details: error.details
    };
  }

  if (error instanceof z.ZodError) {
    return {
      name: "ZodError",
      message: "Generated content did not match the expected schema.",
      issues: error.issues.slice(0, 8).map((issue) => ({
        path: issue.path.join("."),
        message: boundedText(issue.message, 220)
      }))
    };
  }

  if (!(error instanceof Error)) {
    return {
      name: "UnknownError",
      message: boundedText(error)
    };
  }

  const maybeApiError = error as Error & {
    code?: unknown;
    status?: unknown;
    type?: unknown;
    param?: unknown;
    request_id?: unknown;
    requestID?: unknown;
  };

  const details = {
    name: error.name,
    message: boundedText(error.message),
    code: typeof maybeApiError.code === "string" ? maybeApiError.code : undefined,
    status: typeof maybeApiError.status === "number" ? maybeApiError.status : undefined,
    type: typeof maybeApiError.type === "string" ? maybeApiError.type : undefined,
    param: typeof maybeApiError.param === "string" ? maybeApiError.param : undefined,
    requestId:
      typeof maybeApiError.request_id === "string"
        ? maybeApiError.request_id
        : typeof maybeApiError.requestID === "string"
          ? maybeApiError.requestID
          : undefined,
    stack: isProduction() ? undefined : error.stack
  };

  return Object.fromEntries(Object.entries(details).filter(([, value]) => value !== undefined));
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) return "Generated content did not match the expected schema.";
  const details = errorDetails(error);
  return typeof details.message === "string" && details.message ? boundedText(details.message) : fallback;
}

export function failurePayload(error: unknown, fallback: string): FailurePayload {
  const category = classifyGenerationError(error);
  return toInputJson({
    category,
    message: errorMessage(error, fallback),
    guidance: retryGuidance(category),
    error: errorDetails(error)
  }) as FailurePayload;
}
