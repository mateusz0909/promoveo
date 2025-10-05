-- CreateTable
CREATE TABLE "public"."Visual" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'custom',
    "imageUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "Visual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visual_projectId_category_idx" ON "public"."Visual"("projectId", "category");

-- AddForeignKey
ALTER TABLE "public"."Visual" ADD CONSTRAINT "Visual_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
