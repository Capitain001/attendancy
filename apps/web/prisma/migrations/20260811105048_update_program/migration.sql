/*
  Warnings:

  - You are about to alter the column `totalCredits` on the `UETemplate` table. The data in that column could be lost. The data in that column will be cast from `Decimal(4,2)` to `DoublePrecision`.
  - You are about to alter the column `credits` on the `UETemplateEC` table. The data in that column could be lost. The data in that column will be cast from `Decimal(4,2)` to `DoublePrecision`.

*/
-- CreateEnum
CREATE TYPE "UEType" AS ENUM ('FONDAMENTALE', 'COMPLEMENTAIRE', 'APPROFONDISSEMENT', 'SPECIALITE', 'TRANSVERSALE', 'LIBRE');

-- AlterTable
ALTER TABLE "ProgramTemplate" ADD COLUMN     "level" "Level" NOT NULL DEFAULT 'L1';

-- AlterTable
ALTER TABLE "UE" ADD COLUMN     "type" "UEType" NOT NULL DEFAULT 'FONDAMENTALE';

-- AlterTable
ALTER TABLE "UECourse" ALTER COLUMN "duration" SET DEFAULT 24;

-- AlterTable
ALTER TABLE "UETemplate" ALTER COLUMN "totalCredits" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "UETemplateEC" ADD COLUMN     "duration" INTEGER DEFAULT 24,
ADD COLUMN     "settings" JSONB,
ALTER COLUMN "credits" SET DATA TYPE DOUBLE PRECISION;
