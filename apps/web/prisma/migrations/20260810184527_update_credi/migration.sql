/*
  Warnings:

  - You are about to alter the column `credits` on the `UECourse` table. The data in that column could be lost. The data in that column will be cast from `Decimal(4,2)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "credits" SET DEFAULT 2,
ALTER COLUMN "credits" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "UECourse" ALTER COLUMN "credits" SET DATA TYPE DOUBLE PRECISION;
