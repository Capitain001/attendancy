-- =============================================================================
-- 50_attendance.sql — Module présence (Session, SessionToken, Attendance)
--
-- Le check-in enseignant est ATOMIQUE côté DB (teacher_check_in) : vérif GPS
-- + création Session + marquage Schedule en une transaction — impossible
-- d'avoir une session sans vérification ou une vérification sans session.
-- Pattern fetch-once : un seul SELECT global, les sous-fonctions reçoivent
-- les données en paramètre (verify_point_in_radius ne requête jamais).
--
-- ONGOING est UI-only : le check-in ne touche PAS Schedule.status (reste
-- PENDING) ; la trace = confirmed + statusChangedAt.
-- Tokens d'émargement : rotation par create_session_token (expire les
-- anciens, un seul actif), TTL court — la sécurité vient de la rotation.
--
-- Dépendances : 00_extensions (postgis), 40_schedule (Schedule.during n'est
-- pas requis ici, mais Location.position OUI — lue par teacher_check_in).
-- =============================================================================

-- ─── Colonnes dérivées ───────────────────────────────────────────────────────

-- Position du prof au check-in — écrite par teacher_check_in uniquement.
ALTER TABLE "public"."Session"
  ADD COLUMN IF NOT EXISTS position geography(Point, 4326);

-- ─── Index ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS session_position_idx
  ON "public"."Session" USING GIST (position);

-- ─── Fonctions ───────────────────────────────────────────────────────────────

-- Calcul spatial pur — aucune requête interne, testable sans fixture :
--   SELECT * FROM verify_point_in_radius(
--     ST_MakePoint(1.2228, 6.1375)::geography, 50, 6.1376, 1.2229);
CREATE OR REPLACE FUNCTION verify_point_in_radius(
  p_location_geog geography,
  p_radius        DOUBLE PRECISION,
  p_user_lat      DOUBLE PRECISION,
  p_user_lng      DOUBLE PRECISION
)
RETURNS TABLE (
  is_within  BOOLEAN,
  distance_m DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY SELECT
    ST_DWithin(p_location_geog, ST_MakePoint(p_user_lng, p_user_lat)::geography, p_radius) AS is_within,
    ST_Distance(p_location_geog, ST_MakePoint(p_user_lng, p_user_lat)::geography)          AS distance_m;
END;
$$ LANGUAGE plpgsql STABLE;

-- Check-in enseignant. Géofencing appliqué seulement si une Location active
-- est rattachée à la salle (sinon : cours en ligne / géo désactivée — la
-- position est enregistrée quand même, sans blocage).
-- p_method : décidé par le service ('GPS'|'QR'|'ADMIN_OVERRIDE'|'WIFI'|'FACE_RECOGNITION').
CREATE OR REPLACE FUNCTION teacher_check_in(
  p_schedule_id UUID,
  p_lat         DOUBLE PRECISION,
  p_lng         DOUBLE PRECISION,
  p_method      TEXT
)
RETURNS JSON AS $$
DECLARE
  v_data           RECORD;
  v_geo_check      RECORD;
  v_session_id     UUID;
  v_now            TIMESTAMPTZ := NOW();
  v_is_late        BOOLEAN;
  v_check_in_point geography(Point, 4326);
BEGIN

  -- Fetch unique : schedule + room + location + session existante
  SELECT
    s.id                  AS schedule_id,
    s.status              AS schedule_status,
    s."startTime"         AS start_time,
    s."teacherId"         AS teacher_id,
    sess.id               AS existing_session_id,
    l.id                  AS location_id,
    l.position            AS location_position,
    l.radius              AS location_radius,
    l.active              AS location_active
  INTO v_data
  FROM "public"."Schedule" s
  JOIN "public"."Room" r             ON r.id = s."roomId"
  LEFT JOIN "public"."Location" l    ON l.id = r."locationId"
  LEFT JOIN "public"."Session"  sess ON sess."scheduleId" = s.id
  WHERE s.id = p_schedule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Planning introuvable.';
  END IF;

  IF v_data.existing_session_id IS NOT NULL THEN
    RAISE EXCEPTION 'Une session est déjà active pour ce cours.';
  END IF;

  IF v_data.schedule_status IN ('CANCELED', 'MISSED') THEN
    RAISE EXCEPTION 'Ce cours ne peut pas être démarré (annulé ou manqué).';
  END IF;

  IF v_data.location_id IS NOT NULL AND v_data.location_active THEN
    SELECT * INTO v_geo_check
    FROM verify_point_in_radius(
      v_data.location_position,
      v_data.location_radius,
      p_lat,
      p_lng
    );

    IF NOT v_geo_check.is_within THEN
      RAISE EXCEPTION 'Vous êtes trop loin de la salle (% m, rayon autorisé : % m).',
        ROUND(v_geo_check.distance_m::numeric, 0),
        ROUND(v_data.location_radius::numeric, 0);
    END IF;
  END IF;

  v_is_late        := v_now > v_data.start_time;
  v_check_in_point := ST_MakePoint(p_lng, p_lat)::geography;

  INSERT INTO "public"."Session" (
    "scheduleId",
    status,
    "checkIn",
    "checkInMethod",
    position,
    "locationId",
    "isLate"
  ) VALUES (
    p_schedule_id,
    'ACTIVE',
    v_now,
    p_method::"VerificationMethod",
    v_check_in_point,
    v_data.location_id,
    v_is_late
  )
  RETURNING id INTO v_session_id;

  -- Pas de status : ONGOING = UI-only, dérivé du temps.
  UPDATE "public"."Schedule"
  SET
    "statusChangedAt" = v_now,
    confirmed         = true
  WHERE id = p_schedule_id;

  RETURN json_build_object(
    'sessionId',     v_session_id,
    'checkIn',       v_now,
    'isLate',        v_is_late,
    'locationId',    v_data.location_id,
    'checkInMethod', p_method
  );

END;
$$ LANGUAGE plpgsql VOLATILE;

-- Rotation des tokens d'émargement : expire les actifs, en crée un seul.
CREATE OR REPLACE FUNCTION create_session_token(
  p_session_id   UUID,
  p_duration_min INT DEFAULT 15
)
RETURNS TABLE (
  token       UUID,
  "expiresAt" TIMESTAMPTZ
) AS $$
DECLARE
  v_expires_at TIMESTAMPTZ := NOW() + (p_duration_min || ' minutes')::INTERVAL;
  v_token      UUID        := gen_random_uuid();
BEGIN
  UPDATE "public"."SessionToken" st
  SET "expiresAt" = NOW()
  WHERE st."sessionId" = p_session_id
    AND st."expiresAt" > NOW();

  INSERT INTO "public"."SessionToken" ("sessionId", token, "expiresAt")
  VALUES (p_session_id, v_token, v_expires_at);

  -- Alias explicites : évite l'ambiguïté variable / colonne
  RETURN QUERY SELECT v_token AS token, v_expires_at AS "expiresAt";
END;
$$ LANGUAGE plpgsql VOLATILE;

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

-- ─── Vues ────────────────────────────────────────────────────────────────────

-- Lecture agrégée pour la visualisation direction (carte de présence).
-- Lecture seule — aucune logique métier.
CREATE OR REPLACE VIEW session_presence_map AS
SELECT
  sch.id                                    AS schedule_id,
  sess.id                                   AS session_id,
  sess."checkIn"                            AS session_start,
  sess."checkOut"                           AS session_end,
  sess."isLate"                             AS teacher_is_late,
  sess."durationMinutes"                    AS duration_minutes,

  ST_AsGeoJSON(sess.position)::json         AS teacher_position,

  loc.id                                    AS location_id,
  loc.name                                  AS location_name,
  ST_AsGeoJSON(loc.position)::json          AS location_center,
  loc.radius                                AS location_radius,

  json_agg(
    json_build_object(
      'studentId',  a."studentId",
      'status',     a.status,
      'recordedAt', a."recordedAt"
    )
    ORDER BY a."recordedAt"
  ) FILTER (WHERE a.id IS NOT NULL)         AS student_points,

  COUNT(a.id)                               AS total_attendances,
  COUNT(a.id) FILTER (WHERE a.status = 'PRESENT') AS present_count

FROM "public"."Schedule"  sch
JOIN "public"."Session"   sess ON sess."scheduleId" = sch.id
LEFT JOIN "public"."Location"   loc ON loc.id = sess."locationId"
LEFT JOIN "public"."Attendance" a   ON a."scheduleId" = sch.id
GROUP BY
  sch.id, sess.id, sess."checkIn", sess."checkOut", sess."isLate",
  sess."durationMinutes", sess.position, loc.id, loc.name, loc.position, loc.radius;
