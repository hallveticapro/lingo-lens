import { describe, expect, it } from "vitest";
import { formatQuestions, formatVocabulary, parseQuestions, parseVocabulary } from "@/lib/parsers";

describe("vocabulary parser", () => {
  it("parses and formats pipe-delimited vocabulary", () => {
    const parsed = parseVocabulary("casa | house | noun\nbad row");

    expect(parsed).toEqual([{ term: "casa", meaning_en: "house", part_of_speech: "noun" }]);
    expect(formatVocabulary(parsed)).toBe("casa | house | noun");
  });
});

describe("question parser", () => {
  it("parses and formats pipe-delimited questions", () => {
    const parsed = parseQuestions("¿Qué pasó? | Pasó algo importante.\nmissing answer");

    expect(parsed).toEqual([{ question: "¿Qué pasó?", answer: "Pasó algo importante." }]);
    expect(formatQuestions(parsed)).toBe("¿Qué pasó? | Pasó algo importante.");
  });
});
