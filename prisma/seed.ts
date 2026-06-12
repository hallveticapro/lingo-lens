import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
];

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
      update: {},
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
    await prisma.rssFeedConfig.upsert({
      where: {
        targetLocaleId_readingLevelId: {
          targetLocaleId: spanish.id,
          readingLevelId: levelRows.get(level.key)!
        }
      },
      update: {},
      create: {
        targetLocaleId: spanish.id,
        readingLevelId: levelRows.get(level.key)!,
        slug: `es-419-${level.key.replaceAll("_", "-")}`,
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
      summary: "Las familias recuerdan con flores, comida y velas.",
      bodyMarkdown:
        "Día de Muertos es una celebración de México. Es el 1 y el 2 de noviembre.\n\nLas familias recuerdan a personas queridas. Preparan una mesa especial. Esta mesa se llama **ofrenda**.\n\nEn la ofrenda hay fotos, velas, comida y flores naranjas. Las flores se llaman **cempasúchil**.\n\nNo es solo un día triste. Es un día de memoria, amor y familia.",
      vocabulary: [
        { term: "ofrenda", meaning_en: "offering or family altar", part_of_speech: "noun" },
        { term: "velas", meaning_en: "candles", part_of_speech: "noun" },
        { term: "recordar", meaning_en: "to remember", part_of_speech: "verb" }
      ]
    },
    beginner: {
      title: "Tradiciones de Día de Muertos",
      summary:
        "Una mirada a una celebración mexicana que honra a los seres queridos con altares, flores y pan de muerto.",
      bodyMarkdown:
        "El Día de Muertos es una celebración mexicana muy especial. Se celebra el 1 y 2 de noviembre. Durante estos días, las familias recuerdan a las personas que ya no están vivas.\n\nNo es un día solamente triste. Es un día de alegría, color y memoria. Muchas familias preparan una bienvenida especial en sus casas.\n\n## La ofrenda\n\nEl centro de la celebración es la ofrenda o altar. En el altar, las familias ponen fotos, comida, pan de muerto, velas y flores de cempasúchil.\n\nLas flores naranjas ayudan a crear un camino simbólico para los espíritus. Cada familia tiene detalles diferentes, pero la idea principal es la misma: recordar con amor.",
      vocabulary: [
        { term: "alegría", meaning_en: "joy, happiness", part_of_speech: "noun" },
        { term: "recordar", meaning_en: "to remember", part_of_speech: "verb" },
        { term: "alma", meaning_en: "soul", part_of_speech: "noun" }
      ]
    },
    intermediate: {
      title: "Cómo las ofrendas mantienen viva la memoria",
      summary:
        "El Día de Muertos combina duelo, hospitalidad y memoria familiar en una tradición profundamente visual.",
      bodyMarkdown:
        "En México y en muchas comunidades mexicanas del mundo, el Día de Muertos transforma la memoria en una práctica visible. La celebración, que ocurre el 1 y 2 de noviembre, invita a las familias a recibir simbólicamente a sus seres queridos fallecidos.\n\nLa ofrenda es el centro de esta bienvenida. Puede incluir fotografías, velas, pan de muerto, comidas favoritas y flores de cempasúchil. El color intenso y el aroma de estas flores se interpretan como una guía para que los espíritus encuentren el camino a casa.\n\nAunque la muerte está presente, el tono de la celebración no se reduce a la tristeza. La tradición expresa una idea más amplia: recordar también puede ser un acto generoso, cotidiano y lleno de vida.",
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
      update: { imageCaption },
      create: {
        contentItemId: content.id,
        targetLocaleId: spanish.id,
        readingLevelId: levelRows.get(key)!,
        status: "published",
        title: adaptation.title,
        summary: adaptation.summary,
        imageCaption,
        bodyMarkdown: adaptation.bodyMarkdown,
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
        estimatedReadingTimeSeconds: key === "super_beginner" ? 90 : 180,
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
      modelDefault: process.env.OPENAI_MODEL ?? "gpt-5.1",
      systemInstructions: "Extract protected facts from source content for language-learning adaptation.",
      userTemplate: "Source title: {{title}}\n\nSource body:\n{{body}}",
      outputSchema: { type: "object" }
    }
  });

  await prisma.promptTemplate.upsert({
    where: { key_version: { key: "generate_adaptation", version: "v1" } },
    update: {},
    create: {
      key: "generate_adaptation",
      version: "v1",
      modelDefault: process.env.OPENAI_MODEL ?? "gpt-5.1",
      systemInstructions:
        "Act as a language-learning editor. Use the target locale exactly, preserve protected facts, and return valid JSON.",
      userTemplate: "Create a {{level}} adaptation for {{locale}} using the source and fact bank.",
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
