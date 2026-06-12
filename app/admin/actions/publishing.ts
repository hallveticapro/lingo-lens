"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { requireRightsApproval } from "@/lib/env";
import { canPublishWithRights, hasPublishableAdaptations } from "@/lib/publishing";
import { prisma } from "@/lib/prisma";

async function canPublish(contentItemId: string) {
  const rights = await prisma.contentRightsRecord.findUnique({ where: { contentItemId } });
  return canPublishWithRights(rights, requireRightsApproval());
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
  if (!hasPublishableAdaptations(publishableCount)) {
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
