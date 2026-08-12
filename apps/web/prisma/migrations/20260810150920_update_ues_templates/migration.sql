/*
  Warnings:

  - The values [STUDENT] on the enum `InvitationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [SUPER_ADMIN] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `credits` on the `UETemplate` table. All the data in the column will be lost.
  - You are about to drop the column `degree` on the `UETemplate` table. All the data in the column will be lost.
  - You are about to drop the column `domain` on the `UETemplate` table. All the data in the column will be lost.
  - You are about to drop the column `mention` on the `UETemplate` table. All the data in the column will be lost.
  - You are about to drop the column `semester` on the `UETemplate` table. All the data in the column will be lost.
  - You are about to drop the column `speciality` on the `UETemplate` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `UETemplate` table. All the data in the column will be lost.
  - You are about to drop the `NationalReferential` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UETemplateImport` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[referentialId,code]` on the table `UETemplate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[templateId,order]` on the table `UETemplateEC` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `order` to the `UETemplateEC` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `UETemplateEC` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "DegreeType" AS ENUM ('LICENCE_PROFESSIONNELLE', 'LICENCE_FONDAMENTALE', 'MASTER');

-- AlterEnum
BEGIN;
CREATE TYPE "InvitationType_new" AS ENUM ('DIRECT_CREATE', 'INVITE_ONLY');
ALTER TABLE "public"."Invitation" ALTER COLUMN "invitationType" DROP DEFAULT;
ALTER TABLE "Invitation" ALTER COLUMN "invitationType" TYPE "InvitationType_new" USING ("invitationType"::text::"InvitationType_new");
ALTER TYPE "InvitationType" RENAME TO "InvitationType_old";
ALTER TYPE "InvitationType_new" RENAME TO "InvitationType";
DROP TYPE "public"."InvitationType_old";
ALTER TABLE "Invitation" ALTER COLUMN "invitationType" SET DEFAULT 'INVITE_ONLY';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'DIRECTION');
ALTER TABLE "public"."UserOrganization" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "Event" ALTER COLUMN "targetRoles" TYPE "Role_new"[] USING ("targetRoles"::text::"Role_new"[]);
ALTER TABLE "UserOrganization" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "UserOrganization" ALTER COLUMN "role" SET DEFAULT 'TEACHER';
COMMIT;

-- DropForeignKey
ALTER TABLE "UETemplate" DROP CONSTRAINT "UETemplate_referentialId_fkey";

-- DropForeignKey
ALTER TABLE "UETemplateEC" DROP CONSTRAINT "UETemplateEC_templateId_fkey";

-- DropForeignKey
ALTER TABLE "UETemplateImport" DROP CONSTRAINT "UETemplateImport_templateId_fkey";

-- DropIndex
DROP INDEX "UETemplate_referentialId_domain_mention_semester_idx";

-- AlterTable
ALTER TABLE "UETemplate" DROP COLUMN "credits",
DROP COLUMN "degree",
DROP COLUMN "domain",
DROP COLUMN "mention",
DROP COLUMN "semester",
DROP COLUMN "speciality",
DROP COLUMN "type",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "totalCredits" DECIMAL(4,2);

-- AlterTable
ALTER TABLE "UETemplateEC" ADD COLUMN     "description" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL,
ALTER COLUMN "name" SET NOT NULL;

-- DropTable
DROP TABLE "NationalReferential";

-- DropTable
DROP TABLE "UETemplateImport";

-- CreateTable
CREATE TABLE "Referential" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "country" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramTemplate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referentialId" UUID NOT NULL,
    "domain" TEXT NOT NULL,
    "mention" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "degree" "DegreeType" NOT NULL DEFAULT 'LICENCE_PROFESSIONNELLE',
    "profile" TEXT,
    "competencies" TEXT,
    "outcomes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramUETemplate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "programId" UUID NOT NULL,
    "ueTemplateId" UUID NOT NULL,
    "semester" INTEGER NOT NULL,
    "order" INTEGER,
    "type" "UETemplateType" NOT NULL,

    CONSTRAINT "ProgramUETemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgProgramTemplate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orgId" UUID NOT NULL,
    "programTemplateId" UUID NOT NULL,
    "departmentId" UUID,
    "trackId" UUID,
    "programId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgProgramTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgUETemplate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "templateId" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "ueId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgUETemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Referential_country_idx" ON "Referential"("country");

-- CreateIndex
CREATE INDEX "ProgramTemplate_referentialId_domain_idx" ON "ProgramTemplate"("referentialId", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramTemplate_referentialId_domain_mention_specialty_key" ON "ProgramTemplate"("referentialId", "domain", "mention", "specialty");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramUETemplate_programId_ueTemplateId_key" ON "ProgramUETemplate"("programId", "ueTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramUETemplate_programId_semester_order_key" ON "ProgramUETemplate"("programId", "semester", "order");

-- CreateIndex
CREATE INDEX "OrgProgramTemplate_orgId_idx" ON "OrgProgramTemplate"("orgId");

-- CreateIndex
CREATE INDEX "OrgProgramTemplate_programTemplateId_idx" ON "OrgProgramTemplate"("programTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgProgramTemplate_orgId_programTemplateId_key" ON "OrgProgramTemplate"("orgId", "programTemplateId");

-- CreateIndex
CREATE INDEX "OrgUETemplate_orgId_idx" ON "OrgUETemplate"("orgId");

-- CreateIndex
CREATE INDEX "OrgUETemplate_templateId_idx" ON "OrgUETemplate"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgUETemplate_templateId_orgId_key" ON "OrgUETemplate"("templateId", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "UETemplate_referentialId_code_key" ON "UETemplate"("referentialId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "UETemplateEC_templateId_order_key" ON "UETemplateEC"("templateId", "order");

-- AddForeignKey
ALTER TABLE "ProgramTemplate" ADD CONSTRAINT "ProgramTemplate_referentialId_fkey" FOREIGN KEY ("referentialId") REFERENCES "Referential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UETemplate" ADD CONSTRAINT "UETemplate_referentialId_fkey" FOREIGN KEY ("referentialId") REFERENCES "Referential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UETemplateEC" ADD CONSTRAINT "UETemplateEC_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "UETemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramUETemplate" ADD CONSTRAINT "ProgramUETemplate_programId_fkey" FOREIGN KEY ("programId") REFERENCES "ProgramTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramUETemplate" ADD CONSTRAINT "ProgramUETemplate_ueTemplateId_fkey" FOREIGN KEY ("ueTemplateId") REFERENCES "UETemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgProgramTemplate" ADD CONSTRAINT "OrgProgramTemplate_programTemplateId_fkey" FOREIGN KEY ("programTemplateId") REFERENCES "ProgramTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgUETemplate" ADD CONSTRAINT "OrgUETemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "UETemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
