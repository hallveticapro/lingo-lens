import Link from "next/link";
import { AlertCircle, CheckCircle2, FilePlus2, Pencil, RotateCw } from "lucide-react";
import { archiveContentAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/AdminChrome";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatJobType(jobType: string) {
  return jobType.replaceAll("_", " ");
}

function formatErrorMessage(message: string | null) {
  if (!message) return "No error details were captured.";
  return message.length > 260 ? `${message.slice(0, 257)}...` : message;
}

export default async function AdminDashboard() {
  await requireAdmin();
  const [items, published, drafts, review, failedJobCount, recentFailedJobs] = await Promise.all([
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
    prisma.generationJob.findMany({
      where: { status: "failed" },
      include: {
        contentItem: {
          select: {
            id: true,
            sourceTitle: true
          }
        }
      },
      orderBy: { finishedAt: "desc" },
      take: 5
    })
  ]);

  return (
    <AdminShell>
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
            <AlertCircle size={16} /> API errors
          </p>
        </div>
      </section>

      <section className="admin-card" style={{ padding: 0 }}>
        <div className="latest-heading" style={{ padding: 28 }}>
          <h2 className="section-title">Recent Content</h2>
          <div className="button-row" style={{ justifyContent: "flex-end" }}>
            <input className="input" placeholder="Search titles..." aria-label="Search titles" />
            <button className="btn btn-secondary" type="button">
              Filter
            </button>
          </div>
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
                  <td>{item.sourceLocale.bcp47Tag}</td>
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

      {recentFailedJobs.length > 0 ? (
        <section className="admin-card failure-panel">
          <div className="latest-heading">
            <h2 className="section-title">Recent Generation Failures</h2>
            <p className="muted" style={{ margin: 0 }}>
              These messages also appear in Docker logs with <code>scope=generation</code>.
            </p>
          </div>
          <div className="failure-list">
            {recentFailedJobs.map((job) => (
              <article className="failure-item" key={job.id}>
                <div>
                  <p className="kicker" style={{ color: "var(--error)" }}>
                    {formatJobType(job.jobType)}
                  </p>
                  <h3>{job.contentItem.sourceTitle}</h3>
                  <p className="muted">
                    {job.finishedAt?.toLocaleString() ?? job.updatedAt.toLocaleString()} · {job.model ?? "No model recorded"}
                  </p>
                </div>
                <p className="failure-message">{formatErrorMessage(job.errorMessage)}</p>
                <Link className="btn btn-secondary" href={`/admin/content/${job.contentItem.id}/edit`}>
                  Open
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </AdminShell>
  );
}
