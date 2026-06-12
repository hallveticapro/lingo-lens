import { updateContentAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/AdminChrome";
import { ContentForm } from "@/components/ContentForm";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [content, locales, targetLocales, levels] = await Promise.all([
    prisma.contentItem.findUniqueOrThrow({
      where: { id },
      include: { headerMediaAsset: true, sourceLocale: true }
    }),
    prisma.locale.findMany({ where: { isEnabledAsSource: true }, orderBy: { displayNameEn: "asc" } }),
    prisma.locale.findMany({ where: { isEnabledAsTarget: true }, orderBy: { displayNameEn: "asc" } }),
    prisma.readingLevel.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } })
  ]);

  return (
    <AdminShell>
      <div style={{ maxWidth: 900 }}>
        <h1 className="admin-title">Edit Source Content</h1>
        <p className="muted" style={{ fontSize: 18 }}>
          Update source metadata, then save or regenerate learner versions.
        </p>
        <ContentForm
          action={updateContentAction.bind(null, id)}
          locales={locales}
          targetLocales={targetLocales}
          levels={levels}
          content={content}
        />
      </div>
    </AdminShell>
  );
}
