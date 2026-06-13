import { PrismaClient } from "@prisma/client";
import { openAIModel } from "../lib/env";
import {
  generationConstraintsForLevel,
  levelTargetsSummary,
  readingLevelSeeds,
  scaffoldConfigForLevel,
  vocabularyConstraintsForLevel
} from "../lib/level-guidance";

const prisma = new PrismaClient();

const sampleBody = `Families in Mexico and in Mexican communities around the world prepare colorful ofrendas for Día de Muertos. The celebration takes place on November 1 and 2. It is a time to remember loved ones who have died, not as a sad ending, but as a moment of welcome, memory, and care.

Ofrendas often include photographs, candles, pan de muerto, favorite foods, and bright orange cempasúchil flowers. Many people believe the scent and color of the flowers help guide spirits home. The details vary by family and region, but the central idea is shared: memory can be active, generous, and full of life.`;

async function main() {
  const english = await prisma.locale.upsert({
    where: { bcp47Tag: "en-US" },
    update: {},
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
      nativeName: "español latinoamericano"
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
    await prisma.rssFeedConfig.upsert({
      where: {
        targetLocaleId_readingLevelId: {
          targetLocaleId: spanish.id,
          readingLevelId: levelRows.get(level.key)!
        }
      },
      update: {
        slug: `latam-${level.key.replaceAll("_", "-")}`,
        title: `LingoLens ${level.displayName} Spanish`,
        description: `Published ${level.displayName.toLowerCase()} readings in Latin American Spanish.`
      },
      create: {
        targetLocaleId: spanish.id,
        readingLevelId: levelRows.get(level.key)!,
        slug: `latam-${level.key.replaceAll("_", "-")}`,
        title: `LingoLens ${level.displayName} Spanish`,
        description: `Published ${level.displayName.toLowerCase()} readings in Latin American Spanish.`
      }
    });
  }

  const media = await prisma.mediaAsset.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: {
      sourceUrl: "https://images.unsplash.com/photo-1508519829430-40f7d7d161b4?auto=format&fit=crop&w=1400&q=80"
    },
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      storageProvider: "external",
      publicUrl:
        "https://images.unsplash.com/photo-1508519829430-40f7d7d161b4?auto=format&fit=crop&w=1400&q=80",
      sourceUrl: "https://images.unsplash.com/photo-1508519829430-40f7d7d161b4?auto=format&fit=crop&w=1400&q=80",
      altText: "Bright orange marigold flowers and candles for Día de Muertos.",
      caption: "A traditional altar uses candles and cempasúchil flowers to welcome memory."
    }
  });

  const content = await prisma.contentItem.upsert({
    where: { slug: "tradiciones-de-dia-de-muertos" },
    update: {},
    create: {
      slug: "tradiciones-de-dia-de-muertos",
      contentType: "lesson_text",
      status: "published",
      sourceLocaleId: english.id,
      sourceTitle: "Traditions of Día de Muertos",
      sourceSubtitle: "A short cultural reading about memory, flowers, and family altars.",
      sourceBody: sampleBody,
      sourceName: "LingoLens Studio",
      sourceUrl: "https://example.com/dia-de-muertos",
      originalAuthor: "LingoLens editors",
      originalPublicationDate: new Date("2024-10-24T12:00:00.000Z"),
      headerMediaAssetId: media.id,
      publishedAt: new Date("2024-10-24T12:00:00.000Z")
    }
  });

  await prisma.contentRightsRecord.upsert({
    where: { contentItemId: content.id },
    update: {},
    create: {
      contentItemId: content.id,
      textRightsStatus: "original_owned",
      imageRightsStatus: "unreviewed",
      attributionText: "Sample content created for LingoLens MVP."
    }
  });

  await prisma.factBank.upsert({
    where: { contentItemId: content.id },
    update: {},
    create: {
      contentItemId: content.id,
      facts: [
        "Día de Muertos is observed on November 1 and 2.",
        "Families prepare ofrendas to remember loved ones who have died.",
        "Ofrendas can include photos, candles, favorite foods, pan de muerto, and cempasúchil."
      ],
      entities: ["Día de Muertos", "Mexico", "Mexican communities"],
      dates: ["November 1", "November 2"],
      numbers: ["1", "2"],
      quotes: [],
      sensitiveTopics: ["death", "family remembrance"],
      preservationNotes: ["Keep the tone respectful and avoid presenting the holiday as only sad."]
    }
  });

  const sampleAdaptations = {
    super_beginner: {
      title: "Día de Muertos en familia",
      summary: "Una familia recuerda con amor.",
      bodyMarkdown:
        "El Día de Muertos es una fiesta en México. Es el 1 y el 2 de noviembre.\n\nUna familia recuerda a personas que ama. La familia hace una mesa. La mesa se llama **ofrenda**.\n\nEn la mesa hay fotos, velas, pan y flores naranjas. Las flores se llaman **cempasúchil**.\n\nLa familia dice: te recordamos. Es un día de amor.",
      checkTitle: "Día de Muertos with family",
      checkSummary: "A family remembers with love.",
      checkBodyMarkdown:
        "Día de Muertos is a holiday in Mexico. It is on November 1 and 2.\n\nA family remembers people it loves. The family makes a table. The table is called an **ofrenda**.\n\nOn the table there are photos, candles, bread, and orange flowers. The flowers are called **cempasúchil**.\n\nThe family says: we remember you. It is a day of love.",
      vocabulary: [
        { term: "ofrenda", meaning_en: "offering or family altar", part_of_speech: "noun" },
        { term: "recordar", meaning_en: "to remember", part_of_speech: "verb" }
      ]
    },
    beginner: {
      title: "Tradiciones de Día de Muertos",
      summary:
        "Una celebración mexicana ayuda a las familias a recordar a personas queridas.",
      bodyMarkdown:
        "El Día de Muertos es una celebración de México. Se celebra el 1 y 2 de noviembre. En estos días, muchas familias recuerdan a personas queridas que murieron.\n\nLas familias preparan una **ofrenda**. Una ofrenda es una mesa especial. Puede tener fotos, velas, pan de muerto, comida favorita y flores naranjas de cempasúchil.\n\nLa celebración no es solo triste. También habla de amor, memoria y familia. Cada familia prepara la ofrenda a su manera.",
      checkTitle: "Día de Muertos traditions",
      checkSummary:
        "A Mexican celebration helps families remember loved ones.",
      checkBodyMarkdown:
        "Día de Muertos is a celebration from Mexico. It is celebrated on November 1 and 2. On these days, many families remember loved ones who died.\n\nFamilies prepare an **ofrenda**. An ofrenda is a special table. It can have photos, candles, pan de muerto, favorite food, and orange cempasúchil flowers.\n\nThe celebration is not only sad. It also speaks about love, memory, and family. Each family prepares the ofrenda in its own way.",
      vocabulary: [
        { term: "querido", meaning_en: "loved, dear", part_of_speech: "adjective" },
        { term: "recordar", meaning_en: "to remember", part_of_speech: "verb" },
        { term: "ofrenda", meaning_en: "offering or family altar", part_of_speech: "noun" }
      ]
    },
    intermediate: {
      title: "Cómo las ofrendas mantienen viva la memoria",
      summary:
        "El Día de Muertos combina duelo, hospitalidad y memoria familiar en una tradición profundamente visual.",
      bodyMarkdown:
        "En México y en muchas comunidades mexicanas del mundo, el Día de Muertos transforma la memoria en una práctica visible. La celebración, que ocurre el 1 y 2 de noviembre, invita a las familias a recibir simbólicamente a sus seres queridos fallecidos.\n\nLa ofrenda es el centro de esta bienvenida. Puede incluir fotografías, velas, pan de muerto, comidas favoritas y flores de cempasúchil. El color intenso y el aroma de estas flores se interpretan como una guía para que los espíritus encuentren el camino a casa.\n\nAunque la muerte está presente, el tono de la celebración no se reduce a la tristeza. La tradición expresa una idea más amplia: recordar también puede ser un acto generoso, cotidiano y lleno de vida.",
      checkTitle: "How ofrendas keep memory alive",
      checkSummary:
        "Día de Muertos combines grief, hospitality, and family memory in a deeply visual tradition.",
      checkBodyMarkdown:
        "In Mexico and in many Mexican communities around the world, Día de Muertos turns memory into a visible practice. The celebration, which happens on November 1 and 2, invites families to symbolically welcome their deceased loved ones.\n\nThe ofrenda is the center of this welcome. It can include photographs, candles, pan de muerto, favorite foods, and cempasúchil flowers. The intense color and scent of these flowers are understood as a guide so spirits can find the way home.\n\nAlthough death is present, the tone of the celebration is not reduced to sadness. The tradition expresses a broader idea: remembering can also be a generous, everyday act full of life.",
      vocabulary: [
        { term: "fallecido", meaning_en: "deceased", part_of_speech: "adjective" },
        { term: "cotidiano", meaning_en: "everyday", part_of_speech: "adjective" },
        { term: "guía", meaning_en: "guide", part_of_speech: "noun" }
      ]
    },
    natural: {
      title: "Día de Muertos: memoria que se prepara en casa",
      summary:
        "Las ofrendas muestran cómo una tradición familiar convierte el recuerdo en hospitalidad.",
      bodyMarkdown:
        "En México, y en comunidades mexicanas de todo el mundo, el Día de Muertos convierte el recuerdo en una forma de hospitalidad. El 1 y 2 de noviembre, muchas familias preparan ofrendas para honrar a quienes han muerto y para recibirlos, simbólicamente, de vuelta en casa.\n\nLos altares suelen reunir fotografías, velas, pan de muerto, platillos favoritos y flores de cempasúchil. Según la tradición, el color y el aroma de esas flores ayudan a marcar el camino de regreso. Cada familia organiza la ofrenda a su manera, con objetos íntimos que cuentan una historia particular.\n\nPor eso la celebración no se entiende únicamente como un ritual de duelo. También es una afirmación de continuidad: los vínculos permanecen, la memoria se cuida y la ausencia encuentra un lugar en la vida familiar.",
      checkTitle: "Día de Muertos: memory prepared at home",
      checkSummary:
        "Ofrendas show how a family tradition turns remembrance into hospitality.",
      checkBodyMarkdown:
        "In Mexico, and in Mexican communities around the world, Día de Muertos turns remembrance into a form of hospitality. On November 1 and 2, many families prepare ofrendas to honor those who have died and to receive them, symbolically, back home.\n\nThe altars often bring together photographs, candles, pan de muerto, favorite dishes, and cempasúchil flowers. According to tradition, the color and scent of those flowers help mark the path back. Each family organizes the ofrenda in its own way, with intimate objects that tell a particular story.\n\nThat is why the celebration is not understood only as a ritual of grief. It is also an affirmation of continuity: bonds remain, memory is cared for, and absence finds a place in family life.",
      vocabulary: [
        { term: "hospitalidad", meaning_en: "hospitality", part_of_speech: "noun" },
        { term: "duelo", meaning_en: "grief, mourning", part_of_speech: "noun" },
        { term: "vínculo", meaning_en: "bond", part_of_speech: "noun" }
      ]
    }
  };

  for (const [key, adaptation] of Object.entries(sampleAdaptations)) {
    const imageCaption = "Un altar tradicional usa velas y flores de cempasúchil para recibir la memoria.";
    await prisma.adaptation.upsert({
      where: {
        contentItemId_targetLocaleId_readingLevelId: {
          contentItemId: content.id,
          targetLocaleId: spanish.id,
          readingLevelId: levelRows.get(key)!
        }
      },
      update: {
        status: "published",
        title: adaptation.title,
        summary: adaptation.summary,
        imageCaption,
        bodyMarkdown: adaptation.bodyMarkdown,
        checkTranslationLocale: "en-US",
        checkTranslationTitle: adaptation.checkTitle,
        checkTranslationSummary: adaptation.checkSummary,
        checkTranslationImageCaption: "A traditional altar uses candles and cempasúchil flowers to welcome memory.",
        checkTranslationBodyMarkdown: adaptation.checkBodyMarkdown,
        bodyBlocks: adaptation.bodyMarkdown.split("\n\n").map((text) => ({ type: "paragraph", text })),
        vocabulary: adaptation.vocabulary,
        comprehensionQuestions: [
          {
            question: "¿Qué prepara la familia?",
            answer: "Prepara una ofrenda con fotos, velas, comida y flores.",
            difficulty: key
          },
          {
            question: "¿Cuándo se celebra el Día de Muertos?",
            answer: "Se celebra el 1 y 2 de noviembre.",
            difficulty: key
          }
        ],
        estimatedReadingTimeSeconds: key === "super_beginner" ? 60 : key === "beginner" ? 100 : 180,
        estimatedDifficulty: { label: key },
        qaStatus: "passed",
        qaReport: {
          notes: ["Essential dates and cultural details preserved.", "Neutral Latin American Spanish."]
        },
        reviewedBy: "seed",
        reviewedAt: new Date("2024-10-24T12:00:00.000Z"),
        publishedAt: new Date("2024-10-24T12:00:00.000Z")
      },
      create: {
        contentItemId: content.id,
        targetLocaleId: spanish.id,
        readingLevelId: levelRows.get(key)!,
        status: "published",
        title: adaptation.title,
        summary: adaptation.summary,
        imageCaption,
        bodyMarkdown: adaptation.bodyMarkdown,
        checkTranslationLocale: "en-US",
        checkTranslationTitle: adaptation.checkTitle,
        checkTranslationSummary: adaptation.checkSummary,
        checkTranslationImageCaption: "A traditional altar uses candles and cempasúchil flowers to welcome memory.",
        checkTranslationBodyMarkdown: adaptation.checkBodyMarkdown,
        bodyBlocks: adaptation.bodyMarkdown.split("\n\n").map((text) => ({ type: "paragraph", text })),
        vocabulary: adaptation.vocabulary,
        comprehensionQuestions: [
          {
            question: "¿Qué prepara la familia?",
            answer: "Prepara una ofrenda con fotos, velas, comida y flores.",
            difficulty: key
          },
          {
            question: "¿Cuándo se celebra el Día de Muertos?",
            answer: "Se celebra el 1 y 2 de noviembre.",
            difficulty: key
          }
        ],
        estimatedReadingTimeSeconds: key === "super_beginner" ? 60 : key === "beginner" ? 100 : 180,
        estimatedDifficulty: { label: key },
        qaStatus: "passed",
        qaReport: {
          notes: ["Essential dates and cultural details preserved.", "Neutral Latin American Spanish."]
        },
        reviewedBy: "seed",
        reviewedAt: new Date("2024-10-24T12:00:00.000Z"),
        publishedAt: new Date("2024-10-24T12:00:00.000Z")
      }
    });
  }

  await prisma.promptTemplate.upsert({
    where: { key_version: { key: "extract_fact_bank", version: "v1" } },
    update: {},
    create: {
      key: "extract_fact_bank",
      version: "v1",
      modelDefault: openAIModel(),
      systemInstructions: "Extract protected facts from source content for language-learning adaptation.",
      userTemplate: "Source title: {{title}}\n\nSource body:\n{{body}}",
      outputSchema: { type: "object" }
    }
  });

  await prisma.promptTemplate.upsert({
    where: { key_version: { key: "generate_adaptation", version: "v3" } },
    update: {
      modelDefault: openAIModel(),
      systemInstructions:
        `Act as a language-learning editor. Use the target locale exactly, preserve protected facts, follow these strict level targets, and provide an English check translation of the generated adaptation: ${levelTargetsSummary()}`,
      userTemplate:
        "Create a {{level}} adaptation for {{locale}} using the source, fact bank, and level guidance. Then translate that generated adaptation into English for check_translation.",
      outputSchema: { type: "object" }
    },
    create: {
      key: "generate_adaptation",
      version: "v3",
      modelDefault: openAIModel(),
      systemInstructions:
        `Act as a language-learning editor. Use the target locale exactly, preserve protected facts, follow these strict level targets, and provide an English check translation of the generated adaptation: ${levelTargetsSummary()}`,
      userTemplate:
        "Create a {{level}} adaptation for {{locale}} using the source, fact bank, and level guidance. Then translate that generated adaptation into English for check_translation.",
      outputSchema: { type: "object" }
    }
  });

  console.log("Seeded LingoLens data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
