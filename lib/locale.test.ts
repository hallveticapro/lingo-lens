import { describe, expect, it } from "vitest";
import { canonicalLocaleSlug, isCanonicalLocaleSlug, localeSlugToTag, localeTagToSlug } from "@/lib/locale";

describe("locale slug helpers", () => {
  it("uses latam as the public slug for es-419", () => {
    expect(localeTagToSlug("es-419")).toBe("latam");
    expect(localeSlugToTag("latam")).toBe("es-419");
  });

  it("keeps unknown locale tags unchanged", () => {
    expect(localeTagToSlug("fr-FR")).toBe("fr-FR");
    expect(localeSlugToTag("fr-FR")).toBe("fr-FR");
  });

  it("detects canonical public locale slugs", () => {
    expect(canonicalLocaleSlug("es-419")).toBe("latam");
    expect(isCanonicalLocaleSlug("latam")).toBe(true);
    expect(isCanonicalLocaleSlug("es-419")).toBe(false);
  });
});
