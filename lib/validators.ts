import { z } from "zod";

export const contentFormSchema = z.object({
  sourceTitle: z.string().trim().min(3, "Add a source title."),
  sourceSubtitle: z.string().trim().optional(),
  sourceLocale: z.string().trim().min(2).default("en-US"),
  contentType: z.enum(["news_article", "public_domain_story", "original_story", "lesson_text", "other"]),
  sourceName: z.string().trim().optional(),
  sourceUrl: z.string().trim().url("Use a valid URL.").optional().or(z.literal("")),
  originalAuthor: z.string().trim().optional(),
  originalPublicationDate: z.string().trim().optional(),
  headerImageUrl: z.string().trim().url("Use a valid image URL.").optional().or(z.literal("")),
  imageAltText: z.string().trim().optional(),
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
