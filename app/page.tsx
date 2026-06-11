import Link from "next/link";
import { BookOpen, FilePlus2, Rss, Sparkles } from "lucide-react";
import { PublicShell } from "@/components/PublicChrome";
import { prisma } from "@/lib/prisma";
import { labelInitials, levelKeyToSlug } from "@/lib/level";

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
    take: 6
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
            <Link className="btn btn-secondary" href="/feeds">
              <Rss size={16} /> Subscribe by RSS
            </Link>
          </div>
        </div>
      </section>

      <section className="section-band" id="levels">
        <div className="container" style={{ textAlign: "center" }}>
          <h2 className="section-title">How LingoLens Works</h2>
          <div className="steps">
            <div className="step-card">
              <FilePlus2 size={30} strokeWidth={1.8} />
              <p className="kicker">1. Add Source Text</p>
              <p className="muted">Paste a source article, story, or lesson text into the editor.</p>
            </div>
            <div className="step-card">
              <Sparkles size={30} strokeWidth={1.8} />
              <p className="kicker">2. Generate Levels</p>
              <p className="muted">AI adapts the source into four distinct reading levels.</p>
            </div>
            <div className="step-card">
              <BookOpen size={30} strokeWidth={1.8} />
              <p className="kicker">3. Read or Subscribe</p>
              <p className="muted">Learners read on the platform or follow a level-specific RSS feed.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-band" id="latest">
        <div className="container">
          <div className="latest-heading">
            <h2 className="section-title">Latest Adapted Articles</h2>
            <Link className="kicker" href="/feeds">
              View feeds
            </Link>
          </div>
          <div className="article-grid">
            {grouped.map((adaptation) => (
              <article className="article-card" key={adaptation.id}>
                {adaptation.contentItem.headerMediaAsset?.publicUrl ? (
                  <img
                    src={adaptation.contentItem.headerMediaAsset.publicUrl}
                    alt={adaptation.contentItem.headerMediaAsset.altText ?? ""}
                  />
                ) : (
                  <div className="image-placeholder">LingoLens</div>
                )}
                <div className="chip-row">
                  <span className="chip">{adaptation.contentItem.sourceName ?? "Source"}</span>
                  <span className="chip">{labelInitials(adaptation.readingLevel.key)}</span>
                  <span className="chip">{adaptation.targetLocale.bcp47Tag}</span>
                </div>
                <h3>
                  <Link
                    href={`/read/${adaptation.targetLocale.bcp47Tag}/${levelKeyToSlug(
                      adaptation.readingLevel.key
                    )}/${adaptation.contentItem.slug}`}
                  >
                    {adaptation.title}
                  </Link>
                </h3>
                <p className="muted">{adaptation.summary}</p>
                <p className="kicker">
                  {adaptation.publishedAt?.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
