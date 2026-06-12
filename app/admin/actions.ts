"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { clearSession, createSession, requireAdmin, verifyAdminCredentials } from "@/lib/auth";
import { requireRightsApproval } from "@/lib/env";
import { generateAdaptations, regenerateAdaptation } from "@/lib/generation";
import { optimizeHeaderImageForContent } from "@/lib/media";
import { parseQuestions, parseVocabulary } from "@/lib/parsers";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { adaptationEditSchema, arrayFromForm, contentFormSchema, loginSchema, stringFromForm } from "@/lib/validators";

export type LoginState = {
  email?: string;
  error?: string;
};

export async function loginAction(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const email = stringFromForm(formData, "email");
  const password = stringFromForm(formData, "password");
  const parsed = loginSchema.safeParse({
    email,
    password
  });

  if (!parsed.success) return { email, error: "Use a valid email and password." };
  if (!(await verifyAdminCredentials(parsed.data.email, parsed.data.password))) {
    return { email, error: "Admin credentials were not accepted." };
  }

  await createSession(parsed.data.email);
  redirect("/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function clearGenerationErrorsAction() {
  await requireAdmin();
  await prisma.generationJob.updateMany({
    where: { status: "failed" },
    data: {
      status: "canceled",
      errorMessage: null,
      responsePayload: Prisma.JsonNull
    }
  });
  revalidatePath("/admin");
}

async function queueGeneration(contentItemId: string, targetLocale: string, levels: string[]) {
  await prisma.contentItem.update({
    where: { id: contentItemId },
    data: { status: "generating" }
  });

  void Promise.allSettled([
    generateAdaptations(contentItemId, targetLocale, levels),
    optimizeHeaderImageForContent(contentItemId)
  ]).then((results) => {
    const generation = results[0];
    if (generation.status !== "rejected") return;
    const error = generation.reason;
    console.error(
      JSON.stringify({
        level: "error",
        scope: "generation",
        message: "Queued generation failed",
        contentItemId,
        targetLocale,
        levels,
        error: error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) }
      })
    );
  });
}

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
  await requireAdmin();
  const payload = contentFormSchema.parse(formPayload(formData));
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
    await queueGeneration(content.id, payload.targetLocale, payload.levels);
    revalidatePath("/admin");
    redirect("/admin?generation=queued");
  }

  revalidatePath("/admin");
  redirect(`/admin/content/${content.id}/edit`);
}

export async function updateContentAction(contentId: string, formData: FormData) {
  await requireAdmin();
  const payload = contentFormSchema.parse(formPayload(formData));
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
    await queueGeneration(contentId, payload.targetLocale, payload.levels);
    revalidatePath("/admin");
    redirect("/admin?generation=queued");
  }

  revalidatePath("/admin");
  redirect(`/admin/content/${contentId}/edit`);
}

export async function saveAdaptationAction(adaptationId: string, formData: FormData) {
  const session = await requireAdmin();
  const parsed = adaptationEditSchema.parse({
    title: stringFromForm(formData, "title"),
    subtitle: stringFromForm(formData, "subtitle"),
    summary: stringFromForm(formData, "summary"),
    bodyMarkdown: stringFromForm(formData, "bodyMarkdown"),
    vocabularyText: stringFromForm(formData, "vocabularyText"),
    questionsText: stringFromForm(formData, "questionsText"),
    editorNotes: stringFromForm(formData, "editorNotes")
  });

  const current = await prisma.adaptation.findUniqueOrThrow({
    where: { id: adaptationId },
    include: { _count: { select: { revisions: true } } }
  });

  const updated = await prisma.adaptation.update({
    where: { id: adaptationId },
    data: {
      title: parsed.title,
      subtitle: parsed.subtitle || null,
      summary: parsed.summary || null,
      bodyMarkdown: parsed.bodyMarkdown,
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
  await requireAdmin();
  const adaptation = await prisma.adaptation.findUniqueOrThrow({ where: { id: adaptationId } });
  await regenerateAdaptation(adaptationId);
  revalidatePath("/admin");
  redirect(`/admin/content/${adaptation.contentItemId}/review`);
}

async function canPublish(contentItemId: string) {
  if (!requireRightsApproval()) return true;
  const rights = await prisma.contentRightsRecord.findUnique({ where: { contentItemId } });
  const approvedStatuses = [
    "original_owned",
    "licensed",
    "public_domain_verified",
    "creative_commons_allowed",
    "government_work_verified"
  ];
  const textApproved = rights ? approvedStatuses.includes(rights.textRightsStatus) : false;
  const imageApproved = rights
    ? rights.imageRightsStatus === "not_applicable" || approvedStatuses.includes(rights.imageRightsStatus)
    : false;
  return textApproved && imageApproved;
}

async function publishCounts(contentItemId: string) {
  const [published, total] = await Promise.all([
    prisma.adaptation.count({ where: { contentItemId, status: "published" } }),
    prisma.adaptation.count({ where: { contentItemId, status: { not: "archived" } } })
  ]);
  return { published, total };
}

export async function publishAdaptationAction(adaptationId: string) {
  const session = await requireAdmin();
  const adaptation = await prisma.adaptation.findUniqueOrThrow({ where: { id: adaptationId } });
  if (!(await canPublish(adaptation.contentItemId))) {
    throw new Error("Rights approval is required before publishing this adaptation.");
  }
  await prisma.adaptation.update({
    where: { id: adaptationId },
    data: {
      status: "published",
      publishedAt: adaptation.publishedAt ?? new Date(),
      reviewedBy: session.email,
      reviewedAt: new Date()
    }
  });
  await prisma.contentItem.update({
    where: { id: adaptation.contentItemId },
    data: { status: "published", publishedAt: new Date() }
  });
  revalidatePath("/");
  revalidatePath("/admin");
  const counts = await publishCounts(adaptation.contentItemId);
  redirect(`/admin?published=${counts.published}&total=${counts.total}`);
}

export async function publishAllAction(contentItemId: string) {
  const session = await requireAdmin();
  if (!(await canPublish(contentItemId))) {
    throw new Error("Rights approval is required before publishing this content item.");
  }
  const publishableCount = await prisma.adaptation.count({
    where: { contentItemId, status: { in: ["needs_review", "generated", "published"] } }
  });
  if (publishableCount === 0) {
    throw new Error("Generate at least one adaptation before publishing this content item.");
  }
  await prisma.adaptation.updateMany({
    where: { contentItemId, status: { in: ["needs_review", "generated", "published"] } },
    data: {
      status: "published",
      publishedAt: new Date(),
      reviewedBy: session.email,
      reviewedAt: new Date()
    }
  });
  await prisma.contentItem.update({
    where: { id: contentItemId },
    data: { status: "published", publishedAt: new Date() }
  });
  revalidatePath("/");
  revalidatePath("/admin");
  const counts = await publishCounts(contentItemId);
  redirect(`/admin?published=${counts.published}&total=${counts.total}`);
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
