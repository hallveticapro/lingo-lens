import Link from "next/link";
import { Archive, ArrowDownUp, FilePlus2, Pencil, RotateCw, Search } from "lucide-react";
import { ContentStatus, Prisma } from "@prisma/client";
import { archiveContentAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/AdminChrome";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  status?: string;
  sort?: string;
};

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "generating", label: "Generating" },
  { value: "needs_review", label: "Needs review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" }
];

const sortOptions = [
  { value: "published_desc", label: "Publication date, newest" },
  { value: "published_asc", label: "Publication date, oldest" },
  { value: "updated_desc", label: "Updated, newest" },
  { value: "created_desc", label: "Created, newest" },
  { value: "title_asc", label: "Title, A-Z" },
  { value: "status_asc", label: "Status, A-Z" }
];

function validStatus(status: string | undefined): ContentStatus | null {
  if (!status || status === "all") return null;
  return Object.values(ContentStatus).includes(status as ContentStatus) ? (status as ContentStatus) : null;
}

function sortOrder(sort: string | undefined): Prisma.ContentItemOrderByWithRelationInput[] {
  switch (sort) {
    case "published_asc":
      return [{ publishedAt: { sort: "asc", nulls: "last" } }, { updatedAt: "desc" }];
    case "updated_desc":
      return [{ updatedAt: "desc" }];
    case "created_desc":
      return [{ createdAt: "desc" }];
    case "title_asc":
      return [{ sourceTitle: "asc" }];
    case "status_asc":
      return [{ status: "asc" }, { publishedAt: { sort: "desc", nulls: "last" } }];
    case "published_desc":
    default:
      return [{ publishedAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }];
  }
}

function dateLabel(date: Date | null) {
  return date ? date.toLocaleDateString() : "Not published";
}

export default async function ContentListPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const selectedStatus = validStatus(params.status);
  const selectedSort = params.sort ?? "published_desc";
  const where: Prisma.ContentItemWhereInput = {};

  if (q) {
    where.OR = [
      { sourceTitle: { contains: q, mode: "insensitive" } },
      { sourceSubtitle: { contains: q, mode: "insensitive" } },
      { sourceName: { contains: q, mode: "insensitive" } },
      { sourceUrl: { contains: q, mode: "insensitive" } }
    ];
  }

  if (selectedStatus) {
    where.status = selectedStatus;
  }

  const items = await prisma.contentItem.findMany({
    where,
    include: {
      sourceLocale: true,
      _count: { select: { adaptations: true, generationJobs: true } }
    },
    orderBy: sortOrder(selectedSort)
  });

  return (
    <AdminShell>
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Content List</h1>
          <p className="muted" style={{ fontSize: 22, margin: 0 }}>
            Search, filter, sort, and open every source article.
          </p>
        </div>
        <Link className="btn btn-primary" href="/admin/content/new">
          <FilePlus2 size={18} /> New Content
        </Link>
      </div>

      <section className="admin-card content-list-panel" style={{ padding: 0 }}>
        <form className="content-list-filters" action="/admin/content">
          <label className="field">
            <span>Search</span>
            <span className="input-icon">
              <Search size={16} />
              <input className="input" name="q" defaultValue={q} placeholder="Title, source, or URL" />
            </span>
          </label>
          <label className="field">
            <span>Status</span>
            <select className="select" name="status" defaultValue={params.status ?? "all"}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Sort</span>
            <select className="select" name="sort" defaultValue={selectedSort}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-secondary" type="submit">
            <ArrowDownUp size={16} /> Apply
          </button>
        </form>

        <table className="content-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Source</th>
              <th>Published</th>
              <th>Updated</th>
              <th>Versions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">
                  No content matches those filters.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.sourceTitle}</strong>
                    {item.sourceSubtitle ? (
                      <p className="muted" style={{ margin: "4px 0 0" }}>
                        {item.sourceSubtitle}
                      </p>
                    ) : null}
                  </td>
                  <td>
                    <span className="chip">{item.status.replaceAll("_", " ")}</span>
                  </td>
                  <td>
                    {item.sourceName ?? "LingoLens"}
                    <p className="muted" style={{ margin: "4px 0 0" }}>
                      {item.sourceLocale.bcp47Tag}
                    </p>
                  </td>
                  <td>{dateLabel(item.publishedAt)}</td>
                  <td>{item.updatedAt.toLocaleDateString()}</td>
                  <td>{item._count.adaptations}</td>
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
                          <Archive size={15} /> Archive
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
    </AdminShell>
  );
}
