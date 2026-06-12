import OpenAI from "openai";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { isProduction, openAIApiKey, openAIModel } from "@/lib/env";
import { prisma } from "@/lib/prisma";

function stringifyFactValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = ["text", "quote", "value", "number", "name", "label", "description", "summary"]
      .map((key) => record[key])
      .find((entry) => typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean");

    if (preferred !== undefined) return String(preferred);
    return JSON.stringify(value);
  }
  return "";
}

function arrayInput(value: unknown) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

const flexibleStringArray = z.preprocess(
  arrayInput,
  z.array(z.unknown()).transform((values) => values.map(stringifyFactValue).map((value) => value.trim()).filter(Boolean))
);

function flexibleRecordArray(stringRecord: (text: string) => Record<string, unknown>) {
  return z.preprocess(
    arrayInput,
    z.array(z.unknown()).transform((values) =>
      values
        .map((value) => {
          if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
          const text = stringifyFactValue(value).trim();
          return text ? stringRecord(text) : null;
        })
        .filter((value): value is Record<string, unknown> => Boolean(value))
    )
  );
}

const generatedSchema = z.object({
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  image_caption: z.string().nullable().optional(),
  body_markdown: z.string(),
  body_blocks: flexibleRecordArray((text) => ({ type: "paragraph", text })),
  vocabulary: flexibleRecordArray((text) => ({ term: text })),
  comprehension_questions: flexibleRecordArray((text) => ({ question: text, answer: "" })),
  content_warning: z.string().nullable().optional(),
  editor_notes: flexibleStringArray,
  fact_preservation_notes: flexibleStringArray
});

type GeneratedPayload = z.infer<typeof generatedSchema>;

const factBankSchema = z.object({
  facts: flexibleStringArray,
  entities: flexibleStringArray,
  dates: flexibleStringArray,
  numbers: flexibleStringArray,
  quotes: flexibleStringArray,
  sensitive_topics: flexibleStringArray,
  preservation_notes: flexibleStringArray
});

type FactBankPayload = z.infer<typeof factBankSchema>;

function configuredApiKey() {
  return openAIApiKey();
}

function openaiClient() {
  const apiKey = configuredApiKey();
  return apiKey ? new OpenAI({ apiKey }) : null;
}

function modelName() {
  return openAIModel();
}

function errorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return {
      name: "UnknownError",
      message: String(error)
    };
  }

  const maybeApiError = error as Error & {
    code?: unknown;
    status?: unknown;
    type?: unknown;
    param?: unknown;
    request_id?: unknown;
    requestID?: unknown;
  };

  const details = {
    name: error.name,
    message: error.message,
    code: typeof maybeApiError.code === "string" ? maybeApiError.code : undefined,
    status: typeof maybeApiError.status === "number" ? maybeApiError.status : undefined,
    type: typeof maybeApiError.type === "string" ? maybeApiError.type : undefined,
    param: typeof maybeApiError.param === "string" ? maybeApiError.param : undefined,
    requestId:
      typeof maybeApiError.request_id === "string"
        ? maybeApiError.request_id
        : typeof maybeApiError.requestID === "string"
          ? maybeApiError.requestID
          : undefined,
    stack: isProduction() ? undefined : error.stack
  };

  return Object.fromEntries(Object.entries(details).filter(([, value]) => value !== undefined));
}

function errorMessage(error: unknown, fallback: string) {
  const details = errorDetails(error);
  return typeof details.message === "string" && details.message ? details.message : fallback;
}

function logGenerationError(message: string, context: Record<string, unknown>, error: unknown) {
  console.error(
    JSON.stringify({
      level: "error",
      scope: "generation",
      message,
      ...context,
      error: errorDetails(error)
    })
  );
}

function logGenerationInfo(message: string, context: Record<string, unknown>) {
  console.info(
    JSON.stringify({
      level: "info",
      scope: "generation",
      message,
      ...context
    })
  );
}

function mockFactBank(sourceTitle: string, sourceBody: string): FactBankPayload {
  const sentences = sourceBody
    .split(/[.!?]\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 5);

  return {
    facts: sentences.length ? sentences : [`${sourceTitle} is the central topic.`],
    entities: [sourceTitle],
    dates: Array.from(
      sourceBody.match(/\b(?:\d{1,2}\s)?(?:January|February|March|April|May|June|July|August|September|October|November|December)\b|\b\d{4}\b/gi) ?? []
    ),
    numbers: Array.from(sourceBody.match(/\b\d+(?:[.,]\d+)?\b/g) ?? []),
    quotes: [],
    sensitive_topics: sourceBody.toLowerCase().includes("death") ? ["death"] : [],
    preservation_notes: ["Mock fact bank generated because OPENAI_API_KEY is not configured."]
  };
}

function mockAdaptation(levelKey: string, sourceTitle: string, factBank: FactBankPayload): GeneratedPayload {
  const label = {
    super_beginner: "Super Beginner",
    beginner: "Beginner",
    intermediate: "Intermediate",
    natural: "Natural"
  }[levelKey] ?? levelKey;

  const bodies: Record<string, string> = {
    super_beginner:
      `# ${sourceTitle}\n\nEste texto habla de una idea importante. La versión es corta y clara.\n\nLa información principal es fácil de seguir. Las personas, los lugares y las fechas importantes se conservan.\n\nLa meta es leer con calma y entender la idea central.`,
    beginner:
      `# ${sourceTitle}\n\nEste texto presenta un tema real en español claro. La adaptación usa oraciones directas y vocabulario común.\n\nLa idea principal se mantiene: ${factBank.facts[0] ?? "el texto conserva los datos importantes"}.\n\nTambién se cuidan los nombres, las fechas y los números para no cambiar el significado original.`,
    intermediate:
      `# ${sourceTitle}\n\nEsta versión adapta el texto original con un español más natural, pero todavía controlado para estudiantes de nivel intermedio.\n\nLa información central se organiza en párrafos claros. Un detalle importante es: ${factBank.facts[0] ?? "la adaptación conserva los hechos protegidos"}.\n\nEl objetivo es practicar lectura real sin perder precisión ni contexto.`,
    natural:
      `# ${sourceTitle}\n\nEsta adaptación ofrece una versión natural en español latinoamericano, con un tono editorial fluido y fiel al contenido de origen.\n\nEl texto mantiene los datos protegidos del banco de hechos y evita añadir información no sustentada. El resultado busca sonar auténtico sin dejar de ser útil para estudiantes avanzados.\n\nLa lectura conserva la intención, el ritmo y las relaciones principales del texto fuente.`
  };

  return {
    title: `${sourceTitle} (${label})`,
    subtitle: null,
    summary: `Adaptación ${label.toLowerCase()} en español latinoamericano.`,
    image_caption: null,
    body_markdown: bodies[levelKey] ?? bodies.beginner,
    body_blocks: [{ type: "paragraph", text: bodies[levelKey] ?? bodies.beginner }],
    vocabulary: [
      {
        term: "idea principal",
        meaning_en: "main idea",
        part_of_speech: "noun phrase",
        example_sentence: "La idea principal está clara.",
        pronunciation: null,
        romanization: null,
        notes: null
      },
      {
        term: "conservar",
        meaning_en: "to preserve",
        part_of_speech: "verb",
        example_sentence: "La adaptación conserva los datos.",
        pronunciation: null,
        romanization: null,
        notes: null
      }
    ],
    comprehension_questions: [
      {
        question: "¿Cuál es la idea principal del texto?",
        answer: "La respuesta depende del texto fuente y de los datos conservados.",
        difficulty: levelKey
      },
      {
        question: "¿Qué información debe conservar la adaptación?",
        answer: "Debe conservar personas, lugares, fechas, números y hechos importantes.",
        difficulty: levelKey
      }
    ],
    content_warning: null,
    editor_notes: ["Mock adaptation. Review before publishing."],
    fact_preservation_notes: factBank.preservation_notes
  };
}

export async function ensureFactBank(contentItemId: string) {
  const content = await prisma.contentItem.findUniqueOrThrow({
    where: { id: contentItemId },
    include: { factBank: true }
  });

  if (content.factBank) return content.factBank;

  const job = await prisma.generationJob.create({
    data: {
      contentItemId,
      jobType: "fact_bank",
      status: "running",
      model: modelName(),
      promptVersion: "v1",
      startedAt: new Date()
    }
  });

  logGenerationInfo("Fact bank generation started", {
    jobId: job.id,
    contentItemId,
    model: modelName(),
    provider: configuredApiKey() ? "openai" : "mock"
  });

  try {
    const client = openaiClient();
    let parsed = mockFactBank(content.sourceTitle, content.sourceBody);

    if (client) {
      const completion = await client.chat.completions.create({
        model: modelName(),
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extract a protected fact bank for language-learning adaptations. Return JSON with facts, entities, dates, numbers, quotes, sensitive_topics, preservation_notes."
          },
          {
            role: "user",
            content: `Title: ${content.sourceTitle}\n\nBody:\n${content.sourceBody}`
          }
        ]
      });
      parsed = factBankSchema.parse(JSON.parse(completion.choices[0]?.message.content ?? "{}"));
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          inputTokens: completion.usage?.prompt_tokens,
          outputTokens: completion.usage?.completion_tokens,
          responsePayload: parsed
        }
      });
    }

    const factBank = await prisma.factBank.create({
      data: {
        contentItemId,
        facts: parsed.facts,
        entities: parsed.entities,
        dates: parsed.dates,
        numbers: parsed.numbers,
        quotes: parsed.quotes,
        sensitiveTopics: parsed.sensitive_topics,
        preservationNotes: parsed.preservation_notes,
        generatedByJobId: job.id
      }
    });

    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: "succeeded", finishedAt: new Date() }
    });

    logGenerationInfo("Fact bank generation succeeded", {
      jobId: job.id,
      contentItemId,
      provider: client ? "openai" : "mock"
    });

    return factBank;
  } catch (error) {
    logGenerationError("Fact bank generation failed", { jobId: job.id, contentItemId, model: modelName() }, error);
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        errorMessage: errorMessage(error, "Unknown fact bank error"),
        responsePayload: { error: errorDetails(error) },
        finishedAt: new Date()
      }
    });
    throw error;
  }
}

export async function generateAdaptations(contentItemId: string, targetLocaleTag: string, levelKeys: string[]) {
  const content = await prisma.contentItem.findUniqueOrThrow({
    where: { id: contentItemId },
    include: { headerMediaAsset: true }
  });
  const targetLocale = await prisma.locale.findUniqueOrThrow({ where: { bcp47Tag: targetLocaleTag } });
  const levels = await prisma.readingLevel.findMany({
    where: { key: { in: levelKeys } },
    orderBy: { sortOrder: "asc" }
  });
  const factBank = await ensureFactBank(contentItemId);
  const factData = {
    facts: factBank.facts as string[],
    entities: factBank.entities as string[],
    dates: factBank.dates as string[],
    numbers: factBank.numbers as string[],
    quotes: factBank.quotes as string[],
    sensitive_topics: factBank.sensitiveTopics as string[],
    preservation_notes: factBank.preservationNotes as string[]
  };

  await prisma.contentItem.update({
    where: { id: contentItemId },
    data: { status: "generating" }
  });

  const job = await prisma.generationJob.create({
    data: {
      contentItemId,
      jobType: "generate_adaptations",
      status: "running",
      targetLocaleId: targetLocale.id,
      requestedReadingLevelIds: levels.map((level) => level.id),
      model: modelName(),
      promptVersion: "v1",
      requestPayload: { targetLocaleTag, levelKeys },
      startedAt: new Date()
    }
  });

  try {
    const client = openaiClient();
    logGenerationInfo("Adaptation generation started", {
      jobId: job.id,
      contentItemId,
      targetLocaleTag,
      levelKeys,
      model: modelName(),
      provider: client ? "openai" : "mock"
    });
    for (const level of levels) {
      logGenerationInfo("Adaptation level generation started", {
        jobId: job.id,
        contentItemId,
        targetLocaleTag,
        readingLevel: level.key,
        provider: client ? "openai" : "mock"
      });
      const profile = await prisma.localeLevelProfile.findUnique({
        where: {
          localeId_readingLevelId: {
            localeId: targetLocale.id,
            readingLevelId: level.id
          }
        }
      });

      if (!profile) {
        throw new Error(`Missing locale-level profile for ${targetLocaleTag} ${level.key}`);
      }

      let parsed = mockAdaptation(level.key, content.sourceTitle, factData);

      if (client) {
        const completion = await client.chat.completions.create({
          model: modelName(),
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "Act as a language-learning editor. Use neutral Latin American Spanish for es-419, preserve facts, avoid invented details, and return only JSON matching the requested schema."
            },
            {
              role: "user",
              content: JSON.stringify({
                source_title: content.sourceTitle,
                source_body: content.sourceBody,
                source_image_caption: content.headerMediaAsset?.caption ?? null,
                target_locale: targetLocaleTag,
                reading_level: level.key,
                profile,
                fact_bank: factData,
                schema:
                  "Return JSON with title, subtitle, summary, image_caption, body_markdown, body_blocks, vocabulary, comprehension_questions, content_warning, editor_notes, fact_preservation_notes. Translate image_caption when source_image_caption exists; otherwise return null."
              })
            }
          ]
        });
        parsed = generatedSchema.parse(JSON.parse(completion.choices[0]?.message.content ?? "{}"));
      }

      const created = await prisma.adaptation.upsert({
        where: {
          contentItemId_targetLocaleId_readingLevelId: {
            contentItemId,
            targetLocaleId: targetLocale.id,
            readingLevelId: level.id
          }
        },
        update: {
          status: "needs_review",
          title: parsed.title,
          subtitle: parsed.subtitle,
          summary: parsed.summary,
          imageCaption: parsed.image_caption ?? content.headerMediaAsset?.caption ?? null,
          bodyMarkdown: parsed.body_markdown,
          bodyBlocks: parsed.body_blocks as Prisma.InputJsonValue,
          vocabulary: parsed.vocabulary as Prisma.InputJsonValue,
          comprehensionQuestions: parsed.comprehension_questions as Prisma.InputJsonValue,
          contentWarning: parsed.content_warning,
          editorNotes: parsed.editor_notes.join("\n"),
          generationJobId: job.id,
          qaStatus: "passed",
          qaReport: {
            notes: ["Generated from source content plus fact bank.", ...parsed.fact_preservation_notes]
          },
          reviewedAt: null,
          reviewedBy: null,
          publishedAt: null
        },
        create: {
          contentItemId,
          targetLocaleId: targetLocale.id,
          readingLevelId: level.id,
          status: "needs_review",
          title: parsed.title,
          subtitle: parsed.subtitle,
          summary: parsed.summary,
          imageCaption: parsed.image_caption ?? content.headerMediaAsset?.caption ?? null,
          bodyMarkdown: parsed.body_markdown,
          bodyBlocks: parsed.body_blocks as Prisma.InputJsonValue,
          vocabulary: parsed.vocabulary as Prisma.InputJsonValue,
          comprehensionQuestions: parsed.comprehension_questions as Prisma.InputJsonValue,
          contentWarning: parsed.content_warning,
          editorNotes: parsed.editor_notes.join("\n"),
          generationJobId: job.id,
          qaStatus: "passed",
          qaReport: {
            notes: ["Generated from source content plus fact bank.", ...parsed.fact_preservation_notes]
          }
        }
      });

      await prisma.adaptationRevision.create({
        data: {
          adaptationId: created.id,
          revisionNumber:
            (await prisma.adaptationRevision.count({ where: { adaptationId: created.id } })) + 1,
          title: created.title,
          subtitle: created.subtitle,
          summary: created.summary,
          imageCaption: created.imageCaption,
          bodyMarkdown: created.bodyMarkdown,
          bodyBlocks: created.bodyBlocks as Prisma.InputJsonValue,
          vocabulary: created.vocabulary as Prisma.InputJsonValue,
          comprehensionQuestions: created.comprehensionQuestions as Prisma.InputJsonValue,
          annotations: created.annotations as Prisma.InputJsonValue,
          changeReason: "Generated version",
          changedBy: "system"
        }
      });

      logGenerationInfo("Adaptation level generation succeeded", {
        jobId: job.id,
        contentItemId,
        targetLocaleTag,
        readingLevel: level.key,
        adaptationId: created.id
      });
    }

    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: "succeeded", finishedAt: new Date() }
    });
    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: { status: "needs_review" }
    });
    logGenerationInfo("Adaptation generation succeeded", {
      jobId: job.id,
      contentItemId,
      targetLocaleTag,
      levelKeys
    });
  } catch (error) {
    logGenerationError(
      "Adaptation generation failed",
      { jobId: job.id, contentItemId, targetLocaleTag, levelKeys, model: modelName() },
      error
    );
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        errorMessage: errorMessage(error, "Unknown generation error"),
        responsePayload: { error: errorDetails(error) },
        finishedAt: new Date()
      }
    });
    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: { status: "needs_review" }
    });
    throw error;
  }
}

export async function regenerateAdaptation(adaptationId: string) {
  const adaptation = await prisma.adaptation.findUniqueOrThrow({
    where: { id: adaptationId },
    include: { contentItem: true, targetLocale: true, readingLevel: true }
  });
  await generateAdaptations(adaptation.contentItemId, adaptation.targetLocale.bcp47Tag, [
    adaptation.readingLevel.key
  ]);
}
