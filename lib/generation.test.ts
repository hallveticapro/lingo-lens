import { describe, expect, it } from "vitest";
import { z } from "zod";
import { GenerationError, classifyGenerationError, missingReadingLevelKeys } from "@/lib/generation";

describe("classifyGenerationError", () => {
  it("treats explicit generation validation errors as validation failures", () => {
    const error = new GenerationError("validation", "Unknown reading level keys: advanced");

    expect(classifyGenerationError(error)).toBe("validation");
  });

  it("classifies provider rate limits separately from other provider failures", () => {
    expect(classifyGenerationError({ status: 429, message: "slow down" })).toBe("rate_limit");
    expect(classifyGenerationError({ status: 500, message: "provider unavailable" })).toBe("provider");
  });

  it("classifies malformed model output as a schema failure", () => {
    expect(classifyGenerationError(new SyntaxError("bad json"))).toBe("schema");
    expect(classifyGenerationError(z.object({ title: z.string() }).safeParse({}).error)).toBe("schema");
  });
});

describe("missingReadingLevelKeys", () => {
  it("returns de-duplicated requested level keys that were not found", () => {
    expect(missingReadingLevelKeys(["beginner", "advanced", "advanced"], ["beginner"])).toEqual(["advanced"]);
  });
});
