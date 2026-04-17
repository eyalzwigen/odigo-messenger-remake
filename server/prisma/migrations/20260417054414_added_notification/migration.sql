/*
  Warnings:

  - You are about to drop the column `status` on the `FriendRequest` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `GroupInvite` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('Unfriend');

-- AlterTable
ALTER TABLE "FriendRequest" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "GroupInvite" DROP COLUMN "status";

-- DropEnum
DROP TYPE "RequestStatus";

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "type" "NotificationType" NOT NULL,
    "data" JSONB NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
