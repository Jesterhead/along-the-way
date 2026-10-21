-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('TEXT');

-- CreateTable
CREATE TABLE "Post" (
    "id" UUID NOT NULL,
    "journalId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" UUID NOT NULL,
    "text" TEXT,
    "type" "BlockType" NOT NULL,
    "position" INTEGER NOT NULL,
    "postId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Post_journalId_idx" ON "Post"("journalId");

-- CreateIndex
CREATE UNIQUE INDEX "Block_postId_position_key" ON "Block"("postId", "position");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Block" ADD CONSTRAINT "Block_text_required_for_text"
  CHECK ("type" <> 'TEXT' OR "text" IS NOT NULL);