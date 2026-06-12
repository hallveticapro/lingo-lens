import { describe, expect, it } from "vitest";
import { levelKeyToSlug, levelSlugToKey } from "@/lib/level";

describe("level slug helpers", () => {
  it("round trips level keys and slugs", () => {
    expect(levelSlugToKey(levelKeyToSlug("super_beginner"))).toBe("super_beginner");
  });
});
