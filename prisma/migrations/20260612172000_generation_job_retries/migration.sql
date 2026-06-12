-- AlterTable
ALTER TABLE "generation_jobs" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "maxAttempts" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "errorCategory" TEXT;
