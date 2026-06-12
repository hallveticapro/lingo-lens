import { describe, expect, it } from "vitest";
import { normalizePage, paginationState } from "@/lib/articles";

describe("article pagination helpers", () => {
  it("normalizes invalid page values to the first page", () => {
    expect(normalizePage(undefined)).toBe(1);
    expect(normalizePage("0")).toBe(1);
    expect(normalizePage("abc")).toBe(1);
    expect(normalizePage("3")).toBe(3);
  });

  it("bounds pagination to available pages", () => {
    expect(paginationState(25, 99, 12)).toMatchObject({
      page: 3,
      totalPages: 3,
      skip: 24,
      hasPrevious: true,
      hasNext: false
    });
  });
});
