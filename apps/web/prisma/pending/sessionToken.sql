-- =============================================================================
-- Migration : SessionToken + AttendanceStatus PENDING
-- Fichier   : add_session_token.sql
-- Appliquer : Supabase Dashboard → SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Ajouter PENDING à l'enum AttendanceStatus
-- -----------------------------------------------------------------------------

ALTER TYPE "public"."AttendanceStatus" ADD VALUE IF NOT EXISTS 'PENDING';

-- -----------------------------------------------------------------------------
-- 2. Table SessionToken
--    Un token QR par session, valide 15 minutes
--    Un seul token ACTIVE à la fois par session (partial unique index)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."SessionToken" (
  id          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "sessionId" UUID        NOT NULL,
  token       UUID        NOT NULL DEFAULT gen_random_uuid(),
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "SessionToken_pkey"      PRIMARY KEY (id),
  CONSTRAINT "SessionToken_token_key" UNIQUE (token),
  CONSTRAINT "SessionToken_session_fkey"
    FOREIGN KEY ("sessionId")
    REFERENCES "public"."Session" (id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE "SessionToken" ENABLE ROW LEVEL SECURITY;
-- Un seul token valide à la fois par session
CREATE UNIQUE INDEX IF NOT EXISTS session_token_active_unique
  ON "public"."SessionToken" ("sessionId")
  WHERE ("expiresAt" > NOW());

-- Index pour la lookup par token (page /attend?token=xxx)
CREATE INDEX IF NOT EXISTS session_token_lookup_idx
  ON "public"."SessionToken" (token, "expiresAt");

-- -----------------------------------------------------------------------------
-- 3. Fonction : create_session_token
--    Génère un nouveau token (invalide les anciens via l'index partial)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION create_session_token(
  p_session_id    UUID,
  p_duration_min  INT DEFAULT 15
)
RETURNS TABLE (
  token       UUID,
  "expiresAt" TIMESTAMPTZ
) AS $$
DECLARE
  v_expires_at TIMESTAMPTZ := NOW() + (p_duration_min || ' minutes')::INTERVAL;
  v_token      UUID        := gen_random_uuid();
BEGIN
  -- Expire les anciens tokens de cette session
  UPDATE "public"."SessionToken"
  SET "expiresAt" = NOW()
  WHERE "sessionId" = p_session_id
    AND "expiresAt" > NOW();

  -- Crée le nouveau token
  INSERT INTO "public"."SessionToken" ("sessionId", token, "expiresAt")
  VALUES (p_session_id, v_token, v_expires_at);

  RETURN QUERY
  SELECT v_token, v_expires_at;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- -----------------------------------------------------------------------------
-- 4. Fonction : validate_session_token
--    Vérifie qu'un token est valide + non expiré
--    Retourne sessionId + scheduleId pour créer l'Attendance
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION validate_session_token(p_token UUID)
RETURNS TABLE (
  "sessionId"  UUID,
  "scheduleId" UUID,
  "isExpired"  BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    st."sessionId",
    s."scheduleId",
    st."expiresAt" <= NOW() AS "isExpired"
  FROM "public"."SessionToken" st
  JOIN "public"."Session" s ON s.id = st."sessionId"
  WHERE st.token = p_token;
END;
$$ LANGUAGE plpgsql STABLE;