import { ArticleCard } from "@/components/ArticleCard";
import { PublicShell } from "@/components/PublicChrome";
import { articlesPageSize, normalizePage, paginationState, publishedArticleCards, publishedArticleCount } from "@/lib/articles";

export const dynamic = "force-dynamic";

type ArticlesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = searchParams ? await searchParams : {};
  const requestedPage = normalizePage(params.page);
  const total = await publishedArticleCount();
  const pagination = paginationState(total, requestedPage, articlesPageSize);
  const readings = await publishedArticleCards({ take: articlesPageSize, skip: pagination.skip });

  return (
    <PublicShell>
      <section className="section-band page-band">
        <div className="container">
          <div className="latest-heading">
            <div>
              <p className="kicker">Library</p>
              <h1 className="page-title">Articles</h1>
            </div>
            <p className="muted">{total} published articles</p>
          </div>
          {readings.length > 0 ? (
            <div className="article-grid article-grid-wide">
              {readings.map((adaptation) => (
                <ArticleCard adaptation={adaptation} key={adaptation.id} />
              ))}
            </div>
          ) : (
            <p className="muted empty-copy">No articles have been published yet.</p>
          )}
          {total > articlesPageSize ? (
            <nav className="pagination-row" aria-label="Article pages">
              {pagination.hasPrevious ? (
                <a className="btn btn-secondary" href={`/articles?page=${pagination.page - 1}`}>
                  Previous
                </a>
              ) : null}
              <span className="muted">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              {pagination.hasNext ? (
                <a className="btn btn-secondary" href={`/articles?page=${pagination.page + 1}`}>
                  Next
                </a>
              ) : null}
            </nav>
          ) : null}
        </div>
      </section>
    </PublicShell>
  );
}
