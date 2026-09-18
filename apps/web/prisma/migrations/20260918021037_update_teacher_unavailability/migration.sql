-- Convertit les colonnes String vers TIME sans supprimer les données existantes
ALTER TABLE "TeacherUnavailability" 
  ALTER COLUMN "startTime" TYPE TIME USING "startTime"::TIME,
  ALTER COLUMN "endTime" TYPE TIME USING "endTime"::TIME;

-- Ajoute la contrainte d'intégrité pour valider la forme de l'indisponibilité
ALTER TABLE "TeacherUnavailability" ADD CONSTRAINT "check_unavailability_shape" CHECK (
  (type = 'WEEKLY' AND "dayOfWeek" IS NOT NULL AND "startTime" IS NOT NULL AND "endTime" IS NOT NULL AND "startDate" IS NULL AND "endDate" IS NULL) OR
  (type = 'DATE_RANGE' AND "startDate" IS NOT NULL AND "endDate" IS NOT NULL AND "dayOfWeek" IS NULL AND "startTime" IS NULL AND "endTime" IS NULL)
);