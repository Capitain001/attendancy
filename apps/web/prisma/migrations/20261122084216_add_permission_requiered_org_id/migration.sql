/*
  Warnings:

  - Made the column `orgId` on table `Permission` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_functionId_fkey";

-- AlterTable
ALTER TABLE "Permission" ALTER COLUMN "orgId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "Function"("id") ON DELETE CASCADE ON UPDATE CASCADE;
