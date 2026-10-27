/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ClassType" AS ENUM ('COHORT', 'THEMATIC');

-- DropIndex
DROP INDEX "course_active_unique_idx";

-- DropIndex
DROP INDEX "justification_pending_unique_idx";

-- DropIndex
DROP INDEX "location_position_idx";

-- DropIndex
DROP INDEX "Organization_name_key";

-- DropIndex
DROP INDEX "permission_function_scope_unique_idx";

-- DropIndex
DROP INDEX "permission_user_scope_unique_idx";

-- DropIndex
DROP INDEX "schedule_during_gist_idx";

-- DropIndex
DROP INDEX "session_position_idx";

-- DropIndex
DROP INDEX "uecourse_active_name_unique_idx";

-- DropIndex
DROP INDEX "uecourse_active_order_unique_idx";

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "type" "ClassType" NOT NULL DEFAULT 'COHORT';

-- CreateIndex
CREATE UNIQUE INDEX "organization_institution_name_unique" ON "Organization"("name") WHERE ("type" = 'INSTITUTION');
