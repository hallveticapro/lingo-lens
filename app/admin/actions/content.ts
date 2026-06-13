"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { queueGenerationJob, queueRegenerationJob } from "@/lib/generation";
import { parseQuestions, parseVocabulary } from "@/lib/parsers";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { adaptationEditSchema, arrayFromForm, contentFormSchema, stringFromForm } from "@/lib/validators";

function formPayload(formData: FormData) {
  return {
    sourceTitle: stringFromForm(formData, "sourceTitle"),
    sourceSubtitle: stringFromForm(formData, "sourceSubtitle"),
    sourceLocale: stringFromForm(formData, "sourceLocale") || "en-US",
    contentType: stringFromForm(formData, "contentType"),
    sourceName: stringFromForm(formData, "sourceName"),
    sourceUrl: stringFromForm(formData, "sourceUrl"),
    originalAuthor: stringFromForm(formData, "originalAuthor"),
    originalPublicationDate: stringFromForm(formData, "originalPublicationDate"),
    headerImageUrl: stringFromForm(formData, "headerImageUrl"),
    imageAltText: stringFromForm(formData, "imageAltText"),
    imageCaption: stringFromForm(formData, "imageCaption"),
    internalNotes: stringFromForm(formData, "internalNotes"),
    sourceBody: stringFromForm(formData, "sourceBody"),
    targetLocale: stringFromForm(formData, "targetLocale") || "es-419",
    levels: arrayFromForm(formData, "levels")
  };
}

export async function createContentAction(formData: FormData) {
  const session = await requireAdmin();
  const parsedPayload = contentFormSchema.safeParse(formPayload(formData));
  if (!parsedPayload.success) redirect("/admin/content/new?validation=content");
  const payload = parsedPayload.data;
  const intent = stringFromForm(formData, "intent");
  const sourceLocale = await prisma.locale.findUniqueOrThrow({ where: { bcp47Tag: payload.sourceLocale } });
  let slug = slugify(payload.sourceTitle);
  const existing = await prisma.contentItem.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const media = payload.headerImageUrl
    ? await prisma.mediaAsset.create({
        data: {
          storageProvider: "external",
          publicUrl: payload.headerImageUrl,
          sourceUrl: payload.headerImageUrl,
          altText: payload.imageAltText || payload.sourceTitle,
          caption: payload.imageCaption || null,
          rightsStatus: "unreviewed"
        }
      })
    : null;

  const content = await prisma.contentItem.create({
    data: {
      slug,
      contentType: payload.contentType,
      status: "draft",
      sourceLocaleId: sourceLocale.id,
      sourceTitle: payload.sourceTitle,
      sourceSubtitle: payload.sourceSubtitle || null,
      sourceBody: payload.sourceBody,
      sourceName: payload.sourceName || null,
      sourceUrl: payload.sourceUrl || null,
      originalAuthor: payload.originalAuthor || null,
      originalPublicationDate: payload.originalPublicationDate ? new Date(payload.originalPublicationDate) : null,
      headerMediaAssetId: media?.id,
      internalNotes: payload.internalNotes || null,
      rightsRecord: {
        create: {
          textRightsStatus: "unreviewed",
          imageRightsStatus: media ? "unreviewed" : "not_applicable"
        }
      }
    }
  });

  if (intent === "generate") {
    await queueGenerationJob(content.id, payload.targetLocale, payload.levels, session.email);
    revalidatePath("/admin");
    redirect("/admin?generation=queued");
  }

  revalidatePath("/admin");
  redirect(`/admin/content/${content.id}/edit`);
}

export async function updateContentAction(contentId: string, formData: FormData) {
  const session = await requireAdmin();
  const parsedPayload = contentFormSchema.safeParse(formPayload(formData));
  if (!parsedPayload.success) redirect(`/admin/content/${contentId}/edit?validation=content`);
  const payload = parsedPayload.data;
  const intent = stringFromForm(formData, "intent");
  const sourceLocale = await prisma.locale.findUniqueOrThrow({ where: { bcp47Tag: payload.sourceLocale } });

  const current = await prisma.contentItem.findUniqueOrThrow({
    where: { id: contentId },
    include: { headerMediaAsset: true }
  });

  let mediaId = current.headerMediaAssetId;
  const currentImageSource = current.headerMediaAsset?.sourceUrl ?? current.headerMediaAsset?.publicUrl;
  if (payload.headerImageUrl && payload.headerImageUrl !== currentImageSource) {
    const media = await prisma.mediaAsset.create({
      data: {
        storageProvider: "external",
        publicUrl: payload.headerImageUrl,
        sourceUrl: payload.headerImageUrl,
        altText: payload.imageAltText || payload.sourceTitle,
        caption: payload.imageCaption || null,
        rightsStatus: "unreviewed"
      }
    });
    mediaId = media.id;
  } else if (mediaId && current.headerMediaAsset) {
    await prisma.mediaAsset.update({
      where: { id: mediaId },
      data: {
        altText: payload.imageAltText || payload.sourceTitle,
        caption: payload.imageCaption || null
      }
    });
  }

  await prisma.contentItem.update({
    where: { id: contentId },
    data: {
      contentType: payload.contentType,
      sourceLocaleId: sourceLocale.id,
      sourceTitle: payload.sourceTitle,
      sourceSubtitle: payload.sourceSubtitle || null,
      sourceBody: payload.sourceBody,
      sourceName: payload.sourceName || null,
      sourceUrl: payload.sourceUrl || null,
      originalAuthor: payload.originalAuthor || null,
      originalPublicationDate: payload.originalPublicationDate ? new Date(payload.originalPublicationDate) : null,
      headerMediaAssetId: mediaId,
      internalNotes: payload.internalNotes || null
    }
  });

  if (intent === "generate") {
    await queueGenerationJob(contentId, payload.targetLocale, payload.levels, session.email);
    revalidatePath("/admin");
    redirect("/admin?generation=queued");
  }

  revalidatePath("/admin");
  redirect(`/admin/content/${contentId}/edit`);
}

export async function saveAdaptationAction(adaptationId: string, formData: FormData) {
  const session = await requireAdmin();
  const current = await prisma.adaptation.findUniqueOrThrow({
    where: { id: adaptationId },
    include: { _count: { select: { revisions: true } } }
  });

  const parsedPayload = adaptationEditSchema.safeParse({
    title: stringFromForm(formData, "title"),
    subtitle: stringFromForm(formData, "subtitle"),
    summary: stringFromForm(formData, "summary"),
    bodyMarkdown: stringFromForm(formData, "bodyMarkdown"),
    checkTranslationTitle: stringFromForm(formData, "checkTranslationTitle"),
    checkTranslationSummary: stringFromForm(formData, "checkTranslationSummary"),
    checkTranslationBodyMarkdown: stringFromForm(formData, "checkTranslationBodyMarkdown"),
    vocabularyText: stringFromForm(formData, "vocabularyText"),
    questionsText: stringFromForm(formData, "questionsText"),
    editorNotes: stringFromForm(formData, "editorNotes")
  });
  if (!parsedPayload.success) {
    redirect(`/admin/content/${current.contentItemId}/review?level=${current.readingLevelId}&validation=review`);
  }
  const parsed = parsedPayload.data;

  const updated = await prisma.adaptation.update({
    where: { id: adaptationId },
    data: {
      title: parsed.title,
      subtitle: parsed.subtitle || null,
      summary: parsed.summary || null,
      bodyMarkdown: parsed.bodyMarkdown,
      checkTranslationLocale: "en-US",
      checkTranslationTitle: parsed.checkTranslationTitle || null,
      checkTranslationSummary: parsed.checkTranslationSummary || null,
      checkTranslationBodyMarkdown: parsed.checkTranslationBodyMarkdown || null,
      vocabulary: parseVocabulary(parsed.vocabularyText ?? ""),
      comprehensionQuestions: parseQuestions(parsed.questionsText ?? ""),
      editorNotes: parsed.editorNotes || null,
      status: current.status === "published" ? "published" : "needs_review",
      reviewedBy: session.email,
      reviewedAt: new Date()
    }
  });

  await prisma.adaptationRevision.create({
    data: {
      adaptationId,
      revisionNumber: current._count.revisions + 1,
      title: updated.title,
      subtitle: updated.subtitle,
      summary: updated.summary,
      imageCaption: updated.imageCaption,
      bodyMarkdown: updated.bodyMarkdown,
      checkTranslationLocale: updated.checkTranslationLocale,
      checkTranslationTitle: updated.checkTranslationTitle,
      checkTranslationSubtitle: updated.checkTranslationSubtitle,
      checkTranslationSummary: updated.checkTranslationSummary,
      checkTranslationImageCaption: updated.checkTranslationImageCaption,
      checkTranslationBodyMarkdown: updated.checkTranslationBodyMarkdown,
      bodyBlocks: updated.bodyBlocks as Prisma.InputJsonValue,
      vocabulary: updated.vocabulary as Prisma.InputJsonValue,
      comprehensionQuestions: updated.comprehensionQuestions as Prisma.InputJsonValue,
      annotations: updated.annotations as Prisma.InputJsonValue,
      changeReason: "Manual edit",
      changedBy: session.email
    }
  });

  revalidatePath("/admin");
  redirect(`/admin/content/${updated.contentItemId}/review?level=${updated.readingLevelId}`);
}

export async function regenerateAdaptationAction(adaptationId: string) {
  const session = await requireAdmin();
  const adaptation = await prisma.adaptation.findUniqueOrThrow({ where: { id: adaptationId } });
  await queueRegenerationJob(adaptationId, session.email);
  revalidatePath("/admin");
  redirect(`/admin/content/${adaptation.contentItemId}/review?generation=queued`);
}

export async function archiveAdaptationAction(adaptationId: string) {
  await requireAdmin();
  const adaptation = await prisma.adaptation.update({
    where: { id: adaptationId },
    data: { status: "archived", archivedAt: new Date() }
  });
  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/admin/content/${adaptation.contentItemId}/review`);
}

export async function archiveContentAction(contentItemId: string) {
  await requireAdmin();
  await prisma.contentItem.update({
    where: { id: contentItemId },
    data: { status: "archived", archivedAt: new Date() }
  });
  await prisma.adaptation.updateMany({
    where: { contentItemId },
    data: { status: "archived", archivedAt: new Date() }
  });
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}
