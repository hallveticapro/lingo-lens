import { z } from "zod";

const webUrlSchema = z
  .string()
  .trim()
  .url("Use a valid URL.")
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }, "Use an http or https URL.");

const optionalWebUrlSchema = webUrlSchema.optional().or(z.literal(""));

export const contentFormSchema = z.object({
  sourceTitle: z.string().trim().min(3, "Add a source title."),
  sourceSubtitle: z.string().trim().optional(),
  sourceLocale: z.string().trim().min(2).default("en-US"),
  contentType: z.enum(["news_article", "public_domain_story", "original_story", "lesson_text", "other"]),
  sourceName: z.string().trim().optional(),
  sourceUrl: optionalWebUrlSchema,
  originalAuthor: z.string().trim().optional(),
  originalPublicationDate: z.string().trim().optional(),
  headerImageUrl: optionalWebUrlSchema,
  imageAltText: z.string().trim().optional(),
  imageCaption: z.string().trim().optional(),
  internalNotes: z.string().trim().optional(),
  sourceBody: z.string().trim().min(50, "Paste at least 50 characters of source text."),
  targetLocale: z.string().trim().min(2).default("es-419"),
  levels: z.array(z.string()).min(1, "Choose at least one level.")
});

export const adaptationEditSchema = z.object({
  title: z.string().trim().min(2),
  subtitle: z.string().trim().optional(),
  summary: z.string().trim().optional(),
  bodyMarkdown: z.string().trim().min(20),
  checkTranslationTitle: z.string().trim().optional(),
  checkTranslationSummary: z.string().trim().optional(),
  checkTranslationBodyMarkdown: z.string().trim().optional(),
  vocabularyText: z.string().trim().optional(),
  questionsText: z.string().trim().optional(),
  editorNotes: z.string().trim().optional()
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export function stringFromForm(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function arrayFromForm(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string");
}
