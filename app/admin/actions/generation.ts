"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { retryGenerationJob } from "@/lib/generation";
import { prisma } from "@/lib/prisma";

export async function clearGenerationErrorsAction() {
  await requireAdmin();
  await prisma.generationJob.updateMany({
    where: { status: "failed" },
    data: {
      status: "canceled",
      finishedAt: new Date()
    }
  });
  revalidatePath("/admin");
}

export async function retryGenerationJobAction(jobId: string) {
  const session = await requireAdmin();
  await retryGenerationJob(jobId, session.email);
  revalidatePath("/admin");
  redirect("/admin?generation=queued");
}
