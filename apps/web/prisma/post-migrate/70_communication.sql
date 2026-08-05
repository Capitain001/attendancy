-- =============================================================================
-- 70_communication.sql — Module communication (Channel, ChannelMember)
--
-- Auto-provisioning du chat, entièrement en base : les channels ORG/CLASS/
-- GROUP et leurs memberships se créent automatiquement quand les entités
-- métier apparaissent — l'applicatif ne crée JAMAIS ces channels lui-même.
--   · UserOrganization créé  → membership du channel ORG (créé au besoin)
--   · Class créée            → channel CLASS
--   · Group créé             → channel GROUP
--   · StudentEnrollment créé → membership du channel CLASS de la classe
--   · StudentGroup créé      → membership du channel GROUP du groupe
--
-- Les helpers chat_get_*_channel_id sont des GET-OR-CREATE idempotents ;
-- les @@unique Prisma ne bornent pas les channels ORG (classId/groupId NULL),
-- d'où le ORDER BY createdAt LIMIT 1 qui absorbe un éventuel doublon.
-- Memberships en ON CONFLICT DO NOTHING : réinscription sans erreur.
--
-- Dépendances : tables des modules tenant (UserOrganization) et academic
-- (Class, Group, StudentEnrollment, StudentGroup) — créées par Prisma, donc
-- déjà présentes quel que soit l'ordre des fichiers post-migrate.
-- =============================================================================

-- ─── Fonctions (helpers get-or-create) ───────────────────────────────────────

CREATE OR REPLACE FUNCTION "public"."chat_get_org_channel_id"(p_org_id UUID)
RETURNS UUID AS $$
DECLARE
  v_channel_id UUID;
BEGIN
  SELECT c.id
  INTO v_channel_id
  FROM "public"."Channel" c
  WHERE c."orgId" = p_org_id
    AND c.type = 'ORG'::"public"."ChannelType"
    AND c."classId" IS NULL
    AND c."groupId" IS NULL
    AND c."deletedAt" IS NULL
  ORDER BY c."createdAt" ASC
  LIMIT 1;

  IF v_channel_id IS NULL THEN
    INSERT INTO "public"."Channel" (
      id, type, name, "isPrivate", "orgId", "classId", "groupId"
    ) VALUES (
      gen_random_uuid(),
      'ORG'::"public"."ChannelType",
      'org:' || p_org_id::text,
      false,
      p_org_id,
      NULL,
      NULL
    )
    RETURNING id INTO v_channel_id;
  END IF;

  RETURN v_channel_id;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION "public"."chat_get_class_channel_id"(p_class_id UUID)
RETURNS UUID AS $$
DECLARE
  v_channel_id UUID;
  v_org_id UUID;
BEGIN
  SELECT pt."orgId"
  INTO v_org_id
  FROM "public"."Class" c
  JOIN "public"."ProgramTrack" pt ON pt.id = c."programTrackId"
  WHERE c.id = p_class_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Class % has no orgId through ProgramTrack', p_class_id;
  END IF;

  SELECT ch.id
  INTO v_channel_id
  FROM "public"."Channel" ch
  WHERE ch."classId" = p_class_id
    AND ch.type = 'CLASS'::"public"."ChannelType"
    AND ch."deletedAt" IS NULL
  ORDER BY ch."createdAt" ASC
  LIMIT 1;

  IF v_channel_id IS NULL THEN
    INSERT INTO "public"."Channel" (
      id, type, name, "isPrivate", "orgId", "classId", "groupId"
    ) VALUES (
      gen_random_uuid(),
      'CLASS'::"public"."ChannelType",
      'class:' || p_class_id::text,
      false,
      v_org_id,
      p_class_id,
      NULL
    )
    RETURNING id INTO v_channel_id;
  END IF;

  RETURN v_channel_id;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION "public"."chat_get_group_channel_id"(p_group_id UUID)
RETURNS UUID AS $$
DECLARE
  v_channel_id UUID;
  v_org_id UUID;
BEGIN
  SELECT pt."orgId"
  INTO v_org_id
  FROM "public"."Group" g
  JOIN "public"."Class" c ON c.id = g."classId"
  JOIN "public"."ProgramTrack" pt ON pt.id = c."programTrackId"
  WHERE g.id = p_group_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Group % has no orgId through Class/ProgramTrack', p_group_id;
  END IF;

  SELECT ch.id
  INTO v_channel_id
  FROM "public"."Channel" ch
  WHERE ch."groupId" = p_group_id
    AND ch.type = 'GROUP'::"public"."ChannelType"
    AND ch."deletedAt" IS NULL
  ORDER BY ch."createdAt" ASC
  LIMIT 1;

  IF v_channel_id IS NULL THEN
    INSERT INTO "public"."Channel" (
      id, type, name, "isPrivate", "orgId", "classId", "groupId"
    ) VALUES (
      gen_random_uuid(),
      'GROUP'::"public"."ChannelType",
      'group:' || p_group_id::text,
      false,
      v_org_id,
      NULL,
      p_group_id
    )
    RETURNING id INTO v_channel_id;
  END IF;

  RETURN v_channel_id;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ─── Fonctions (trigger handlers) ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION "public"."trg_chat_on_user_organization_ins"()
RETURNS TRIGGER AS $$
DECLARE
  v_org_channel_id UUID;
BEGIN
  v_org_channel_id := "public"."chat_get_org_channel_id"(NEW."orgId");

  INSERT INTO "public"."ChannelMember" (
    id, "userId", "channelId", role
  ) VALUES (
    gen_random_uuid(),
    NEW."userId",
    v_org_channel_id,
    'MEMBER'::"public"."ParticipantRole"
  )
  ON CONFLICT ("channelId", "userId") DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION "public"."trg_chat_on_class_ins"()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM "public"."chat_get_class_channel_id"(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION "public"."trg_chat_on_group_ins"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."classId" IS NOT NULL THEN
    PERFORM "public"."chat_get_group_channel_id"(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION "public"."trg_chat_on_student_enrollment_ins"()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_class_channel_id UUID;
BEGIN
  SELECT s."userId" INTO v_user_id
  FROM "public"."Student" s
  WHERE s.id = NEW."studentId";

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_class_channel_id := "public"."chat_get_class_channel_id"(NEW."classId");

  INSERT INTO "public"."ChannelMember" (
    id, "userId", "channelId", role
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    v_class_channel_id,
    'MEMBER'::"public"."ParticipantRole"
  )
  ON CONFLICT ("channelId", "userId") DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION "public"."trg_chat_on_student_group_ins"()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_group_channel_id UUID;
BEGIN
  SELECT s."userId" INTO v_user_id
  FROM "public"."StudentEnrollment" se
  JOIN "public"."Student" s ON s.id = se."studentId"
  WHERE se.id = NEW."enrollmentId";

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_group_channel_id := "public"."chat_get_group_channel_id"(NEW."groupId");

  INSERT INTO "public"."ChannelMember" (
    id, "userId", "channelId", role
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    v_group_channel_id,
    'MEMBER'::"public"."ParticipantRole"
  )
  ON CONFLICT ("channelId", "userId") DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ─── Triggers ────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS "trg_chat_on_user_organization_ins" ON "public"."UserOrganization";
CREATE TRIGGER "trg_chat_on_user_organization_ins"
AFTER INSERT ON "public"."UserOrganization"
FOR EACH ROW
EXECUTE FUNCTION "public"."trg_chat_on_user_organization_ins"();

DROP TRIGGER IF EXISTS "trg_chat_on_class_ins" ON "public"."Class";
CREATE TRIGGER "trg_chat_on_class_ins"
AFTER INSERT ON "public"."Class"
FOR EACH ROW
EXECUTE FUNCTION "public"."trg_chat_on_class_ins"();

DROP TRIGGER IF EXISTS "trg_chat_on_group_ins" ON "public"."Group";
CREATE TRIGGER "trg_chat_on_group_ins"
AFTER INSERT ON "public"."Group"
FOR EACH ROW
EXECUTE FUNCTION "public"."trg_chat_on_group_ins"();

DROP TRIGGER IF EXISTS "trg_chat_on_student_enrollment_ins" ON "public"."StudentEnrollment";
CREATE TRIGGER "trg_chat_on_student_enrollment_ins"
AFTER INSERT ON "public"."StudentEnrollment"
FOR EACH ROW
EXECUTE FUNCTION "public"."trg_chat_on_student_enrollment_ins"();

DROP TRIGGER IF EXISTS "trg_chat_on_student_group_ins" ON "public"."StudentGroup";
CREATE TRIGGER "trg_chat_on_student_group_ins"
AFTER INSERT ON "public"."StudentGroup"
FOR EACH ROW
EXECUTE FUNCTION "public"."trg_chat_on_student_group_ins"();
