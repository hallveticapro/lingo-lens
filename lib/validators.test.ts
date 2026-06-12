import { describe, expect, it } from "vitest";
import { contentFormSchema } from "@/lib/validators";

const basePayload = {
  sourceTitle: "A valid source title",
  sourceLocale: "en-US",
  contentType: "lesson_text",
  sourceBody: "This is a sufficiently long source body for validation coverage in the form schema.",
  targetLocale: "es-419",
  levels: ["beginner"]
};

describe("contentFormSchema URL validation", () => {
  it("accepts http and https source URLs", () => {
    expect(contentFormSchema.safeParse({ ...basePayload, sourceUrl: "https://example.com/story" }).success).toBe(true);
    expect(contentFormSchema.safeParse({ ...basePayload, headerImageUrl: "http://example.com/image.jpg" }).success).toBe(true);
  });

  it("accepts blank optional URL fields", () => {
    expect(contentFormSchema.safeParse({ ...basePayload, sourceUrl: "", headerImageUrl: "" }).success).toBe(true);
  });

  it("rejects non-http remote URLs", () => {
    for (const url of ["file:///etc/passwd", "ftp://example.com/file.jpg", "data:text/plain,hello"]) {
      expect(contentFormSchema.safeParse({ ...basePayload, headerImageUrl: url }).success).toBe(false);
    }
  });
});
