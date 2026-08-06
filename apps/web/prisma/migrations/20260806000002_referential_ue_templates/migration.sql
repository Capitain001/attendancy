-- Migration: Référentiel national UE templates
-- New models: NationalReferential, UETemplate, UETemplateEC, UETemplateImport
-- New enum: UETemplateType

CREATE TYPE "public"."UETemplateType" AS ENUM (
  'FONDAMENTALE',
  'COMPLEMENTAIRE',
  'APPROFONDISSEMENT',
  'SPECIALITE',
  'TRANSVERSALE',
  'LIBRE'
);

CREATE TABLE "public"."NationalReferential" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "country"     TEXT        NOT NULL,
  "issuer"      TEXT        NOT NULL,
  "name"        TEXT        NOT NULL,
  "version"     TEXT        NOT NULL,
  "isActive"    BOOLEAN     NOT NULL DEFAULT true,
  "publishedAt" TIMESTAMP(3) NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NationalReferential_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NationalReferential_country_idx" ON "public"."NationalReferential"("country");

CREATE TABLE "public"."UETemplate" (
  "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
  "referentialId" UUID        NOT NULL,
  "domain"        TEXT        NOT NULL,
  "degree"        TEXT        NOT NULL,
  "mention"       TEXT        NOT NULL,
  "speciality"    TEXT,
  "semester"      INTEGER     NOT NULL,
  "code"          TEXT,
  "name"          TEXT        NOT NULL,
  "type"          "public"."UETemplateType" NOT NULL,
  "credits"       DECIMAL(4,2) NOT NULL,
  CONSTRAINT "UETemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UETemplate_referentialId_domain_mention_semester_idx"
  ON "public"."UETemplate"("referentialId", "domain", "mention", "semester");

ALTER TABLE "public"."UETemplate"
  ADD CONSTRAINT "UETemplate_referentialId_fkey"
  FOREIGN KEY ("referentialId")
  REFERENCES "public"."NationalReferential"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "public"."UETemplateEC" (
  "id"         UUID    NOT NULL DEFAULT gen_random_uuid(),
  "templateId" UUID    NOT NULL,
  "code"       TEXT    NOT NULL,
  "name"       TEXT,
  "credits"    DECIMAL(4,2) NOT NULL,
  CONSTRAINT "UETemplateEC_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."UETemplateEC"
  ADD CONSTRAINT "UETemplateEC_templateId_fkey"
  FOREIGN KEY ("templateId")
  REFERENCES "public"."UETemplate"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."UETemplateEC"
  ADD CONSTRAINT "UETemplateEC_templateId_code_key"
  UNIQUE ("templateId", "code");

CREATE TABLE "public"."UETemplateImport" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "templateId" UUID        NOT NULL,
  "orgId"      UUID        NOT NULL,
  "ueId"       UUID        NOT NULL,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UETemplateImport_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."UETemplateImport"
  ADD CONSTRAINT "UETemplateImport_templateId_fkey"
  FOREIGN KEY ("templateId")
  REFERENCES "public"."UETemplate"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "UETemplateImport_templateId_orgId_key"
  ON "public"."UETemplateImport"("templateId", "orgId");

CREATE INDEX "UETemplateImport_orgId_idx"
  ON "public"."UETemplateImport"("orgId");
