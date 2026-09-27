-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('INSTITUTION', 'PERSONAL');

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "type" "OrganizationType" NOT NULL DEFAULT 'INSTITUTION';

-- AlterTable
ALTER TABLE "Program" ALTER COLUMN "isActive" SET DEFAULT true;
