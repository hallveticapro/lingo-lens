import OpenAI from "openai";
import { Prisma } from "@prisma/client";
import type { GenerationJob } from "@prisma/client";
import { openAIApiKey, openAIModel } from "@/lib/env";
import {
  GenerationError,
  errorDetails,
  factBankSchema,
  failurePayload,
  generatedSchema,
  missingReadingLevelKeys,
  type FactBankPayload,
  type GeneratedPayload
} from "@/lib/generation/payloads";
import { guidanceForLevel, levelTargetsSummary } from "@/lib/level-guidance";
import { optimizeHeaderImageForContent } from "@/lib/media";
import { prisma } from "@/lib/prisma";

export {
  GenerationError,
  classifyGenerationError,
  missingReadingLevelKeys,
  type GenerationFailureCategory
} from "@/lib/generation/payloads";

const ADAPTATION_PROMPT_VERSION = "v3";

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
      `# ${sourceTitle}\n\nEste texto es muy corto.\n\nHabla de una idea importante: ${factBank.facts[0] ?? "algo pasa en el texto"}.\n\nLa lectura usa palabras simples. Es para entender la idea principal.`,
    beginner:
      `# ${sourceTitle}\n\nEste texto presenta un tema real con español simple.\n\nLa idea principal es esta: ${factBank.facts[0] ?? "el texto conserva los datos importantes"}.\n\nLa adaptación usa frases cortas y vocabulario común. También conserva nombres, fechas y números importantes.`,
    intermediate:
      `# ${sourceTitle}\n\nEsta versión adapta el texto original con un español claro para estudiantes intermedios.\n\nLa información central se organiza en párrafos breves, pero conserva más contexto que los niveles iniciales. Un detalle importante es: ${factBank.facts[0] ?? "la adaptación conserva los hechos protegidos"}.\n\nEl objetivo es practicar lectura real sin perder precisión ni contexto.`,
    natural:
      `# ${sourceTitle}\n\nEsta versión traduce el texto fuente en español latinoamericano natural, con un tono editorial fluido y fiel al contenido de origen.\n\nEl texto mantiene los datos protegidos del banco de hechos y evita añadir información no sustentada. El resultado busca sonar como una traducción estándar, no como un resumen simplificado.\n\nLa lectura conserva la intención, el ritmo y las relaciones principales del texto fuente.`
  };
  const checkTranslations: Record<string, string> = {
    super_beginner:
      `# ${sourceTitle}\n\nThis text is very short.\n\nIt talks about one important idea: ${factBank.facts[0] ?? "something happens in the text"}.\n\nThe reading uses simple words. It is for understanding the main idea.`,
    beginner:
      `# ${sourceTitle}\n\nThis text presents a real topic in simple Spanish.\n\nThe main idea is this: ${factBank.facts[0] ?? "the text keeps the important details"}.\n\nThe adaptation uses short sentences and common vocabulary. It also keeps important names, dates, and numbers.`,
    intermediate:
      `# ${sourceTitle}\n\nThis version adapts the original text in clear Spanish for intermediate students.\n\nThe central information is organized in short paragraphs, but it keeps more context than the early levels. One important detail is: ${factBank.facts[0] ?? "the adaptation preserves the protected facts"}.\n\nThe goal is to practice real reading without losing accuracy or context.`,
    natural:
      `# ${sourceTitle}\n\nThis version translates the source text into natural Latin American Spanish with a fluent editorial tone that stays faithful to the original content.\n\nThe text keeps the protected facts from the fact bank and avoids adding unsupported information. The result is meant to sound like a standard translation, not a simplified summary.\n\nThe reading preserves the source text's intent, rhythm, and main relationships.`
  };
  const bodyMarkdown = bodies[levelKey] ?? bodies.beginner;

  return {
    title: `${sourceTitle} (${label})`,
    subtitle: null,
    summary: `Adaptación ${label.toLowerCase()} en español latinoamericano.`,
    image_caption: null,
    body_markdown: bodyMarkdown,
    check_translation: {
      locale: "en-US",
      title: `${sourceTitle} (${label})`,
      subtitle: null,
      summary: `${label} adaptation in English for checking comprehension.`,
      image_caption: null,
      body_markdown: checkTranslations[levelKey] ?? checkTranslations.beginner
    },
    body_blocks: [{ type: "paragraph", text: bodyMarkdown }],
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
    const failure = failurePayload(error, "Unknown fact bank error");
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        errorCategory: failure.category,
        errorMessage: failure.message,
        responsePayload: failure,
        finishedAt: new Date()
      }
    });
    throw error;
  }
}

async function resolveGenerationInputs(contentItemId: string, targetLocaleTag: string, levelKeys: string[]) {
  const requestedLevelKeys = Array.from(new Set(levelKeys.map((key) => key.trim()).filter(Boolean)));
  if (requestedLevelKeys.length === 0) {
    throw new GenerationError("validation", "Choose at least one reading level before generating.");
  }

  const content = await prisma.contentItem.findUniqueOrThrow({
    where: { id: contentItemId },
    include: { headerMediaAsset: true }
  });
  const targetLocale = await prisma.locale.findUniqueOrThrow({ where: { bcp47Tag: targetLocaleTag } });
  const levels = await prisma.readingLevel.findMany({
    where: { key: { in: requestedLevelKeys } },
    orderBy: { sortOrder: "asc" }
  });

  const missingKeys = missingReadingLevelKeys(
    requestedLevelKeys,
    levels.map((level) => level.key)
  );
  if (missingKeys.length > 0) {
    throw new GenerationError("validation", `Unknown reading level keys: ${missingKeys.join(", ")}`, {
      requestedLevelKeys,
      missingKeys
    });
  }

  return { content, targetLocale, levels, levelKeys: requestedLevelKeys };
}

export async function queueGenerationJob(
  contentItemId: string,
  targetLocaleTag: string,
  levelKeys: string[],
  requestedBy?: string
) {
  const resolved = await resolveGenerationInputs(contentItemId, targetLocaleTag, levelKeys);

  return prisma.$transaction(async (tx) => {
    await tx.contentItem.update({
      where: { id: contentItemId },
      data: { status: "generating" }
    });

    return tx.generationJob.create({
      data: {
        contentItemId,
        jobType: "generate_adaptations",
        status: "queued",
        targetLocaleId: resolved.targetLocale.id,
        requestedReadingLevelIds: resolved.levels.map((level) => level.id),
        provider: configuredApiKey() ? "openai" : "mock",
        model: modelName(),
        promptVersion: ADAPTATION_PROMPT_VERSION,
        requestPayload: {
          targetLocaleTag,
          levelKeys: resolved.levelKeys
        },
        requestedBy
      }
    });
  });
}

export async function queueRegenerationJob(adaptationId: string, requestedBy?: string) {
  const adaptation = await prisma.adaptation.findUniqueOrThrow({
    where: { id: adaptationId },
    include: { targetLocale: true, readingLevel: true }
  });

  return prisma.$transaction(async (tx) => {
    await tx.contentItem.update({
      where: { id: adaptation.contentItemId },
      data: { status: "generating" }
    });

    return tx.generationJob.create({
      data: {
        contentItemId: adaptation.contentItemId,
        jobType: "regenerate_single_adaptation",
        status: "queued",
        targetLocaleId: adaptation.targetLocaleId,
        requestedReadingLevelIds: [adaptation.readingLevelId],
        provider: configuredApiKey() ? "openai" : "mock",
        model: modelName(),
        promptVersion: ADAPTATION_PROMPT_VERSION,
        requestPayload: {
          adaptationId,
          targetLocaleTag: adaptation.targetLocale.bcp47Tag,
          levelKeys: [adaptation.readingLevel.key]
        },
        requestedBy
      }
    });
  });
}

export async function retryGenerationJob(jobId: string, requestedBy?: string) {
  const job = await prisma.generationJob.findUniqueOrThrow({ where: { id: jobId } });
  if (!["failed", "canceled", "running"].includes(job.status)) {
    throw new GenerationError("validation", "Only failed, canceled, or stale running jobs can be retried.");
  }
  if (job.attempts >= job.maxAttempts) {
    throw new GenerationError("validation", `This job has reached its retry limit of ${job.maxAttempts} attempts.`);
  }

  await prisma.contentItem.update({
    where: { id: job.contentItemId },
    data: { status: "generating" }
  });

  return prisma.generationJob.update({
    where: { id: jobId },
    data: {
      status: "queued",
      startedAt: null,
      finishedAt: null,
      requestedBy: requestedBy ?? job.requestedBy
    }
  });
}

async function updateContentAfterGenerationFailure(contentItemId: string) {
  const adaptationCount = await prisma.adaptation.count({
    where: { contentItemId, status: { not: "archived" } }
  });

  await prisma.contentItem.update({
    where: { id: contentItemId },
    data: { status: adaptationCount > 0 ? "needs_review" : "draft" }
  });
}

export async function generateAdaptations(
  contentItemId: string,
  targetLocaleTag: string,
  levelKeys: string[],
  options: { jobId?: string } = {}
) {
  const { content, targetLocale, levels, levelKeys: requestedLevelKeys } = await resolveGenerationInputs(
    contentItemId,
    targetLocaleTag,
    levelKeys
  );
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

  const job = options.jobId
    ? await prisma.generationJob.update({
        where: { id: options.jobId },
        data: {
          status: "running",
          targetLocaleId: targetLocale.id,
          requestedReadingLevelIds: levels.map((level) => level.id),
          provider: configuredApiKey() ? "openai" : "mock",
          model: modelName(),
          promptVersion: ADAPTATION_PROMPT_VERSION,
          requestPayload: { targetLocaleTag, levelKeys: requestedLevelKeys },
          errorCategory: null,
          errorMessage: null,
          startedAt: new Date(),
          finishedAt: null
        }
      })
    : await prisma.generationJob.create({
        data: {
          contentItemId,
          jobType: "generate_adaptations",
          status: "running",
          targetLocaleId: targetLocale.id,
          requestedReadingLevelIds: levels.map((level) => level.id),
          provider: configuredApiKey() ? "openai" : "mock",
          model: modelName(),
          promptVersion: ADAPTATION_PROMPT_VERSION,
          requestPayload: { targetLocaleTag, levelKeys: requestedLevelKeys },
          attempts: 1,
          startedAt: new Date()
        }
      });

  try {
    const client = openaiClient();
    logGenerationInfo("Adaptation generation started", {
      jobId: job.id,
      contentItemId,
      targetLocaleTag,
      levelKeys: requestedLevelKeys,
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
        throw new GenerationError("validation", `Missing locale-level profile for ${targetLocaleTag} ${level.key}`);
      }

      let parsed = mockAdaptation(level.key, content.sourceTitle, factData);
      const levelGuidance = guidanceForLevel(level.key);

      if (client) {
        const completion = await client.chat.completions.create({
          model: modelName(),
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                `Act as a language-learning editor. Use the target locale exactly. For es-419, use neutral Latin American Spanish. Preserve protected facts, avoid invented details, and return only JSON matching the requested schema. Level targets are strict: ${levelTargetsSummary()}`
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
                level_guidance: levelGuidance,
                fact_bank: factData,
                check_translation_instructions:
                  "After producing the target-language adaptation, translate that generated leveled adaptation into English for learner self-checking. The English check translation must match the generated title, summary, body_markdown, and image_caption, including any simplifications or omitted details. Do not translate directly from the source article for this field.",
                schema:
                  "Return JSON with title, subtitle, summary, image_caption, body_markdown, check_translation, body_blocks, vocabulary, comprehension_questions, content_warning, editor_notes, fact_preservation_notes. check_translation must include locale: \"en-US\", title, subtitle, summary, image_caption, and body_markdown translated from the generated target-language adaptation, not directly from the source. Vocabulary entries must include term, meaning_en, and part_of_speech; for verbs, use the infinitive form as the term when the target language has one. Translate image_caption when source_image_caption exists; otherwise return null."
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
          checkTranslationLocale: parsed.check_translation?.locale ?? "en-US",
          checkTranslationTitle: parsed.check_translation?.title ?? null,
          checkTranslationSubtitle: parsed.check_translation?.subtitle ?? null,
          checkTranslationSummary: parsed.check_translation?.summary ?? null,
          checkTranslationImageCaption: parsed.check_translation?.image_caption ?? null,
          checkTranslationBodyMarkdown: parsed.check_translation?.body_markdown ?? null,
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
          checkTranslationLocale: parsed.check_translation?.locale ?? "en-US",
          checkTranslationTitle: parsed.check_translation?.title ?? null,
          checkTranslationSubtitle: parsed.check_translation?.subtitle ?? null,
          checkTranslationSummary: parsed.check_translation?.summary ?? null,
          checkTranslationImageCaption: parsed.check_translation?.image_caption ?? null,
          checkTranslationBodyMarkdown: parsed.check_translation?.body_markdown ?? null,
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
          checkTranslationLocale: created.checkTranslationLocale,
          checkTranslationTitle: created.checkTranslationTitle,
          checkTranslationSubtitle: created.checkTranslationSubtitle,
          checkTranslationSummary: created.checkTranslationSummary,
          checkTranslationImageCaption: created.checkTranslationImageCaption,
          checkTranslationBodyMarkdown: created.checkTranslationBodyMarkdown,
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
      levelKeys: requestedLevelKeys
    });
  } catch (error) {
    logGenerationError(
      "Adaptation generation failed",
      { jobId: job.id, contentItemId, targetLocaleTag, levelKeys: requestedLevelKeys, model: modelName() },
      error
    );
    const failure = failurePayload(error, "Unknown generation error");
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        errorCategory: failure.category,
        errorMessage: failure.message,
        responsePayload: failure,
        finishedAt: new Date()
      }
    });
    await updateContentAfterGenerationFailure(contentItemId);
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

function payloadRecord(job: GenerationJob) {
  return job.requestPayload && typeof job.requestPayload === "object" && !Array.isArray(job.requestPayload)
    ? (job.requestPayload as Record<string, unknown>)
    : {};
}

async function jobLocaleAndLevels(job: GenerationJob) {
  const payload = payloadRecord(job);
  const targetLocaleTag =
    typeof payload.targetLocaleTag === "string"
      ? payload.targetLocaleTag
      : job.targetLocaleId
        ? (await prisma.locale.findUniqueOrThrow({ where: { id: job.targetLocaleId } })).bcp47Tag
        : null;

  const requestedLevelIds = Array.isArray(job.requestedReadingLevelIds)
    ? job.requestedReadingLevelIds.filter((id): id is string => typeof id === "string")
    : [];
  const levelKeys = Array.isArray(payload.levelKeys)
    ? payload.levelKeys.filter((key): key is string => typeof key === "string")
    : requestedLevelIds.length
      ? (
          await prisma.readingLevel.findMany({
            where: { id: { in: requestedLevelIds } },
            orderBy: { sortOrder: "asc" }
          })
        ).map((level) => level.key)
      : [];

  if (!targetLocaleTag) {
    throw new GenerationError("validation", "Queued generation job is missing a target locale.");
  }

  return { targetLocaleTag, levelKeys };
}

export async function recoverStaleGenerationJobs(now = new Date(), staleAfterMs = 30 * 60 * 1000) {
  const staleBefore = new Date(now.getTime() - staleAfterMs);
  await prisma.$executeRaw`
    UPDATE "generation_jobs"
    SET
      "status" = 'failed'::"GenerationJobStatus",
      "errorCategory" = 'network',
      "errorMessage" = 'Generation worker stopped before finishing and retry limit was reached.',
      "responsePayload" = '{"category":"network","message":"Generation worker stopped before finishing and retry limit was reached.","guidance":"Check network access from the worker, then retry the job."}'::jsonb,
      "finishedAt" = ${now},
      "updatedAt" = NOW()
    WHERE "status" = 'running'::"GenerationJobStatus"
      AND "startedAt" < ${staleBefore}
      AND "attempts" >= "maxAttempts"
  `;
}

export async function claimNextGenerationJob(now = new Date(), staleAfterMs = 30 * 60 * 1000) {
  const staleBefore = new Date(now.getTime() - staleAfterMs);
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    UPDATE "generation_jobs"
    SET
      "status" = 'running'::"GenerationJobStatus",
      "startedAt" = NOW(),
      "finishedAt" = NULL,
      "attempts" = "attempts" + 1,
      "updatedAt" = NOW()
    WHERE "id" = (
      SELECT "id"
      FROM "generation_jobs"
      WHERE "jobType" IN (
        'generate_adaptations'::"GenerationJobType",
        'regenerate_single_adaptation'::"GenerationJobType"
      )
      AND (
        "status" = 'queued'::"GenerationJobStatus"
        OR ("status" = 'running'::"GenerationJobStatus" AND "startedAt" < ${staleBefore})
      )
      AND "attempts" < "maxAttempts"
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING "id"
  `;

  const id = rows[0]?.id;
  return id ? prisma.generationJob.findUnique({ where: { id } }) : null;
}

export async function runGenerationJob(job: GenerationJob) {
  if (job.jobType !== "generate_adaptations" && job.jobType !== "regenerate_single_adaptation") {
    const failure = failurePayload(
      new GenerationError("validation", `Unsupported generation job type: ${job.jobType}`),
      "Unsupported generation job type."
    );
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        errorCategory: failure.category,
        errorMessage: failure.message,
        responsePayload: failure,
        finishedAt: new Date()
      }
    });
    return;
  }

  const { targetLocaleTag, levelKeys } = await jobLocaleAndLevels(job);
  await generateAdaptations(job.contentItemId, targetLocaleTag, levelKeys, { jobId: job.id });
  await optimizeHeaderImageForContent(job.contentItemId);
}

export async function processNextGenerationJob() {
  await recoverStaleGenerationJobs();
  const job = await claimNextGenerationJob();
  if (!job) return false;

  try {
    await runGenerationJob(job);
  } catch {
    // generateAdaptations records the failure payload on the job.
  }

  return true;
}
