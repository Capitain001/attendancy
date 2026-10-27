/*
  Warnings:

  - A unique constraint covering the columns `[courseId]` on the table `Group` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "courseId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "Group_courseId_key" ON "Group"("courseId");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
