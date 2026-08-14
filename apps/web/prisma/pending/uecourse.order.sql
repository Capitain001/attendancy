  -- INSERT — fn_uecourse_insert_order

  -- =========================================================
  -- Gère l'ordre à l'insertion d'une UECourse
  -- • order NULL  → place en dernière position (fallback)
  -- • order fourni et libre → insertion directe
  -- • order fourni et occupé → décale les suivants
  -- =========================================================
  CREATE OR REPLACE FUNCTION fn_uecourse_insert_order()
  RETURNS TRIGGER AS $$
  BEGIN

    IF pg_trigger_depth() > 1 THEN
      RETURN NEW;
    END IF;

    -- fallback fin de liste
    IF NEW."order" IS NULL THEN
      SELECT COALESCE(MAX("order"), 0) + 1
      INTO NEW."order"
      FROM "UECourse"
      WHERE "ueId" = NEW."ueId";

      RETURN NEW;
    END IF;

    -- si position occupée → décaler
    IF EXISTS (
      SELECT 1
      FROM "UECourse"
      WHERE "ueId" = NEW."ueId"
      AND "order" = NEW."order"
    ) THEN

      -- déplacement temporaire
      UPDATE "UECourse"
      SET "order" = "order" + 1000
      WHERE "ueId" = NEW."ueId"
      AND "order" >= NEW."order";

      -- repositionnement final
      UPDATE "UECourse"
      SET "order" = "order" - 999
      WHERE "ueId" = NEW."ueId"
      AND "order" >= NEW."order" + 1000;

    END IF;

    RETURN NEW;

  END;
  $$ LANGUAGE plpgsql;


  CREATE TRIGGER trg_uecourse_insert_order
  BEFORE INSERT ON "UECourse"
  FOR EACH ROW EXECUTE FUNCTION fn_uecourse_insert_order();

  -- DELETE — fn_uecourse_delete_order

  -- =========================================================
  -- Comble les trous après suppression d'une UECourse
  -- Utile pour les autres utilisateurs qui voient la liste
  -- =========================================================
  CREATE OR REPLACE FUNCTION fn_uecourse_delete_order()
  RETURNS TRIGGER AS $$
  BEGIN

    -- Anti-récursion native PostgreSQL
    IF pg_trigger_depth() > 1 THEN
      RETURN OLD;
    END IF;

    -- Décale les suivants de -1 pour combler le trou
    UPDATE "UECourse"
    SET "order" = "order" - 1
    WHERE "ueId" = OLD."ueId"
      AND "order" > OLD."order";

    RETURN OLD;

  END;
  $$ LANGUAGE plpgsql;


  CREATE TRIGGER trg_uecourse_delete_order
  AFTER DELETE ON "UECourse"
  FOR EACH ROW EXECUTE FUNCTION fn_uecourse_delete_order();


