import type { PrismaClient } from "@prisma/client";
import {
  generationConstraintsForLevel,
  readingLevelSeeds,
  scaffoldConfigForLevel,
  vocabularyConstraintsForLevel
} from "@/lib/level-guidance";

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
  for (const level of readingLevelSeeds) {
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
        generationConstraints: generationConstraintsForLevel(level.key),
        vocabularyConstraints: vocabularyConstraintsForLevel(level.key),
        scaffoldConfig: scaffoldConfigForLevel(level.key),
        isGenerationEnabled: true,
        isPublic: true
      },
      create: {
        localeId: spanish.id,
        readingLevelId: row.id,
        externalFrameworkMappings: { cefr_estimate: level.cefr },
        generationConstraints: generationConstraintsForLevel(level.key),
        vocabularyConstraints: vocabularyConstraintsForLevel(level.key),
        scaffoldConfig: scaffoldConfigForLevel(level.key)
      }
    });
  }

  for (const level of readingLevelSeeds) {
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
        slug: `latam-${level.key.replaceAll("_", "-")}`,
        title: `LingoLens ${level.displayName} Spanish`,
        description: `Published ${level.displayName.toLowerCase()} readings in Latin American Spanish.`
      },
      create: {
        targetLocaleId: spanish.id,
        readingLevelId,
        slug: `latam-${level.key.replaceAll("_", "-")}`,
        title: `LingoLens ${level.displayName} Spanish`,
        description: `Published ${level.displayName.toLowerCase()} readings in Latin American Spanish.`
      }
    });
  }

  return { english, spanish, levels: Array.from(levelRows.values()) };
}
