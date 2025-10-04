/*
  Warnings:

  - You are about to drop the column `templateVersionId` on the `GeneratedImage` table. All the data in the column will be lost.
  - You are about to drop the `Template` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TemplateVersion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."GeneratedImage" DROP CONSTRAINT "GeneratedImage_templateVersionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Template" DROP CONSTRAINT "Template_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."TemplateVersion" DROP CONSTRAINT "TemplateVersion_templateId_fkey";

-- AlterTable
ALTER TABLE "public"."GeneratedImage" DROP COLUMN "templateVersionId",
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "public"."Template";

-- DropTable
DROP TABLE "public"."TemplateVersion";

-- DropEnum
DROP TYPE "public"."TemplateStatus";
