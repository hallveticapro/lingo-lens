-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TextDirection" AS ENUM ('ltr', 'rtl');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('news_article', 'public_domain_story', 'original_story', 'lesson_text', 'other');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'generating', 'needs_review', 'published', 'archived');

-- CreateEnum
CREATE TYPE "RightsStatus" AS ENUM ('unreviewed', 'original_owned', 'licensed', 'public_domain_verified', 'creative_commons_allowed', 'government_work_verified', 'summary_only', 'rejected', 'unknown', 'not_applicable');

-- CreateEnum
CREATE TYPE "AdaptationStatus" AS ENUM ('draft', 'generated', 'needs_review', 'published', 'archived');

-- CreateEnum
CREATE TYPE "QaStatus" AS ENUM ('not_checked', 'passed', 'warning', 'failed');

-- CreateEnum
CREATE TYPE "GenerationJobType" AS ENUM ('fact_bank', 'generate_adaptations', 'qa_check', 'regenerate_single_adaptation');

-- CreateEnum
CREATE TYPE "GenerationJobStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed', 'canceled');

-- CreateTable
CREATE TABLE "locales" (
    "id" TEXT NOT NULL,
    "bcp47Tag" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "scriptCode" TEXT,
    "regionCode" TEXT,
    "displayNameEn" TEXT NOT NULL,
    "nativeName" TEXT,
    "direction" "TextDirection" NOT NULL DEFAULT 'ltr',
    "segmentationStrategy" TEXT NOT NULL DEFAULT 'whitespace',
    "supportsRubyAnnotations" BOOLEAN NOT NULL DEFAULT false,
    "supportsRomanization" BOOLEAN NOT NULL DEFAULT false,
    "defaultRomanizationSystem" TEXT,
    "isEnabledAsSource" BOOLEAN NOT NULL DEFAULT true,
    "isEnabledAsTarget" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_levels" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locale_level_profiles" (
    "id" TEXT NOT NULL,
    "localeId" TEXT NOT NULL,
    "readingLevelId" TEXT NOT NULL,
    "externalFrameworkMappings" JSONB NOT NULL DEFAULT '{}',
    "generationConstraints" JSONB NOT NULL DEFAULT '{}',
    "vocabularyConstraints" JSONB NOT NULL DEFAULT '{}',
    "scaffoldConfig" JSONB NOT NULL DEFAULT '{}',
    "isGenerationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locale_level_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_items" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "sourceLocaleId" TEXT NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "sourceSubtitle" TEXT,
    "sourceBody" TEXT NOT NULL,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "originalAuthor" TEXT,
    "originalPublicationDate" TIMESTAMP(3),
    "headerMediaAssetId" TEXT,
    "internalNotes" TEXT,
    "createdBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storageKey" TEXT,
    "publicUrl" TEXT,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "altText" TEXT,
    "caption" TEXT,
    "sourceUrl" TEXT,
    "creatorName" TEXT,
    "rightsStatus" "RightsStatus" NOT NULL DEFAULT 'unreviewed',
    "licenseName" TEXT,
    "licenseUrl" TEXT,
    "attributionText" TEXT,
    "rightsNotes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_rights_records" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "textRightsStatus" "RightsStatus" NOT NULL DEFAULT 'unreviewed',
    "imageRightsStatus" "RightsStatus" NOT NULL DEFAULT 'unreviewed',
    "licenseName" TEXT,
    "licenseUrl" TEXT,
    "attributionText" TEXT,
    "rightsNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_rights_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_banks" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "facts" JSONB NOT NULL DEFAULT '[]',
    "entities" JSONB NOT NULL DEFAULT '[]',
    "dates" JSONB NOT NULL DEFAULT '[]',
    "numbers" JSONB NOT NULL DEFAULT '[]',
    "quotes" JSONB NOT NULL DEFAULT '[]',
    "sensitiveTopics" JSONB NOT NULL DEFAULT '[]',
    "preservationNotes" JSONB NOT NULL DEFAULT '[]',
    "generatedByJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fact_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adaptations" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "targetLocaleId" TEXT NOT NULL,
    "readingLevelId" TEXT NOT NULL,
    "status" "AdaptationStatus" NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "summary" TEXT,
    "imageCaption" TEXT,
    "bodyMarkdown" TEXT NOT NULL,
    "bodyBlocks" JSONB NOT NULL DEFAULT '[]',
    "vocabulary" JSONB NOT NULL DEFAULT '[]',
    "comprehensionQuestions" JSONB NOT NULL DEFAULT '[]',
    "annotations" JSONB NOT NULL DEFAULT '[]',
    "contentWarning" TEXT,
    "editorNotes" TEXT,
    "estimatedReadingTimeSeconds" INTEGER,
    "estimatedDifficulty" JSONB NOT NULL DEFAULT '{}',
    "generationJobId" TEXT,
    "qaStatus" "QaStatus" NOT NULL DEFAULT 'not_checked',
    "qaReport" JSONB NOT NULL DEFAULT '{}',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adaptations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_jobs" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "jobType" "GenerationJobType" NOT NULL,
    "status" "GenerationJobStatus" NOT NULL DEFAULT 'queued',
    "targetLocaleId" TEXT,
    "requestedReadingLevelIds" JSONB NOT NULL DEFAULT '[]',
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "model" TEXT,
    "promptVersion" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "estimatedCostCents" INTEGER,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "requestedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "modelDefault" TEXT,
    "systemInstructions" TEXT NOT NULL,
    "userTemplate" TEXT NOT NULL,
    "outputSchema" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adaptation_revisions" (
    "id" TEXT NOT NULL,
    "adaptationId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "summary" TEXT,
    "imageCaption" TEXT,
    "bodyMarkdown" TEXT NOT NULL,
    "bodyBlocks" JSONB NOT NULL DEFAULT '[]',
    "vocabulary" JSONB NOT NULL DEFAULT '[]',
    "comprehensionQuestions" JSONB NOT NULL DEFAULT '[]',
    "annotations" JSONB NOT NULL DEFAULT '[]',
    "changeReason" TEXT,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adaptation_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rss_feed_configs" (
    "id" TEXT NOT NULL,
    "targetLocaleId" TEXT NOT NULL,
    "readingLevelId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "includeFullContent" BOOLEAN NOT NULL DEFAULT false,
    "maxItems" INTEGER NOT NULL DEFAULT 25,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rss_feed_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "locales_bcp47Tag_key" ON "locales"("bcp47Tag");

-- CreateIndex
CREATE UNIQUE INDEX "reading_levels_key_key" ON "reading_levels"("key");

-- CreateIndex
CREATE UNIQUE INDEX "locale_level_profiles_localeId_readingLevelId_key" ON "locale_level_profiles"("localeId", "readingLevelId");

-- CreateIndex
CREATE UNIQUE INDEX "content_items_slug_key" ON "content_items"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "content_rights_records_contentItemId_key" ON "content_rights_records"("contentItemId");

-- CreateIndex
CREATE UNIQUE INDEX "fact_banks_contentItemId_key" ON "fact_banks"("contentItemId");

-- CreateIndex
CREATE UNIQUE INDEX "adaptations_contentItemId_targetLocaleId_readingLevelId_key" ON "adaptations"("contentItemId", "targetLocaleId", "readingLevelId");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_templates_key_version_key" ON "prompt_templates"("key", "version");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "adaptation_revisions_adaptationId_revisionNumber_key" ON "adaptation_revisions"("adaptationId", "revisionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "rss_feed_configs_slug_key" ON "rss_feed_configs"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "rss_feed_configs_targetLocaleId_readingLevelId_key" ON "rss_feed_configs"("targetLocaleId", "readingLevelId");

-- AddForeignKey
ALTER TABLE "locale_level_profiles" ADD CONSTRAINT "locale_level_profiles_localeId_fkey" FOREIGN KEY ("localeId") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locale_level_profiles" ADD CONSTRAINT "locale_level_profiles_readingLevelId_fkey" FOREIGN KEY ("readingLevelId") REFERENCES "reading_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_sourceLocaleId_fkey" FOREIGN KEY ("sourceLocaleId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_headerMediaAssetId_fkey" FOREIGN KEY ("headerMediaAssetId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_rights_records" ADD CONSTRAINT "content_rights_records_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_banks" ADD CONSTRAINT "fact_banks_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adaptations" ADD CONSTRAINT "adaptations_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adaptations" ADD CONSTRAINT "adaptations_targetLocaleId_fkey" FOREIGN KEY ("targetLocaleId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adaptations" ADD CONSTRAINT "adaptations_readingLevelId_fkey" FOREIGN KEY ("readingLevelId") REFERENCES "reading_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adaptations" ADD CONSTRAINT "adaptations_generationJobId_fkey" FOREIGN KEY ("generationJobId") REFERENCES "generation_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adaptation_revisions" ADD CONSTRAINT "adaptation_revisions_adaptationId_fkey" FOREIGN KEY ("adaptationId") REFERENCES "adaptations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rss_feed_configs" ADD CONSTRAINT "rss_feed_configs_targetLocaleId_fkey" FOREIGN KEY ("targetLocaleId") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rss_feed_configs" ADD CONSTRAINT "rss_feed_configs_readingLevelId_fkey" FOREIGN KEY ("readingLevelId") REFERENCES "reading_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
