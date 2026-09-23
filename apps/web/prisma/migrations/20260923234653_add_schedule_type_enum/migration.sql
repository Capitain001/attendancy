/*
  Warnings:

  - You are about to drop the column `classId` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `comment` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `Evaluation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id,studentId]` on the table `StudentEnrollment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `title` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Evaluation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GradeStatus" AS ENUM ('GRADED', 'ABSENT', 'EXCUSED', 'PENDING');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('CM', 'TD', 'TP', 'EXAM', 'RATTRAPAGE');

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_classId_fkey";

-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_studentId_fkey";

-- DropIndex
DROP INDEX "Evaluation_classId_idx";

-- DropIndex
DROP INDEX "Evaluation_studentId_idx";

-- DropIndex
DROP INDEX "location_position_idx";

-- DropIndex
DROP INDEX "permission_function_scope_unique_idx";

-- DropIndex
DROP INDEX "permission_user_scope_unique_idx";

-- DropIndex
DROP INDEX "schedule_during_gist_idx";

-- DropIndex
DROP INDEX "session_position_idx";

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "classId",
DROP COLUMN "comment",
DROP COLUMN "score",
DROP COLUMN "studentId",
ADD COLUMN     "coefficient" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "datedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "scheduleType" "ScheduleType" NOT NULL DEFAULT 'CM';

-- AlterTable
ALTER TABLE "WeeklySlot" ADD COLUMN     "scheduleType" "ScheduleType" NOT NULL DEFAULT 'CM';

-- CreateTable
CREATE TABLE "TeacherCourseHours" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orgId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "scheduleType" "ScheduleType" NOT NULL,
    "completedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherCourseHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "evaluationId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "status" "GradeStatus" NOT NULL DEFAULT 'PENDING',
    "score" DOUBLE PRECISION,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherCourseHours_orgId_idx" ON "TeacherCourseHours"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherCourseHours_teacherId_courseId_scheduleType_key" ON "TeacherCourseHours"("teacherId", "courseId", "scheduleType");

-- CreateIndex
CREATE INDEX "Grade_enrollmentId_idx" ON "Grade"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_evaluationId_enrollmentId_key" ON "Grade"("evaluationId", "enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentEnrollment_id_studentId_key" ON "StudentEnrollment"("id", "studentId");

-- AddForeignKey
ALTER TABLE "TeacherCourseHours" ADD CONSTRAINT "TeacherCourseHours_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherCourseHours" ADD CONSTRAINT "TeacherCourseHours_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherCourseHours" ADD CONSTRAINT "TeacherCourseHours_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_enrollmentId_studentId_fkey" FOREIGN KEY ("enrollmentId", "studentId") REFERENCES "StudentEnrollment"("id", "studentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "StudentEnrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
