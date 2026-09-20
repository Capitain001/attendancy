# Objectif : représenter finement les heures occupées par un enseignant en cours

# Proprosition:

## 1. Le Modèle Prisma / Modélisation

```prisma
// nouvel ENUM
enum CourseType {
  CM         // Cours Magistral
  TD         // Travaux Dirigés
  TP         // Travaux Pratiques
  EXAM       // Examen
  RATTRAPAGE // Rattrapage

  @@schema("public")
}

model Schedule {
  id          String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  ...
  courseType  CourseType  @default(CM) // <-- Colonne à ajouter

}

// nouveau modèle
model TeacherCourseTypeStats {
  id             String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orgId          String     @db.Uuid
  teacherId      String     @db.Uuid
  courseId       String     @db.Uuid
  courseType     CourseType 
  completedHours Float      @default(0)
  updatedAt      DateTime   @updatedAt

  @@unique([teacherId, courseId, courseType])
  @@index([orgId])
  @@schema("public")
}
```

## 2. La représentation TypeScript 

```typescript
export type TeacherCourseTypeStatRow = {
  teacherId: string;
  courseId: string;
  sessionType: 'CM' | 'TD' | 'TP' | 'EVALUATION';
  completedHours: number;
};
```

## 3. Le Fonctionnement du Trigger (Étape par étape)

Le trigger sur la table `Schedule` suit un algorithme très simple pour garantir que la ligne Clé-Valeur exacte est mise à jour :

* **Calcul de la durée :** `duration = (endTime - startTime) / 3600`
* **Identification de la clé cible :** Le triplet `(teacherId, courseId, sessionType)`.
* **Cas d'Ajout / Validation (Passage à `COMPLETED`) :**
  * On exécute un `UPSERT` SQL direct.
  * Si la ligne `(teacherId, courseId, sessionType)` n'existe pas : Postgres la crée avec `completedHours = duration`.
  * Si elle existe déjà : Postgres fait un simple `completedHours = completedHours + duration`.
* **Cas de Suppression / Annulation (Retrait du statut `COMPLETED` ou `deletedAt` renseigné) :**
  * On soustrait la durée : `completedHours = GREATEST(0, completedHours - duration)`.


//post-migrate

```sql
-- =============================================================================
-- Trigger de synchronisation atomique avec la nouvelle nomenclature CourseType
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."fn_sync_teacher_course_type_stats"()
RETURNS TRIGGER AS $$
DECLARE
  v_duration DOUBLE PRECISION;
  v_teacher_id UUID;
  v_course_id UUID;
  v_org_id UUID;
  v_course_type "CourseType";
BEGIN

  IF pg_trigger_depth() > 1 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- 1. CAS : ANNULATION / SUPPRESSION D'UNE SÉANCE COMPLÉTÉE
  IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND (NEW."status" <> 'COMPLETED' OR NEW."deletedAt" IS NOT NULL))) THEN
    IF OLD."status" = 'COMPLETED' AND OLD."deletedAt" IS NULL THEN
      
      v_duration := EXTRACT(EPOCH FROM (OLD."endTime" - OLD."startTime")) / 3600.0;
      
      UPDATE "public"."TeacherCourseTypeStats"
      SET 
        "completedHours" = GREATEST(0, "completedHours" - v_duration),
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE 
        "teacherId" = OLD."teacherId" 
        AND "courseId" = OLD."courseId" 
        AND "courseType" = OLD."courseType";

    END IF;
  END IF;

  -- 2. CAS : CRÉATION / VALIDATION D'UNE SÉANCE (status = COMPLETED)
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW."status" = 'COMPLETED' AND NEW."deletedAt" IS NULL THEN
    
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD."status" IS DISTINCT FROM 'COMPLETED' OR OLD."deletedAt" IS NOT NULL)) THEN
      
      v_duration := EXTRACT(EPOCH FROM (NEW."endTime" - NEW."startTime")) / 3600.0;
      v_teacher_id := NEW."teacherId";
      v_course_id := NEW."courseId";
      v_org_id := NEW."orgId";
      v_course_type := NEW."courseType";

      INSERT INTO "public"."TeacherCourseTypeStats" (
        "id",
        "orgId",
        "teacherId",
        "courseId",
        "courseType",
        "completedHours",
        "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        v_org_id,
        v_teacher_id,
        v_course_id,
        v_course_type,
        v_duration,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("teacherId", "courseId", "courseType")
      DO UPDATE SET
        "completedHours" = "public"."TeacherCourseTypeStats"."completedHours" + EXCLUDED."completedHours",
        "updatedAt" = CURRENT_TIMESTAMP;

    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```