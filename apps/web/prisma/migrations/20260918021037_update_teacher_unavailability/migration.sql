-- Convertit les colonnes String vers TIME sans supprimer les données existantes
ALTER TABLE "TeacherUnavailability" 
  ALTER COLUMN "startTime" TYPE TIME USING "startTime"::TIME,
  ALTER COLUMN "endTime" TYPE TIME USING "endTime"::TIME;