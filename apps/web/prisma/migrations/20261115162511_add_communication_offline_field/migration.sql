-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "signature" BYTEA;

-- AlterTable
ALTER TABLE "UserDevice" ADD COLUMN     "publicKey" TEXT;
