-- CreateIndex
CREATE INDEX "content_items_status_updatedAt_idx" ON "content_items"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "adaptations_status_targetLocaleId_readingLevelId_publishedAt_idx" ON "adaptations"("status", "targetLocaleId", "readingLevelId", "publishedAt");

-- CreateIndex
CREATE INDEX "adaptations_contentItemId_targetLocaleId_status_idx" ON "adaptations"("contentItemId", "targetLocaleId", "status");

-- CreateIndex
CREATE INDEX "generation_jobs_status_finishedAt_idx" ON "generation_jobs"("status", "finishedAt");
