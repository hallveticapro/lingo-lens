import { describe, expect, it } from "vitest";
import {
  generationConstraintsForLevel,
  guidanceForLevel,
  levelTargetsSummary,
  scaffoldConfigForLevel,
  vocabularyConstraintsForLevel
} from "@/lib/level-guidance";

describe("reading level guidance", () => {
  it("targets Super Beginner at ELI5 mini-summary difficulty", () => {
    expect(guidanceForLevel("super_beginner")).toMatchObject({
      readability_target: "Kindergarten to 1st grade / ELI5",
      adaptation_goal: expect.stringContaining("mini-summary")
    });
    expect(generationConstraintsForLevel("super_beginner")).toMatchObject({
      target_word_count_min: 70,
      target_word_count_max: 130
    });
    expect(vocabularyConstraintsForLevel("super_beginner")).toMatchObject({ max_terms: 4 });
    expect(scaffoldConfigForLevel("super_beginner")).toMatchObject({ question_count: 2 });
  });

  it("keeps Beginner, Intermediate, and Natural distinct", () => {
    expect(guidanceForLevel("beginner").readability_target).toBe("3rd grade / ELI10");
    expect(guidanceForLevel("intermediate").readability_target).toBe("ELI15");
    expect(guidanceForLevel("natural")).toMatchObject({
      readability_target: "Standard target-language translation",
      adaptation_goal: expect.stringContaining("Do not simplify")
    });
    expect(generationConstraintsForLevel("natural")).toMatchObject({
      target_word_count_mode: "match_source_length"
    });
  });

  it("summarizes the strict targets for the OpenAI system prompt", () => {
    expect(levelTargetsSummary()).toContain("Super Beginner: Kindergarten to 1st grade / ELI5");
    expect(levelTargetsSummary()).toContain("Beginner: 3rd grade / ELI10");
    expect(levelTargetsSummary()).toContain("Intermediate: ELI15");
    expect(levelTargetsSummary()).toContain("Natural: standard target-language translation");
  });
});
