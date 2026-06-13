export type ReadingLevelKey = "super_beginner" | "beginner" | "intermediate" | "natural";

type ReadingLevelSeed = {
  key: ReadingLevelKey;
  displayName: string;
  shortDescription: string;
  sortOrder: number;
  cefr: string;
  min: number;
  max: number;
};

type LevelGuidance = {
  readability_target: string;
  adaptation_goal: string;
  detail_policy: string;
  sentence_policy: string;
  vocabulary_policy: string;
  structure_policy: string;
  preservation_policy: string;
  avoid: string[];
};

const localeAvoidList = ["vosotros", "Spain-specific idioms", "dense regional slang"];

export const readingLevelSeeds: ReadingLevelSeed[] = [
  {
    key: "super_beginner",
    displayName: "Super Beginner",
    shortDescription: "ELI5 mini-summary for first readings.",
    sortOrder: 10,
    cefr: "A0-A1-ish",
    min: 70,
    max: 130
  },
  {
    key: "beginner",
    displayName: "Beginner",
    shortDescription: "ELI10 summary with simple sentences.",
    sortOrder: 20,
    cefr: "A1-ish",
    min: 140,
    max: 260
  },
  {
    key: "intermediate",
    displayName: "Intermediate",
    shortDescription: "ELI15 adaptation with clearer structure.",
    sortOrder: 30,
    cefr: "A2-B1-ish",
    min: 300,
    max: 550
  },
  {
    key: "natural",
    displayName: "Natural",
    shortDescription: "Standard target-language translation.",
    sortOrder: 40,
    cefr: "Fluent / natural",
    min: 0,
    max: 0
  }
];

const levelGuidance: Record<ReadingLevelKey, LevelGuidance> = {
  super_beginner: {
    readability_target: "Kindergarten to 1st grade / ELI5",
    adaptation_goal:
      "Write a very short mini-summary, not a full translation. Keep only the central idea and the safest essential facts.",
    detail_policy:
      "Use who, what, where, and when facts only when they are essential. Omit secondary context, abstractions, and nuance.",
    sentence_policy:
      "Use tiny, direct sentences with one idea each. Prefer present tense and concrete words.",
    vocabulary_policy:
      "Use the most common target-language words. Introduce at most one or two important new words and explain them through context.",
    structure_policy:
      "Use two to four short paragraphs. Avoid headings unless they make the text easier.",
    preservation_policy:
      "Preserve names, dates, places, and numbers that are needed for the main idea, but simplify everything around them.",
    avoid: [
      ...localeAvoidList,
      "full article translation",
      "long paragraphs",
      "subordinate clauses",
      "abstract commentary",
      "idioms",
      "unexplained cultural references"
    ]
  },
  beginner: {
    readability_target: "3rd grade / ELI10",
    adaptation_goal:
      "Write a simple summary-adaptation. Include the main idea and a few important supporting facts.",
    detail_policy:
      "Keep the source's basic sequence and essential context, but skip dense background and low-priority details.",
    sentence_policy:
      "Use short sentences with familiar connectors. Use simple present, past, and future forms when needed.",
    vocabulary_policy:
      "Use common vocabulary. Allow a few useful content words when they are supported by context or vocabulary notes.",
    structure_policy:
      "Use short paragraphs and clear transitions. Use headings only when they help a young reader follow the text.",
    preservation_policy:
      "Preserve the protected facts that define the story, while simplifying quotes and complex explanations.",
    avoid: [...localeAvoidList, "advanced syntax", "dense paragraphs", "figurative language", "unstated inferences"]
  },
  intermediate: {
    readability_target: "ELI15",
    adaptation_goal:
      "Write a clear teen-friendly adaptation. Preserve more of the article's structure, detail, and cause-effect relationships.",
    detail_policy:
      "Include important context, nuance, and relationships, but explain specialized or abstract ideas plainly.",
    sentence_policy:
      "Use natural but controlled sentences. Vary sentence length without becoming literary or academic.",
    vocabulary_policy:
      "Use useful real-world vocabulary with enough context for an intermediate learner.",
    structure_policy:
      "Use coherent paragraphs and optional headings when the source has multiple sections.",
    preservation_policy:
      "Preserve protected facts, sequence, and tone while making the article easier than a standard translation.",
    avoid: [...localeAvoidList, "overly formal prose", "unexplained jargon", "needless simplification"]
  },
  natural: {
    readability_target: "Standard target-language translation",
    adaptation_goal:
      "Translate the source as a normal fluent article. Do not simplify, summarize, or level down the content.",
    detail_policy:
      "Preserve the source's details, structure, nuance, and emphasis as closely as natural target-language prose allows.",
    sentence_policy:
      "Use fluent editorial target-language prose with normal sentence variety.",
    vocabulary_policy:
      "Use natural vocabulary for the topic and audience. Do not avoid advanced words when they are the right translation.",
    structure_policy:
      "Follow the source structure unless the target language needs a small adjustment for fluency.",
    preservation_policy:
      "Preserve protected facts, quotes, relationships, and tone with translation-level fidelity.",
    avoid: [...localeAvoidList, "summary adaptation", "simplification", "missing source details", "invented context"]
  }
};

function knownLevelKey(key: string): ReadingLevelKey {
  return readingLevelSeeds.some((level) => level.key === key) ? (key as ReadingLevelKey) : "beginner";
}

export function guidanceForLevel(key: string) {
  return levelGuidance[knownLevelKey(key)];
}

export function generationConstraintsForLevel(key: string) {
  const level = readingLevelSeeds.find((entry) => entry.key === knownLevelKey(key)) ?? readingLevelSeeds[1];
  const guidance = guidanceForLevel(key);

  return {
    ...(level.key === "natural"
      ? { target_word_count_mode: "match_source_length" }
      : {
          target_word_count_min: level.min,
          target_word_count_max: level.max
        }),
    readability_target: guidance.readability_target,
    adaptation_goal: guidance.adaptation_goal,
    detail_policy: guidance.detail_policy,
    sentence_policy: guidance.sentence_policy,
    vocabulary_policy: guidance.vocabulary_policy,
    structure_policy: guidance.structure_policy,
    preservation_policy: guidance.preservation_policy,
    sentence_style:
      level.key === "natural"
        ? "fluent editorial target-language prose"
        : "short and direct, with controlled vocabulary",
    avoid: guidance.avoid,
    locale_notes: "Use broadly neutral Latin American Spanish."
  };
}

export function vocabularyConstraintsForLevel(key: string) {
  const maxTermsByLevel: Record<ReadingLevelKey, number> = {
    super_beginner: 4,
    beginner: 6,
    intermediate: 8,
    natural: 10
  };

  return {
    max_terms: maxTermsByLevel[knownLevelKey(key)],
    include_english_meanings: true,
    include_example_sentences: true
  };
}

export function scaffoldConfigForLevel(key: string) {
  const questionCountByLevel: Record<ReadingLevelKey, number> = {
    super_beginner: 2,
    beginner: 3,
    intermediate: 4,
    natural: 4
  };

  return {
    include_summary: true,
    include_comprehension_questions: true,
    question_count: questionCountByLevel[knownLevelKey(key)]
  };
}

export function levelTargetsSummary() {
  return [
    "Super Beginner: Kindergarten to 1st grade / ELI5 mini-summary, not a full translation.",
    "Beginner: 3rd grade / ELI10 summary-adaptation.",
    "Intermediate: ELI15 clear teen-friendly adaptation.",
    "Natural: standard target-language translation with no simplification."
  ].join(" ");
}
