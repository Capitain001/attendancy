/*
  Warnings:

  - You are about to drop the column `scheduleId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Notification` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NotificationEvent" AS ENUM ('CREATED', 'UPDATED', 'CANCELED', 'CONFIRMED', 'ASSIGNED', 'UNASSIGNED');

-- AlterEnum
ALTER TYPE "Resource" ADD VALUE 'INVITATION';

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_scheduleId_fkey";

-- DropIndex
DROP INDEX "Notification_scheduleId_idx";

-- DropIndex
DROP INDEX "Notification_userId_idx";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "scheduleId",
DROP COLUMN "type",
ADD COLUMN     "event" "NotificationEvent",
ADD COLUMN     "orgId" UUID,
ADD COLUMN     "resourceId" UUID,
ADD COLUMN     "resourceType" "Resource";

-- DropEnum
DROP TYPE "NotificationType";

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_orgId_createdAt_idx" ON "Notification"("orgId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_resourceType_resourceId_idx" ON "Notification"("resourceType", "resourceId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
