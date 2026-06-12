import Link from "next/link";
import type { Adaptation, ContentItem, Locale, MediaAsset, ReadingLevel } from "@prisma/client";
import { levelKeyToSlug } from "@/lib/level";

type ArticleCardAdaptation = Adaptation & {
  contentItem: ContentItem & { headerMediaAsset: MediaAsset | null };
  readingLevel: ReadingLevel;
  targetLocale: Locale;
};

export function ArticleCard({ adaptation }: { adaptation: ArticleCardAdaptation }) {
  const publisher = adaptation.contentItem.sourceName ?? "LingoLens";

  return (
    <article className="article-card">
      {adaptation.contentItem.headerMediaAsset?.publicUrl ? (
        <img
          src={adaptation.contentItem.headerMediaAsset.publicUrl}
          alt={adaptation.contentItem.headerMediaAsset.altText ?? ""}
        />
      ) : (
        <div className="image-placeholder">LingoLens</div>
      )}
      <div className="chip-row">
        <span className="chip">{publisher}</span>
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
  );
}
