import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Languages, Rss } from "lucide-react";
import { DocumentLanguage } from "@/components/DocumentLanguage";
import { PublicShell } from "@/components/PublicChrome";
import { ReadingLevelSwitcher } from "@/components/ReadingLevelSwitcher";
import { ReaderPreferences } from "@/components/ReaderPreferences";
import { ReaderTranslationView } from "@/components/ReaderTranslationView";
import { prisma } from "@/lib/prisma";
import { levelKeyToSlug, levelSlugToKey } from "@/lib/level";
import { canonicalLocaleSlug, isCanonicalLocaleSlug, localeSlugToTag, localeTagToSlug } from "@/lib/locale";
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

function shortLanguageLabel(displayName: string) {
  return displayName.replace(/\s*\([^)]*\)/g, "").trim() || displayName;
}

export default async function ReadingPage({ params }: { params: Promise<Params> }) {
  const { locale, level, slug } = await params;
  if (!isCanonicalLocaleSlug(locale)) {
    permanentRedirect(`/read/${canonicalLocaleSlug(locale)}/${level}/${slug}`);
  }
  const localeTag = localeSlugToTag(locale);
  const levelKey = levelSlugToKey(level);
  const adaptation = await prisma.adaptation.findFirst({
    where: {
      status: "published",
      targetLocale: { bcp47Tag: localeTag, isPublic: true },
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
    href: `/read/${localeTagToSlug(adaptation.targetLocale.bcp47Tag)}/${levelKeyToSlug(
      item.readingLevel.key
    )}/${adaptation.contentItem.slug}`
  }));
  const headerMedia = adaptation.contentItem.headerMediaAsset;
  const imageCaption = adaptation.imageCaption ?? headerMedia?.caption;
  const imageUrl = headerMedia?.publicUrl;
  const checkTranslationBody = adaptation.checkTranslationBodyMarkdown?.trim();
  const englishCheckTranslation = checkTranslationBody
    ? {
        locale: adaptation.checkTranslationLocale ?? "en-US",
        dir: "ltr" as const,
        label: "English",
        title: adaptation.checkTranslationTitle ?? adaptation.contentItem.sourceTitle,
        summary: adaptation.checkTranslationSummary,
        imageCaption: adaptation.checkTranslationImageCaption,
        bodyMarkdown: checkTranslationBody
      }
    : null;

  return (
    <PublicShell>
      <DocumentLanguage lang={adaptation.targetLocale.bcp47Tag} dir={adaptation.targetLocale.direction} />
      <div className="container reader-layout reader-content">
        <article>
          <ReadingLevelSwitcher levels={levelLinks} />
          <ReaderTranslationView
            target={{
              locale: adaptation.targetLocale.bcp47Tag,
              dir: adaptation.targetLocale.direction,
              label: shortLanguageLabel(adaptation.targetLocale.displayNameEn),
              title: adaptation.title,
              summary: adaptation.summary,
              imageCaption,
              bodyMarkdown: adaptation.bodyMarkdown
            }}
            english={englishCheckTranslation}
            image={
              imageUrl
                ? {
                    url: imageUrl,
                    altText: headerMedia.altText ?? "",
                    unoptimized: shouldBypassImageOptimization(imageUrl)
                  }
                : null
            }
            sourceLabel={adaptation.contentItem.sourceName ?? "LingoLens"}
            updatedLabel={adaptation.updatedAt.toLocaleDateString()}
          />
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
                  href={`/feeds/${localeTagToSlug(adaptation.targetLocale.bcp47Tag)}/${levelKeyToSlug(
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
