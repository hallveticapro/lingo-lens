import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BookOpen, Languages, Rss } from "lucide-react";
import { DocumentLanguage } from "@/components/DocumentLanguage";
import { Markdown } from "@/components/Markdown";
import { PublicShell } from "@/components/PublicChrome";
import { ReadingLevelSwitcher } from "@/components/ReadingLevelSwitcher";
import { ReaderPreferences } from "@/components/ReaderPreferences";
import { prisma } from "@/lib/prisma";
import { levelKeyToSlug, levelSlugToKey } from "@/lib/level";
import { shouldBypassImageOptimization } from "@/lib/media-urls";
import type { QuestionItem, VocabularyItem } from "@/lib/parsers";

export const dynamic = "force-dynamic";

type Params = {
  locale: string;
  level: string;
  slug: string;
};

function vocabularyPartOfSpeech(item: VocabularyItem) {
  const partOfSpeech = item.part_of_speech?.trim();
  if (partOfSpeech) return partOfSpeech;
  if (/^to\s+\S+/i.test(item.meaning_en.trim())) return "verb";
  return "part of speech pending";
}

export default async function ReadingPage({ params }: { params: Promise<Params> }) {
  const { locale, level, slug } = await params;
  const levelKey = levelSlugToKey(level);
  const adaptation = await prisma.adaptation.findFirst({
    where: {
      status: "published",
      targetLocale: { bcp47Tag: locale, isPublic: true },
      readingLevel: { key: levelKey, isPublic: true },
      contentItem: { slug }
    },
    include: {
      contentItem: { include: { headerMediaAsset: true, sourceLocale: true } },
      targetLocale: true,
      readingLevel: true
    }
  });

  if (!adaptation) notFound();

  const availableLevels = await prisma.adaptation.findMany({
    where: {
      contentItemId: adaptation.contentItemId,
      targetLocaleId: adaptation.targetLocaleId,
      status: "published"
    },
    include: { readingLevel: true },
    orderBy: { readingLevel: { sortOrder: "asc" } }
  });

  const vocabulary = Array.isArray(adaptation.vocabulary)
    ? (adaptation.vocabulary as VocabularyItem[])
    : [];
  const questions = Array.isArray(adaptation.comprehensionQuestions)
    ? (adaptation.comprehensionQuestions as QuestionItem[])
    : [];
  const vocabularyWithDisplay = vocabulary.map((item) => ({
    ...item,
    partOfSpeech: vocabularyPartOfSpeech(item)
  }));
  const levelLinks = availableLevels.map((item) => ({
    id: item.id,
    label: item.readingLevel.displayName,
    isCurrent: item.readingLevel.key === adaptation.readingLevel.key,
    href: `/read/${adaptation.targetLocale.bcp47Tag}/${levelKeyToSlug(
      item.readingLevel.key
    )}/${adaptation.contentItem.slug}`
  }));
  const headerMedia = adaptation.contentItem.headerMediaAsset;
  const imageCaption = adaptation.imageCaption ?? headerMedia?.caption;
  const imageUrl = headerMedia?.publicUrl;

  return (
    <PublicShell>
      <DocumentLanguage lang={adaptation.targetLocale.bcp47Tag} dir={adaptation.targetLocale.direction} />
      <div className="container reader-layout reader-content">
        <article lang={adaptation.targetLocale.bcp47Tag} dir={adaptation.targetLocale.direction}>
              <ReadingLevelSwitcher levels={levelLinks} />
              <h1 className="article-title">{adaptation.title}</h1>
              {adaptation.summary ? <p className="dek">{adaptation.summary}</p> : null}
              <div className="meta-line">
                <span className="meta-pill">
                  <BookOpen size={14} /> Source: {adaptation.contentItem.sourceName ?? "LingoLens"}
                </span>
                <span className="meta-pill">Updated {adaptation.updatedAt.toLocaleDateString()}</span>
              </div>

              {imageUrl ? (
                <>
                  <Image
                    className="reader-hero-image"
                    src={imageUrl}
                    alt={headerMedia.altText ?? ""}
                    width={1200}
                    height={770}
                    sizes="(max-width: 900px) 100vw, 720px"
                    unoptimized={shouldBypassImageOptimization(imageUrl)}
                  />
                  {imageCaption ? (
                    <p className="caption">{imageCaption}</p>
                  ) : null}
                </>
              ) : null}

              <Markdown className="reader-body">{adaptation.bodyMarkdown}</Markdown>
        </article>

        <aside className="sidebar-stack" aria-label="Reading tools">
              <ReaderPreferences />
              {vocabulary.length === 0 && questions.length === 0 ? (
                <section className="panel-card">
                  <h2>Reading Tools</h2>
                  <p className="muted">Vocabulary and comprehension prompts are not available for this version yet.</p>
                </section>
              ) : null}
              {vocabularyWithDisplay.length > 0 ? (
              <section className="panel-card">
                <h2>
                  <Languages size={18} color="var(--terracotta)" /> Key Vocabulary
                </h2>
                <div className="definition-list">
                  {vocabularyWithDisplay.map((item) => (
                    <div className="definition-item" key={`${item.term}-${item.meaning_en}`}>
                      <div className="vocabulary-heading">
                        <strong>{item.term}</strong>
                        <span className="chip vocabulary-part-of-speech">{item.partOfSpeech}</span>
                      </div>
                      <p className="muted">{item.meaning_en}</p>
                    </div>
                  ))}
                </div>
              </section>
              ) : null}

              {questions.length > 0 ? (
              <section className="panel-card">
                <h2>Comprehension</h2>
                <div className="definition-list">
                  {questions.map((item, index) => (
                    <details className="definition-item" key={item.question}>
                      <summary>
                        {index + 1}. {item.question}
                      </summary>
                      <p className="muted">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
              ) : null}

              <section className="panel-card" style={{ background: "var(--navy)", color: "white" }}>
                <h2 style={{ color: "white" }}>Get More {adaptation.readingLevel.displayName} Texts</h2>
                <p style={{ color: "var(--navy-soft)" }}>
                  Subscribe to new {adaptation.readingLevel.displayName} Spanish articles.
                </p>
                <Link
                  className="btn"
                  style={{
                    background: "var(--terracotta)",
                    borderColor: "var(--terracotta)",
                    color: "white"
                  }}
                  href={`/feeds/${adaptation.targetLocale.bcp47Tag}/${levelKeyToSlug(
                    adaptation.readingLevel.key
                  )}.xml`}
                >
                  <Rss size={16} /> Subscribe to RSS
                </Link>
              </section>
        </aside>
      </div>
    </PublicShell>
  );
}
