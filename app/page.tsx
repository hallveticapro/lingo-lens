import Link from "next/link";
import { BookOpenCheck, FilePlus2, Rss, Sparkles } from "lucide-react";
import { ArticleCard } from "@/components/ArticleCard";
import { PublicShell } from "@/components/PublicChrome";
import { publishedArticleCards } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const readings = await publishedArticleCards({ take: 4 });

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

      <section className="section-band how-section" aria-labelledby="how-heading">
        <div className="container">
          <h2 className="section-title centered-title" id="how-heading">
            How LingoLens Works
          </h2>
          <div className="steps">
            <article className="step-card">
              <FilePlus2 size={26} aria-hidden="true" />
              <h3>1. Add source text</h3>
              <p>Start with a real article, story, lesson, or original source.</p>
            </article>
            <article className="step-card">
              <Sparkles size={26} aria-hidden="true" />
              <h3>2. Generate levels</h3>
              <p>Create distinct adaptations for each reading level from the same facts.</p>
            </article>
            <article className="step-card">
              <BookOpenCheck size={26} aria-hidden="true" />
              <h3>3. Read or subscribe</h3>
              <p>Choose the level that fits today, or follow new readings by RSS.</p>
            </article>
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
            {readings.map((adaptation) => (
              <ArticleCard adaptation={adaptation} key={adaptation.id} />
            ))}
          </div>
          <div className="section-action">
            <Link className="btn btn-primary" href="/articles">
              View more articles
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
