import { ArticleCard } from "@/components/ArticleCard";
import { PublicShell } from "@/components/PublicChrome";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const readings = await prisma.adaptation.findMany({
    where: {
      status: "published",
      targetLocale: { isPublic: true },
      readingLevel: { isPublic: true }
    },
    include: {
      contentItem: { include: { headerMediaAsset: true } },
      readingLevel: true,
      targetLocale: true
    },
    orderBy: { publishedAt: "desc" }
  });

  const grouped = readings.reduce<typeof readings>((items, adaptation) => {
    if (!items.some((item) => item.contentItemId === adaptation.contentItemId)) {
      items.push(adaptation);
    }
    return items;
  }, []);

  return (
    <PublicShell>
      <section className="section-band page-band">
        <div className="container">
          <div className="latest-heading">
            <div>
              <p className="kicker">Library</p>
              <h1 className="page-title">Articles</h1>
            </div>
            <p className="muted">{grouped.length} published articles</p>
          </div>
          {grouped.length > 0 ? (
            <div className="article-grid article-grid-wide">
              {grouped.map((adaptation) => (
                <ArticleCard adaptation={adaptation} key={adaptation.id} />
              ))}
            </div>
          ) : (
            <p className="muted empty-copy">No articles have been published yet.</p>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
