-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "landingPageConfig" JSONB,
ADD COLUMN     "landingPageZipStoragePath" TEXT,
ADD COLUMN     "landingPageZipUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "landingPageZipUrl" TEXT;
