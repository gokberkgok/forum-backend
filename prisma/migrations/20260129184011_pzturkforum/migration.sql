-- CreateEnum
CREATE TYPE "AdvertisementType" AS ENUM ('BANNER', 'POPUP');

-- CreateEnum
CREATE TYPE "AdvertisementStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SCHEDULED', 'EXPIRED');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "is_quoted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quoted_post_id" TEXT;

-- AlterTable
ALTER TABLE "topics" ADD COLUMN     "pinned_color" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "birth_date" TIMESTAMP(3),
ADD COLUMN     "discord" TEXT,
ADD COLUMN     "github" TEXT,
ADD COLUMN     "show_birth_date" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twitter" TEXT;

-- CreateTable
CREATE TABLE "advertisements" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AdvertisementType" NOT NULL,
    "status" "AdvertisementStatus" NOT NULL DEFAULT 'INACTIVE',
    "image_url" TEXT NOT NULL,
    "link_url" TEXT,
    "alt_text" TEXT,
    "title" TEXT,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "background_color" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "advertisements_type_idx" ON "advertisements"("type");

-- CreateIndex
CREATE INDEX "advertisements_status_idx" ON "advertisements"("status");

-- CreateIndex
CREATE INDEX "advertisements_start_date_end_date_idx" ON "advertisements"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_key_key" ON "site_settings"("key");

-- CreateIndex
CREATE INDEX "posts_quoted_post_id_idx" ON "posts"("quoted_post_id");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_quoted_post_id_fkey" FOREIGN KEY ("quoted_post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
