import Link from "next/link";
import { Rss } from "lucide-react";
import { ArticleCard } from "@/components/ArticleCard";
import { PublicShell } from "@/components/PublicChrome";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
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
    orderBy: { publishedAt: "desc" },
    take: 40
  });

  const grouped = readings.reduce<typeof readings>((items, adaptation) => {
    if (!items.some((item) => item.contentItemId === adaptation.contentItemId)) {
      items.push(adaptation);
    }
    return items;
  }, []);

  return (
    <PublicShell>
      <section className="hero">
        <div className="container">
          <h1>Read the world in Spanish at your level.</h1>
          <p>
            Real articles and stories adapted into learner-friendly Latin American Spanish. Immerse
            yourself in authentic content without the frustration of constant dictionary lookups.
          </p>
          <div className="button-row">
            <Link className="btn btn-primary" href="#latest">
              Start Reading
            </Link>
            <Link className="btn btn-secondary" href="/articles">
              Articles
            </Link>
            <Link className="btn btn-secondary" href="/feeds">
              <Rss size={16} /> Subscribe by RSS
            </Link>
          </div>
        </div>
      </section>

      <section className="section-band" id="latest">
        <div className="container">
          <div className="latest-heading">
            <h2 className="section-title">Latest Adapted Articles</h2>
            <Link className="kicker" href="/articles">
              View more
            </Link>
          </div>
          <div className="article-grid">
            {grouped.slice(0, 4).map((adaptation) => (
              <ArticleCard adaptation={adaptation} key={adaptation.id} />
            ))}
          </div>
          {grouped.length > 4 ? (
            <div className="section-action">
              <Link className="btn btn-primary" href="/articles">
                View more articles
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </PublicShell>
  );
}
