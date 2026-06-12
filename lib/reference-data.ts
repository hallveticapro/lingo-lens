import type { PrismaClient } from "@prisma/client";

const levels = [
  {
    key: "super_beginner",
    displayName: "Super Beginner",
    shortDescription: "Very short, heavily scaffolded Spanish for first readings.",
    sortOrder: 10,
    cefr: "A0-A1-ish",
    min: 120,
    max: 220
  },
  {
    key: "beginner",
    displayName: "Beginner",
    shortDescription: "Simple sentences and common vocabulary.",
    sortOrder: 20,
    cefr: "A1-A2-ish",
    min: 250,
    max: 500
  },
  {
    key: "intermediate",
    displayName: "Intermediate",
    shortDescription: "More natural Spanish with fuller detail.",
    sortOrder: 30,
    cefr: "B1-B2-ish",
    min: 500,
    max: 850
  },
  {
    key: "natural",
    displayName: "Natural",
    shortDescription: "A fluent, natural target-language version.",
    sortOrder: 40,
    cefr: "C1-C2-ish",
    min: 700,
    max: 1200
  }
] as const;

export async function bootstrapReferenceData(prisma: PrismaClient) {
  const english = await prisma.locale.upsert({
    where: { bcp47Tag: "en-US" },
    update: {
      displayNameEn: "English (United States)",
      nativeName: "English",
      isEnabledAsSource: true
    },
    create: {
      bcp47Tag: "en-US",
      languageCode: "en",
      regionCode: "US",
      displayNameEn: "English (United States)",
      nativeName: "English",
      isEnabledAsSource: true,
      isEnabledAsTarget: false,
      isPublic: false
    }
  });

  const spanish = await prisma.locale.upsert({
    where: { bcp47Tag: "es-419" },
    update: {
      displayNameEn: "Spanish (Latin American)",
      nativeName: "español latinoamericano",
      isEnabledAsSource: true,
      isEnabledAsTarget: true,
      isPublic: true
    },
    create: {
      bcp47Tag: "es-419",
      languageCode: "es",
      regionCode: "419",
      displayNameEn: "Spanish (Latin American)",
      nativeName: "español latinoamericano",
      isEnabledAsSource: true,
      isEnabledAsTarget: true,
      isPublic: true
    }
  });

  const levelRows = new Map<string, string>();
  for (const level of levels) {
    const row = await prisma.readingLevel.upsert({
      where: { key: level.key },
      update: {
        displayName: level.displayName,
        shortDescription: level.shortDescription,
        sortOrder: level.sortOrder,
        isActive: true,
        isPublic: true
      },
      create: {
        key: level.key,
        displayName: level.displayName,
        shortDescription: level.shortDescription,
        sortOrder: level.sortOrder,
        isActive: true,
        isPublic: true
      }
    });
    levelRows.set(level.key, row.id);

    await prisma.localeLevelProfile.upsert({
      where: {
        localeId_readingLevelId: {
          localeId: spanish.id,
          readingLevelId: row.id
        }
      },
      update: {
        externalFrameworkMappings: { cefr_estimate: level.cefr },
        generationConstraints: {
          target_word_count_min: level.min,
          target_word_count_max: level.max,
          sentence_style:
            level.key === "natural"
              ? "natural editorial Spanish"
              : "short and direct, with controlled vocabulary",
          avoid: ["vosotros", "Spain-specific idioms", "dense regional slang"],
          locale_notes: "Use broadly neutral Latin American Spanish."
        },
        vocabularyConstraints: {
          max_terms: level.key === "super_beginner" ? 6 : 10,
          include_english_meanings: true,
          include_example_sentences: true
        },
        scaffoldConfig: {
          include_summary: true,
          include_comprehension_questions: true,
          question_count: level.key === "super_beginner" ? 3 : 4
        },
        isGenerationEnabled: true,
        isPublic: true
      },
      create: {
        localeId: spanish.id,
        readingLevelId: row.id,
        externalFrameworkMappings: { cefr_estimate: level.cefr },
        generationConstraints: {
          target_word_count_min: level.min,
          target_word_count_max: level.max,
          sentence_style:
            level.key === "natural"
              ? "natural editorial Spanish"
              : "short and direct, with controlled vocabulary",
          avoid: ["vosotros", "Spain-specific idioms", "dense regional slang"],
          locale_notes: "Use broadly neutral Latin American Spanish."
        },
        vocabularyConstraints: {
          max_terms: level.key === "super_beginner" ? 6 : 10,
          include_english_meanings: true,
          include_example_sentences: true
        },
        scaffoldConfig: {
          include_summary: true,
          include_comprehension_questions: true,
          question_count: level.key === "super_beginner" ? 3 : 4
        }
      }
    });
  }

  for (const level of levels) {
    const readingLevelId = levelRows.get(level.key);
    if (!readingLevelId) continue;

    await prisma.rssFeedConfig.upsert({
      where: {
        targetLocaleId_readingLevelId: {
          targetLocaleId: spanish.id,
          readingLevelId
        }
      },
      update: {
        slug: `es-419-${level.key.replaceAll("_", "-")}`,
        title: `LingoLens ${level.displayName} Spanish`,
        description: `Published ${level.displayName.toLowerCase()} readings in Latin American Spanish.`
      },
      create: {
        targetLocaleId: spanish.id,
        readingLevelId,
        slug: `es-419-${level.key.replaceAll("_", "-")}`,
        title: `LingoLens ${level.displayName} Spanish`,
        description: `Published ${level.displayName.toLowerCase()} readings in Latin American Spanish.`
      }
    });
  }

  return { english, spanish, levels: Array.from(levelRows.values()) };
}
