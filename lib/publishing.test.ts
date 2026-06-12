import { describe, expect, it } from "vitest";
import { canPublishWithRights, hasPublishableAdaptations } from "@/lib/publishing";

describe("canPublishWithRights", () => {
  it("allows publishing without rights approval enabled", () => {
    expect(canPublishWithRights(null, false)).toBe(true);
  });

  it("requires approved text rights and approved-or-not-applicable image rights", () => {
    expect(
      canPublishWithRights(
        {
          textRightsStatus: "original_owned",
          imageRightsStatus: "not_applicable"
        },
        true
      )
    ).toBe(true);
    expect(
      canPublishWithRights(
        {
          textRightsStatus: "original_owned",
          imageRightsStatus: "unreviewed"
        },
        true
      )
    ).toBe(false);
  });
});

describe("hasPublishableAdaptations", () => {
  it("requires at least one publishable adaptation", () => {
    expect(hasPublishableAdaptations(0)).toBe(false);
    expect(hasPublishableAdaptations(1)).toBe(true);
  });
});
