ALTER TABLE "adaptations"
ADD COLUMN "checkTranslationLocale" TEXT DEFAULT 'en-US',
ADD COLUMN "checkTranslationTitle" TEXT,
ADD COLUMN "checkTranslationSubtitle" TEXT,
ADD COLUMN "checkTranslationSummary" TEXT,
ADD COLUMN "checkTranslationImageCaption" TEXT,
ADD COLUMN "checkTranslationBodyMarkdown" TEXT;

ALTER TABLE "adaptation_revisions"
ADD COLUMN "checkTranslationLocale" TEXT DEFAULT 'en-US',
ADD COLUMN "checkTranslationTitle" TEXT,
ADD COLUMN "checkTranslationSubtitle" TEXT,
ADD COLUMN "checkTranslationSummary" TEXT,
ADD COLUMN "checkTranslationImageCaption" TEXT,
ADD COLUMN "checkTranslationBodyMarkdown" TEXT;
