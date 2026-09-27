-- =============================================================================
-- 90_fees.sql — Module frais de scolarité (FeeStructure, Invoice, Payment...)
-- ⚠️ MODULE DIFFÉRÉ — voir en-tête de fees.prisma (hors périmètre PRD v1).
--
-- Trois garde-fous vivent en base :
--   · CHECK FeeWaiver : exactement un des deux champs (percentage XOR
--     fixedAmount) selon `type` — même esprit que check_schedule_time_order
--     (40_schedule.sql).
--   · CHECK Payment : montant non nul, et remboursement (refundOfId non
--     null) toujours à montant négatif — empêche par construction un
--     "remboursement" positif ou un montant à zéro.
--   · Trigger Class ↔ FeeStructure : une classe ne peut être rattachée qu'à
--     une grille tarifaire de SA PROPRE année académique — même logique que
--     validate_student_class_group (30_academic.sql).
--
-- Ce que ce fichier NE fait PAS (choix assumés, cohérents avec le reste du
-- projet) :
--   · Somme des FeeStructureItem == FeeStructure totale : garde applicative
--     uniquement (documenté en commentaire dans fees.prisma), pas de
--     contrainte DB — pas de total dénormalisé à vérifier.
--   · Somme des InstallmentTemplate.percentage == 100 : idem, applicatif.
--   · Dérivation de Invoice.status / Installment.status depuis les Payment :
--     applicatif, pas de trigger — volume plus faible qu'Attendance.
-- =============================================================================

-- ─── Contraintes CHECK ───────────────────────────────────────────────────────

-- MODEL: FeeWaiver — exactement un des deux montants, cohérent avec `type`.
ALTER TABLE "public"."FeeWaiver"
  DROP CONSTRAINT IF EXISTS "check_fee_waiver_amount_matches_type";
ALTER TABLE "public"."FeeWaiver"
  ADD CONSTRAINT "check_fee_waiver_amount_matches_type"
  CHECK (
    (type = 'PERCENTAGE'   AND percentage  IS NOT NULL AND "fixedAmount" IS NULL)
    OR
    (type = 'FIXED_AMOUNT' AND "fixedAmount" IS NOT NULL AND percentage  IS NULL)
  );

-- MODEL: Payment — montant jamais nul.
ALTER TABLE "public"."Payment"
  DROP CONSTRAINT IF EXISTS "check_payment_amount_not_zero";
ALTER TABLE "public"."Payment"
  ADD CONSTRAINT "check_payment_amount_not_zero"
  CHECK (amount <> 0);

-- MODEL: Payment — un remboursement (refundOfId renseigné) est toujours
-- négatif ; un paiement normal (refundOfId null) reste libre en signe pour
-- ne pas casser un cas d'usage futur non prévu ici, mais en pratique positif.
ALTER TABLE "public"."Payment"
  DROP CONSTRAINT IF EXISTS "check_payment_refund_is_negative";
ALTER TABLE "public"."Payment"
  ADD CONSTRAINT "check_payment_refund_is_negative"
  CHECK ("refundOfId" IS NULL OR amount < 0);

-- ─── Fonctions ───────────────────────────────────────────────────────────────

-- MODEL: Class — cohérence académique de la grille tarifaire rattachée.
-- Se déclenche à l'insertion/mise à jour de feeStructureId (ou de
-- academicYearId, au cas où une classe change d'année après coup).
CREATE OR REPLACE FUNCTION "public"."validate_class_fee_structure_year"()
RETURNS TRIGGER AS $$
DECLARE
  v_fee_structure_year UUID;
BEGIN
  IF NEW."feeStructureId" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT fs."academicYearId"
  INTO v_fee_structure_year
  FROM "public"."FeeStructure" fs
  WHERE fs.id = NEW."feeStructureId";

  IF v_fee_structure_year IS NULL THEN
    RAISE EXCEPTION 'FeeStructure % introuvable', NEW."feeStructureId";
  END IF;

  IF v_fee_structure_year <> NEW."academicYearId" THEN
    RAISE EXCEPTION
      'La grille tarifaire doit appartenir à la même année académique que la classe';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Triggers ────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS "validate_class_fee_structure_year" ON "public"."Class";
CREATE TRIGGER "validate_class_fee_structure_year"
BEFORE INSERT OR UPDATE OF "feeStructureId", "academicYearId" ON "public"."Class"
FOR EACH ROW
EXECUTE FUNCTION "public"."validate_class_fee_structure_year"();
