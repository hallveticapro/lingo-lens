import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("normalizes accents, punctuation, and length", () => {
    expect(slugify("Día de Muertos!")).toBe("dia-de-muertos");
    expect(slugify("A".repeat(120))).toHaveLength(90);
  });
});
