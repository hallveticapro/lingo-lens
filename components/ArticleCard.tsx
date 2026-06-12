import Link from "next/link";
import Image from "next/image";
import type { Adaptation, ContentItem, Locale, MediaAsset, ReadingLevel } from "@prisma/client";
import { levelKeyToSlug } from "@/lib/level";
import { shouldBypassImageOptimization } from "@/lib/media-urls";

type ArticleCardAdaptation = Adaptation & {
  contentItem: ContentItem & { headerMediaAsset: MediaAsset | null };
  readingLevel: ReadingLevel;
  targetLocale: Locale;
};

export function ArticleCard({ adaptation }: { adaptation: ArticleCardAdaptation }) {
  const publisher = adaptation.contentItem.sourceName ?? "LingoLens";
  const headerMedia = adaptation.contentItem.headerMediaAsset;
  const imageUrl = headerMedia?.publicUrl;

  return (
    <article className="article-card">
      {imageUrl ? (
        <Image
          className="article-card-image"
          src={imageUrl}
          alt={headerMedia.altText ?? ""}
          width={900}
          height={600}
          sizes="(max-width: 760px) 100vw, (max-width: 1180px) 33vw, 340px"
          unoptimized={shouldBypassImageOptimization(imageUrl)}
        />
      ) : (
        <div className="image-placeholder">LingoLens</div>
      )}
      <div className="chip-row">
        <span className="chip">{publisher}</span>
        <span className="chip">{adaptation.targetLocale.displayNameEn}</span>
        <span className="chip chip-active">{adaptation.readingLevel.displayName}</span>
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
