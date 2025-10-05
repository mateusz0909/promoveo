/*
  Warnings:

  - You are about to drop the column `projectId` on the `Visual` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Visual` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add userId column as nullable first
ALTER TABLE "public"."Visual" ADD COLUMN "userId" TEXT;

-- Step 2: Populate userId from the project's userId
UPDATE "public"."Visual" v
SET "userId" = p."userId"
FROM "public"."Project" p
WHERE v."projectId" = p."id";

-- Step 3: Make userId NOT NULL now that it's populated
ALTER TABLE "public"."Visual" ALTER COLUMN "userId" SET NOT NULL;

-- Step 4: Drop the foreign key constraint and projectId column
-- DropForeignKey
ALTER TABLE "public"."Visual" DROP CONSTRAINT "Visual_projectId_fkey";

-- DropIndex
DROP INDEX "public"."Visual_projectId_category_idx";

-- AlterTable
ALTER TABLE "public"."Visual" DROP COLUMN "projectId";

-- CreateIndex
CREATE INDEX "Visual_userId_category_idx" ON "public"."Visual"("userId", "category");

-- AddForeignKey
ALTER TABLE "public"."Visual" ADD CONSTRAINT "Visual_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
