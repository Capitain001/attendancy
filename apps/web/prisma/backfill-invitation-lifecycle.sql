-- Data backfill only; this file does not create, alter, or drop schema objects.
-- Run after Invitation.status exists and before the legacy revokedAt column is dropped.
-- Apply the Invitation status/usedAt consistency constraint only after this backfill.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Invitation'
      AND column_name = 'status'
  ) OR NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Invitation'
      AND column_name = 'usedAt'
  ) OR NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Invitation'
      AND column_name = 'revokedAt'
  ) THEN
    RAISE EXCEPTION
      'Expected Invitation.status, usedAt, and legacy revokedAt columns. Run this backfill before dropping revokedAt.';
  END IF;
END
$$;

UPDATE public."Invitation"
SET
  "status" = CASE
    WHEN "usedAt" IS NOT NULL THEN 'ACCEPTED'::public."InvitationStatus"
    WHEN "details" ->> 'status' = 'DECLINED' THEN 'DECLINED'::public."InvitationStatus"
    WHEN "revokedAt" IS NOT NULL THEN 'REVOKED'::public."InvitationStatus"
    ELSE 'PENDING'::public."InvitationStatus"
  END,
  "usedAt" = CASE
    WHEN "usedAt" IS NOT NULL THEN "usedAt"
    -- Older declines may have no recorded date; use migration time rather than
    -- fabricating an earlier resolution date.
    WHEN "details" ->> 'status' = 'DECLINED' THEN COALESCE("revokedAt", transaction_timestamp())
    WHEN "revokedAt" IS NOT NULL THEN "revokedAt"
    ELSE NULL
  END
WHERE "status" = 'PENDING'
  AND (
    "usedAt" IS NOT NULL
    OR "revokedAt" IS NOT NULL
    OR "details" ->> 'status' = 'DECLINED'
  );

COMMIT;
