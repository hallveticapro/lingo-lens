import { describe, expect, it } from "vitest";
import { levelKeyToSlug, levelSlugToKey, labelInitials } from "@/lib/level";

describe("level slug helpers", () => {
  it("round trips level keys and slugs", () => {
    expect(levelSlugToKey(levelKeyToSlug("super_beginner"))).toBe("super_beginner");
  });

  it("returns stable label initials", () => {
    expect(labelInitials("super_beginner")).toBe("SB");
    expect(labelInitials("natural")).toBe("N");
  });
});
