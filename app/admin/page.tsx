import Link from "next/link";
import { AlertCircle, CheckCircle2, ChevronDown, CirclePlus, FilePlus2, Pencil, RotateCw } from "lucide-react";
import { archiveContentAction, clearGenerationErrorsAction, retryGenerationJobAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/AdminChrome";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatJobType(jobType: string) {
  return jobType.replaceAll("_", " ");
}

function formatJobStatus(status: string) {
  return status.replaceAll("_", " ");
}

function normalizeJsonDetail(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        return normalizeJsonDetail(JSON.parse(trimmed));
      } catch {
        return value;
      }
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeJsonDetail);
  }

  if (value && typeof value === "object") {
    if (value instanceof Date) return value.toISOString();
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeJsonDetail(entry)]));
  }

  return value;
}

function formatJson(value: unknown) {
  if (value === null || value === undefined) return "No structured details were captured.";
  return JSON.stringify(normalizeJsonDetail(value), null, 2);
}

function failureGuidance(value: unknown) {
  const detail = normalizeJsonDetail(value);
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    const guidance = (detail as Record<string, unknown>).guidance;
    return typeof guidance === "string" ? guidance : null;
  }
  return null;
}

type AdminDashboardProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminDashboard({ searchParams }: AdminDashboardProps) {
  await requireAdmin();
  const params = searchParams ? await searchParams : {};
  const showGenerationQueuedToast = params.generation === "queued";
  const publishedCount = typeof params.published === "string" ? Number(params.published) : null;
  const publishTotal = typeof params.total === "string" ? Number(params.total) : null;
  const showPublishedToast = Number.isFinite(publishedCount) && Number.isFinite(publishTotal);
  const [items, published, drafts, review, failedJobCount, activeJobCount, recentGenerationJobs] = await Promise.all([
    prisma.contentItem.findMany({
      include: {
        sourceLocale: true,
        adaptations: { include: { targetLocale: true, readingLevel: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: 25
    }),
    prisma.contentItem.count({ where: { status: "published" } }),
    prisma.contentItem.count({ where: { status: "draft" } }),
    prisma.contentItem.count({ where: { status: "needs_review" } }),
    prisma.generationJob.count({ where: { status: "failed" } }),
    prisma.generationJob.count({ where: { status: { in: ["queued", "running"] } } }),
    prisma.generationJob.findMany({
      where: { status: { in: ["queued", "running", "failed"] } },
      include: {
        contentItem: {
          select: {
            id: true,
            sourceTitle: true
          }
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 8
    })
  ]);

  return (
    <AdminShell>
      {showGenerationQueuedToast ? (
        <div className="toast-notice" role="status" aria-live="polite">
          Article generation queued. You can keep working while versions are created.
        </div>
      ) : null}
      {showPublishedToast ? (
        <div className="toast-notice" role="status" aria-live="polite">
          {publishedCount} out of {publishTotal} articles published. Returning to dashboard.
        </div>
      ) : null}

      <div className="admin-header">
        <div>
          <h1 className="admin-title">Content Management</h1>
          <p className="muted" style={{ fontSize: 22, margin: 0 }}>
            Review, edit, and publish language learning materials.
          </p>
        </div>
        <Link className="btn btn-primary" href="/admin/content/new">
          <FilePlus2 size={18} /> New Content
        </Link>
      </div>

      <section className="summary-grid" aria-label="Content summary">
        <div className="admin-card">
          <p className="kicker">Published</p>
          <p className="metric">{published}</p>
          <p className="muted">
            <CheckCircle2 size={16} color="var(--sage)" /> Live readings
          </p>
        </div>
        <div className="admin-card">
          <p className="kicker">Drafts</p>
          <p className="metric">{drafts}</p>
          <p className="muted">In progress</p>
        </div>
        <div className="admin-card" style={{ borderColor: "var(--terracotta)" }}>
          <p className="kicker" style={{ color: "var(--terracotta)" }}>
            Needs Review
          </p>
          <p className="metric">{review}</p>
          <p style={{ color: "var(--terracotta)" }}>Requires attention</p>
        </div>
        <div className="admin-card" style={{ borderColor: "var(--error)", background: "#fff5f3" }}>
          <p className="kicker" style={{ color: "var(--error)" }}>
            Failed Gens
          </p>
          <p className="metric">{failedJobCount}</p>
          <p style={{ color: "var(--error)" }}>
            <AlertCircle size={16} /> {activeJobCount} active
          </p>
        </div>
      </section>

      <section className="admin-card" style={{ padding: 0 }}>
        <div className="latest-heading" style={{ padding: 28 }}>
          <h2 className="section-title">Recent Content</h2>
          <form className="button-row" action="/admin/content" style={{ justifyContent: "flex-end" }}>
            <input className="input" name="q" placeholder="Search titles..." aria-label="Search titles" />
            <button className="btn btn-secondary" type="submit">
              Filter
            </button>
          </form>
        </div>
        <table className="content-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Language</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  No content exists yet. Create a source text to generate learner versions.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.sourceTitle}</strong>
                    <p className="muted" style={{ margin: "4px 0 0" }}>
                      {item.adaptations.length} adaptations
                    </p>
                  </td>
                  <td>{item.sourceLocale.displayNameEn}</td>
                  <td>
                    <span className="chip">{item.status.replaceAll("_", " ")}</span>
                  </td>
                  <td>{item.createdAt.toLocaleDateString()}</td>
                  <td>
                    <div className="button-row" style={{ justifyContent: "flex-start" }}>
                      <Link className="btn btn-secondary" href={`/admin/content/${item.id}/edit`}>
                        <Pencil size={15} /> Edit
                      </Link>
                      <Link className="btn btn-secondary" href={`/admin/content/${item.id}/review`}>
                        <RotateCw size={15} /> Review
                      </Link>
                      <form action={archiveContentAction.bind(null, item.id)}>
                        <button className="btn btn-danger" type="submit">
                          Archive
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {recentGenerationJobs.length > 0 ? (
        <details className="admin-card failure-panel">
          <summary className="failure-panel-summary">
            <span className="disclosure-icon" aria-hidden="true">
              <CirclePlus className="icon-collapsed" size={18} />
              <ChevronDown className="icon-open" size={18} />
            </span>
            <span>
              <span className="section-title">Generation Queue</span>
              <span className="muted"> {activeJobCount} active, {failedJobCount} failed</span>
            </span>
          </summary>
          <div className="failure-toolbar">
            <p className="muted">
              Queued jobs are processed by the generation worker. Failures keep safe details for retry.
            </p>
            <form action={clearGenerationErrorsAction}>
              <button className="btn btn-secondary" type="submit">
                Hide Failed
              </button>
            </form>
          </div>
          <div className="failure-list">
            {recentGenerationJobs.map((job) => {
              const canRetry = ["failed", "running"].includes(job.status) && job.attempts < job.maxAttempts;
              const guidance = failureGuidance(job.responsePayload);
              return (
              <details className="failure-item" key={job.id}>
                <summary className="failure-item-summary">
                  <span className="disclosure-icon" aria-hidden="true">
                    <CirclePlus className="icon-collapsed" size={16} />
                    <ChevronDown className="icon-open" size={16} />
                  </span>
                  <span>
                    <span className="kicker" style={{ color: "var(--error)" }}>
                      {formatJobType(job.jobType)}
                    </span>
                    <span className="failure-title">{job.contentItem.sourceTitle}</span>
                    <span className="muted">
                      {formatJobStatus(job.status)} · attempt {job.attempts}/{job.maxAttempts} ·{" "}
                      {job.finishedAt?.toLocaleString() ?? job.updatedAt.toLocaleString()}
                    </span>
                  </span>
                  <span className="failure-message">
                    {job.errorCategory ? `${job.errorCategory}: ` : ""}
                    {job.errorMessage ?? (job.status === "queued" ? "Waiting for the worker." : "Generation is running.")}
                  </span>
                </summary>
                <pre className="failure-detail">
                  {formatJson({
                    status: job.status,
                    category: job.errorCategory,
                    message: job.errorMessage,
                    guidance,
                    details: job.responsePayload
                  })}
                </pre>
                {guidance ? <p className="muted">{guidance}</p> : null}
                <div className="button-row" style={{ justifyContent: "flex-start" }}>
                  <Link className="btn btn-secondary" href={`/admin/content/${job.contentItem.id}/edit`}>
                    Open Content
                  </Link>
                  {canRetry ? (
                    <form action={retryGenerationJobAction.bind(null, job.id)}>
                      <button className="btn btn-primary" type="submit">
                        Retry Job
                      </button>
                    </form>
                  ) : null}
                </div>
              </details>
            );
            })}
          </div>
        </details>
      ) : null}
    </AdminShell>
  );
}
