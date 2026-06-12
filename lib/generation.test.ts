import { describe, expect, it } from "vitest";
import { GenerationError, classifyGenerationError } from "@/lib/generation";

describe("classifyGenerationError", () => {
  it("treats explicit generation validation errors as validation failures", () => {
    const error = new GenerationError("validation", "Unknown reading level keys: advanced");

    expect(classifyGenerationError(error)).toBe("validation");
  });

  it("classifies provider rate limits separately from other provider failures", () => {
    expect(classifyGenerationError({ status: 429, message: "slow down" })).toBe("rate_limit");
    expect(classifyGenerationError({ status: 500, message: "provider unavailable" })).toBe("provider");
  });
});
