-- Migration: UECourse.credits Int → Decimal(4,2)
-- Required for Togo national referential (decimal credits: 1.5, 2.5)

ALTER TABLE "public"."UECourse" ALTER COLUMN "credits" TYPE DECIMAL(4,2);
