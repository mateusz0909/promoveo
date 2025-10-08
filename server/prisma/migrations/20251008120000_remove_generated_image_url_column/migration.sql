-- Remove legacy generated image URL column now that images are configuration-driven
ALTER TABLE "public"."GeneratedImage"
  DROP COLUMN IF EXISTS "generatedImageUrl";
