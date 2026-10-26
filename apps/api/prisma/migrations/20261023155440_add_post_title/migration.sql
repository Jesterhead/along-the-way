/*
  Warnings:

  - Added the required column `title` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Add as nullable first so existing rows are allowed.
ALTER TABLE "Post" ADD COLUMN "title" TEXT;

-- Backfill existing posts.
UPDATE "Post" p
SET "title" = left(btrim(split_part(b."text", E'\n', 1)), 120)
FROM "Block" b
WHERE b."postId" = p."id" AND b."position" = 0;

UPDATE "Post" SET "title" = 'Untitled'
WHERE "title" IS NULL OR btrim("title") = '';

-- Now every row has a value, so it can be required.
ALTER TABLE "Post" ALTER COLUMN "title" SET NOT NULL;

-- Hand-written: Prisma can't express CHECK constraints.
ALTER TABLE "Post" ADD CONSTRAINT "Post_title_length"
  CHECK (char_length(btrim("title")) BETWEEN 1 AND 120);
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_title_length"
  CHECK (char_length(btrim("title")) BETWEEN 1 AND 120);
