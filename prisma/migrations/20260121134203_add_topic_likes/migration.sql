-- CreateTable
CREATE TABLE "topic_likes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "topic_likes_topic_id_idx" ON "topic_likes"("topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "topic_likes_user_id_topic_id_key" ON "topic_likes"("user_id", "topic_id");

-- AddForeignKey
ALTER TABLE "topic_likes" ADD CONSTRAINT "topic_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_likes" ADD CONSTRAINT "topic_likes_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
