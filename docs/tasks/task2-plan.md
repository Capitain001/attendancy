// ─── Domaine académique ──────────────────────────────────────────────────────
// Deux plans distincts, à ne jamais confondre :
//   STRUCTURE (hors du temps)  : Department → ProgramTrack → Program →
//                                ProgramUE → UE → UECourse. La maquette
//                                pédagogique, réutilisée chaque année.
//   INSTANCE (une année réelle): AcademicYear → Class → Term / Course /
//                                StudentEnrollment. Ce qui se déroule.
// L'application d'un Program à une Class instancie : UECourse → Course,
// ProgramUE.semester (Int structurel) → Term (période datée par classe).



// Unité d'enseignement — entité de référence métier.
// deletedAt = ARCHIVAGE (convention projet), pas suppression : 
// Promotion réelle d'une année. Le calendrier (Terms) et les cours (Course)
// sont instanciés par classe — chaque classe a ses propres dates.
model Class {
id                 String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
name               String
createdAt          DateTime            @default(now())
updatedAt          DateTime            @updatedAt
deletedAt          DateTime?
programTrackId     String              @db.Uuid
level              Level               @default(L1)
programId          String?             @db.Uuid
academicYearId     String              @db.Uuid
isActive           Boolean             @default(true)
type               ClassType           @default(COHORT)
channels           Channel[]
academicYear       AcademicYear        @relation(fields: [academicYearId], references: [id])
program            Program?            @relation(fields: [programId], references: [id], onDelete: SetNull)
programTrack       ProgramTrack        @relation(fields: [programTrackId], references: [id])
courses            Course[]
groups             Group[]
schedules          Schedule[]
studentEnrollments StudentEnrollment[]
terms              Term[]
// feeStructure       FeeStructure?       @relation(fields: [feeStructureId], references: [id])
// feeStructureId     String?             @db.Uuid

// Unicité réelle : un nom de classe par filière et par année. (Pas d'unique
// incluant programId : nullable → NULLs distincts, contrainte inopérante.)
@@unique([programTrackId, name, academicYearId])
@@index([programId])
@@index([academicYearId])
@@schema("public")
}

// Période datée d'UNE classe (semestre/trimestre réel). order = pont vers
// ProgramUE.semester à l'instanciation. Dates nullable : Terms générés sans
// dates à l'application du programme, bornés ensuite par la direction.
// Granularité classe (pas année) : chaque classe a son calendrier, et la
// clôture (lockedAt) suit le rythme réel des jurys, classe par classe.
// Cascade : le semestre meurt avec sa classe.
model Term {
id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
classId   String    @db.Uuid
order     Int // correspond à ProgramUE.semester à l'instanciation
name      String // "Semestre 1" — généré, éditable
startDate DateTime? @db.Date
endDate   DateTime? @db.Date
// Clôture après délibération : fige les évaluations des cours du terme
// (garde applicative dans le service d'évaluation).
lockedAt  DateTime?
createdAt DateTime  @default(now())
updatedAt DateTime  @updatedAt

class   Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
courses Course[]

@@unique([classId, order])
@@schema("public")
}

// Instance d'un UECourse pour UNE classe — porte le déroulé réel :
// progression horaire, enseignants, planification, évaluations.
// termId nullable : un cours hors maquette (rattrapage, module exceptionnel)
// peut exister sans période.
model Course {
id            String               @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
settings      Json?
createdAt     DateTime             @default(now())
updatedAt     DateTime             @updatedAt
deletedAt     DateTime?
classId       String               @db.Uuid
// Progression : réalisé / total planifié. Pas de CHECK done <= total :
// un cours peut légitimement dépasser le prévu (réalité > plan).
durationDone  Int                  @default(0)
durationTotal Int                  @default(0)
orgId         String               @db.Uuid
name          String
credits       Float                @default(2)
description   String?
ueCourseId    String               @db.Uuid
termId        String?              @db.Uuid
class         Class                @relation(fields: [classId], references: [id], onDelete: Cascade)
organization  Organization         @relation(fields: [orgId], references: [id])
term          Term?                @relation(fields: [termId], references: [id], onDelete: SetNull)
ueCourse      UECourse             @relation(fields: [ueCourseId], references: [id])
teachers      CourseTeacher[]
evaluations   Evaluation[]
schedules     Schedule[]
weeklySlots   WeeklySlot[]
teacherHours  TeacherCourseHours[]
// sert a la relation course - groupe pr l espace perso
group Group?
// Unicité (classId, ueCourseId) gérée par index UNIQUE PARTIEL
// WHERE "deletedAt" IS NULL — non exprimable en Prisma, défini en
// post-migrate (course_active_unique_idx) : recréer un cours après
// soft delete reste possible.
@@index([ueCourseId])
@@index([orgId])
@@index([classId])
@@index([termId])
@@schema("public")
}


// Compteur incrémental heures effectuées par (prof, cours, type de séance).
// Maintenu par trigger DB (sync_teacher_course_hours_stats) sur Schedule —
// jamais écrit par l'applicatif. ScheduleType figé dès qu'un Schedule quitte
// PENDING (trigger_prevent_locked_schedule_update) : pas de transfert de
// clé à gérer ici.
model TeacherCourseHours {
id             String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
orgId          String       @db.Uuid
teacherId      String       @db.Uuid
courseId       String       @db.Uuid
scheduleType   ScheduleType
completedHours Float        @default(0)
updatedAt      DateTime     @updatedAt

teacher      Teacher      @relation(fields: [teacherId], references: [id], onDelete: Cascade)
course       Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

@@unique([teacherId, courseId, scheduleType])
@@index([orgId])
@@schema("public")
}


// Inscription d'un étudiant dans une classe. endedAt = départ en cours
// d'année (abandon, transfert) SANS casser l'historique — le hard delete est
// bloqué par Restrict (Attendance) dès la première présence enregistrée :
// il ne reste possible que pour une inscription créée par erreur.
model StudentEnrollment {
id            String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
studentId     String         @db.Uuid
classId       String         @db.Uuid
createdAt     DateTime       @default(now())
updatedAt     DateTime       @updatedAt
endedAt       DateTime?
class         Class          @relation(fields: [classId], references: [id])
student       Student        @relation(fields: [studentId], references: [id])
studentGroups StudentGroup[]
attendances   Attendance[]
grades        Grade[]
// invoice       Invoice?

// Un étudiant a au plus UNE inscription par classe (mais peut en avoir
// plusieurs, dans des classes différentes).
@@unique([studentId, classId])
// Cible de la FK composite Attendance(enrollmentId, studentId). `id` étant
// déjà PK, cet unique ne restreint RIEN : il existe uniquement parce que
// Postgres exige une contrainte d'unicité pour cibler une FK composite.
@@unique([id, studentId])
@@index([classId])
@@schema("public")
}

// Sous-ensemble d'une classe (TD/TP). Soft delete conservé : un Schedule à
// groupId NULL signifie "classe entière" — une suppression physique (SetNull)
// réécrirait l'historique des séances de groupe en séances de classe.
// Restrict sur Schedule.group verrouille ce risque côté DB.
model Group {
id            String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
name          String
description   String?
createdAt     DateTime       @default(now())
updatedAt     DateTime       @updatedAt
deletedAt     DateTime?
classId       String         @db.Uuid
channels      Channel[]
class         Class          @relation(fields: [classId], references: [id])
schedules     Schedule[]
studentGroups StudentGroup[]

//perso Lien cours ↔ groupe
//SetNull unlink le groupe sans réécrire l’historique des séances (Schedule.groupId reste protégé par son Restrict).
courseId String? @unique @db.Uuid
course   Course? @relation(fields: [courseId], references: [id], onDelete: SetNull)

@@index([classId])
@@schema("public")
}

// Affectation d'une INSCRIPTION (pas d'un étudiant) à un groupe : garantit
// par construction que l'étudiant est bien inscrit dans la classe du groupe
// (invariant renforcé par le trigger validate_student_class_group).
model StudentGroup {
id           String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
enrollmentId String            @db.Uuid
groupId      String            @db.Uuid
createdAt    DateTime          @default(now())
enrollment   StudentEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
group        Group             @relation(fields: [groupId], references: [id], onDelete: Cascade)

@@unique([enrollmentId, groupId])
@@index([groupId])
@@schema("public")
}


enum UEType {
FONDAMENTALE
COMPLEMENTAIRE
APPROFONDISSEMENT
SPECIALITE
TRANSVERSALE
LIBRE

@@schema("public")
}

enum ClassType {
COHORT // Cohorte institutionnelle (ex: Terminale S1)
THEMATIC // Groupe thématique / Matière (ex: Masterclass React)

@@schema("public")
}
