# Schemas

> Fichier généré automatiquement depuis `apps\web\prisma\schemas`.

## apps\web\prisma\schemas\academic.prisma

```prisma
// ─── Domaine académique ──────────────────────────────────────────────────────
// Deux plans distincts, à ne jamais confondre :
//   STRUCTURE (hors du temps)  : Department → ProgramTrack → Program →
//                                ProgramUE → UE → UECourse. La maquette
//                                pédagogique, réutilisée chaque année.
//   INSTANCE (une année réelle): AcademicYear → Class → Term / Course /
//                                StudentEnrollment. Ce qui se déroule.
// L'application d'un Program à une Class instancie : UECourse → Course,
// ProgramUE.semester (Int structurel) → Term (période datée par classe).

model AcademicYear {
  id           String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name         String
  startDate    DateTime
  endDate      DateTime
  orgId        String       @db.Uuid
  isActive     Boolean      @default(true)
  isCurrent    Boolean      @default(false)
  organization Organization @relation(fields: [orgId], references: [id])
  classes      Class[]
  optionalUEs  OptionalUE[]

  @@unique([name, orgId])
  @@index([orgId, isCurrent])
  @@index([orgId, isActive])
  @@schema("public")
}

model Department {
  id                String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name              String
  orgId             String             @db.Uuid
  organization      Organization       @relation(fields: [orgId], references: [id])
  programTracks     ProgramTrack[]
  teachers          Teacher[]
  ues               UE[]
  userOrganizations UserOrganization[]

  @@unique([name, orgId])
  @@index([orgId])
  @@schema("public")
}

// Filière (ex. "Informatique", "Génie civil") — regroupe les maquettes
// (Program) et les classes qui en découlent.
model ProgramTrack {
  id           String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name         String
  description  String?
  orgId        String       @db.Uuid
  departmentId String       @db.Uuid
  classes      Class[]
  programs     Program[]
  department   Department   @relation(fields: [departmentId], references: [id])
  organization Organization @relation(fields: [orgId], references: [id])

  @@unique([name, departmentId])
  @@index([orgId])
  @@schema("public")
}

// Maquette pédagogique — structurelle, indépendante du temps : un Program
// s'applique à n classes sur n années.
model Program {
  id             String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name           String
  description    String?
  orgId          String       @db.Uuid
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  deletedAt      DateTime?
  programTrackId String       @db.Uuid
  classes        Class[]
  organization   Organization @relation(fields: [orgId], references: [id])
  programTrack   ProgramTrack @relation(fields: [programTrackId], references: [id])
  programUEs     ProgramUE[]

  @@unique([name, programTrackId])
  @@index([orgId])
  @@index([programTrackId])
  @@schema("public")
}

// Position d'une UE dans une maquette. semester est STRUCTUREL ("Algo est au
// S1 de la maquette"), sans dates — les dates vivent sur Term, côté instance.
// Restrict sur ue : on n'attache pas l'historique d'une maquette à la
// disparition d'une UE (l'archivage UE passe par UE.deletedAt).
model ProgramUE {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  programId   String   @db.Uuid
  ueId        String   @db.Uuid
  isCompleted Boolean  @default(false)
  isOptional  Boolean  @default(false)
  semester    Int      @default(1)
  createdAt   DateTime @default(now())
  order       Int?
  updatedAt   DateTime @updatedAt
  program     Program  @relation(fields: [programId], references: [id], onDelete: Cascade)
  ue          UE       @relation(fields: [ueId], references: [id], onDelete: Restrict)

  @@unique([programId, ueId])
  @@unique([programId, semester, order])
  @@index([ueId])
  @@schema("public")
}

// Unité d'enseignement — entité de référence métier.
// deletedAt = ARCHIVAGE (convention projet), pas suppression : l'UE archivée
// reste lisible par tout l'historique (Restrict sur ProgramUE/UECourse) mais
// n'est plus proposée pour de nouvelles affectations (garde applicative dans
// attachUEToProgram). Le hard delete ne passe que si l'UE n'a jamais servi.
model UE {
  id           String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name         String
  code         String?
  description  String?
  imageUrl     String?
  departmentId String?      @db.Uuid
  orgId        String       @db.Uuid
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  deletedAt    DateTime?
  isOptional   Boolean      @default(false)
  optionalUEs  OptionalUE[]
  programUEs   ProgramUE[]
  department   Department?  @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  organization Organization @relation(fields: [orgId], references: [id])
  ueCourses    UECourse[]

  // Unicité du code PAR org (multi-tenant) — pas d'@unique global sur code :
  // deux universités peuvent avoir chacune leur "MATH101".
  @@unique([code, orgId])
  @@unique([name, departmentId])
  @@index([orgId])
  @@index([departmentId])
  @@schema("public")
}

// Matière au sein d'une UE — encore structurel (réutilisé par toutes les
// classes). duration = volume horaire PRÉVU par la maquette ; le réalisé se
// suit sur Course (durationDone/durationTotal), côté instance.
model UECourse {
  id           String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name         String
  description  String?
  credits      Decimal      @default(2) @db.Decimal(4, 2)
  imageUrl     String?
  duration     Int          @default(10)
  settings     Json?
  orgId        String       @db.Uuid
  ueId         String       @db.Uuid
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  deletedAt    DateTime?
  code         String?
  order        Int?
  courses      Course[]
  organization Organization @relation(fields: [orgId], references: [id])
  ue           UE           @relation(fields: [ueId], references: [id], onDelete: Restrict)

  @@unique([name, ueId])
  // Sert aussi les lookups par ueId (préfixe) — pas d'index simple redondant.
  @@unique([ueId, order])
  @@index([orgId])
  @@schema("public")
}

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
  channels           Channel[]
  academicYear       AcademicYear        @relation(fields: [academicYearId], references: [id])
  program            Program?            @relation(fields: [programId], references: [id], onDelete: SetNull)
  programTrack       ProgramTrack        @relation(fields: [programTrackId], references: [id])
  courses            Course[]
  evaluations        Evaluation[]
  groups             Group[]
  schedules          Schedule[]
  studentEnrollments StudentEnrollment[]
  terms              Term[]

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
  id            String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  settings      Json?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  deletedAt     DateTime?
  classId       String          @db.Uuid
  // Progression : réalisé / total planifié. Pas de CHECK done <= total :
  // un cours peut légitimement dépasser le prévu (réalité > plan).
  durationDone  Int             @default(0)
  durationTotal Int             @default(0)
  orgId         String          @db.Uuid
  name          String
  credits       Int
  description   String?
  ueCourseId    String          @db.Uuid
  termId        String?         @db.Uuid
  class         Class           @relation(fields: [classId], references: [id], onDelete: Cascade)
  organization  Organization    @relation(fields: [orgId], references: [id])
  term          Term?           @relation(fields: [termId], references: [id], onDelete: SetNull)
  ueCourse      UECourse        @relation(fields: [ueCourseId], references: [id])
  teachers      CourseTeacher[]
  evaluations   Evaluation[]
  schedules     Schedule[]
  weeklySlots   WeeklySlot[]

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

// Affectation enseignant ↔ cours. hours = volume confié à CE prof
// (co-enseignement) ; isMain désigne le responsable.
model CourseTeacher {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  teacherId String?  @db.Uuid
  isMain    Boolean  @default(false)
  courseId  String   @db.Uuid
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  hours     Int?
  course    Course   @relation(fields: [courseId], references: [id])
  teacher   Teacher? @relation(fields: [teacherId], references: [id], onDelete: SetNull)

  @@unique([teacherId, courseId])
  @@index([courseId])
  @@index([teacherId])
  @@schema("public")
}

// Choix d'UE optionnelle par étudiant et par année (l'option se rechoisit
// chaque année, d'où le scope AcademicYear et non Class).
model OptionalUE {
  id           String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  studentId    String       @db.Uuid
  yearId       String       @db.Uuid
  isActive     Boolean      @default(true)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  ueId         String       @db.Uuid
  student      Student      @relation(fields: [studentId], references: [id])
  ue           UE           @relation(fields: [ueId], references: [id])
  academicYear AcademicYear @relation(fields: [yearId], references: [id])

  @@unique([studentId, ueId, yearId])
  @@index([ueId])
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

  @@unique([studentId, classId])
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

enum Level {
  L1
  L2
  L3
  M1
  M2
  D1
  D2
  D3

  @@schema("public")
}

```

## apps\web\prisma\schemas\attendance.prisma

```prisma
// ─── Présence ────────────────────────────────────────────────────────────────
// Le flux : le prof ouvre une Session sur un Schedule (check-in vérifié
// GPS/QR via teacher_check_in côté DB, atomique), les étudiants pointent
// (SessionToken rotatif → QRScan → Attendance). Session = fait historique,
// pas de soft delete.

// Session de cours réelle (1-1 avec Schedule). "En cours" = status ACTIVE ;
// le Schedule reste PENDING (ONGOING est UI-only). position = point GPS du
// prof au check-in (PostGIS, écrite par teacher_check_in).
model Session {
  id                 String                    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  scheduleId         String                    @unique @db.Uuid
  status             SessionStatus             @default(ACTIVE)
  isLate             Boolean                   @default(false)
  checkIn            DateTime?
  checkOut           DateTime?
  checkInMethod      VerificationMethod?
  checkOutMethod     VerificationMethod?
  durationMinutes    Int?
  endedAutomatically Boolean                   @default(false)
  locationId         String?                   @db.Uuid
  createdAt          DateTime                  @default(now())
  updatedAt          DateTime                  @updatedAt
  position           Unsupported("geography")?

  qrScans            QRScan[]
  location           Location?                 @relation(fields: [locationId], references: [id], onDelete: SetNull)
  schedule           Schedule                  @relation(fields: [scheduleId], references: [id])
  tokens             SessionToken[]

  @@index([locationId])
  @@schema("public")
}

// Jeton rotatif d'émargement (QR affiché en cours, TTL court). Généré et
// invalidé par create_session_token côté DB — un seul token actif par
// session. Cascade : les tokens meurent avec la session.
model SessionToken {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sessionId String   @db.Uuid
  token     String   @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  expiresAt DateTime
  createdAt DateTime @default(now())
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([token, expiresAt])
  @@index([sessionId])
  @@schema("public")
}

// Fait de présence — IMMUABLE (pas de soft delete) : une erreur se corrige
// par UPDATE + trace AuditLog. Double FK studentId + enrollmentId : le
// student pour les requêtes transverses (parcours de l'étudiant), l'
// enrollment pour l'ancrage classe/année. Restrict sur enrollment : dès la
// première présence, l'inscription devient insupprimable (historique).
// orgId dénormalisé : table chaude, requêtes org-wide des analytics de
// risque sans join Schedule.
model Attendance {
  id           String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  scheduleId   String            @db.Uuid
  studentId    String            @db.Uuid
  enrollmentId String            @db.Uuid
  status       AttendanceStatus  @default(PENDING)
  recordedAt   DateTime          @default(now())
  details      Json?
  notes        String?
  orgId        String            @db.Uuid
  schedule     Schedule          @relation(fields: [scheduleId], references: [id])
  student      Student           @relation(fields: [studentId], references: [id])
  enrollment   StudentEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Restrict)
  organization   Organization      @relation(fields: [orgId], references: [id])

  @@unique([scheduleId, studentId])
  @@index([studentId])
  @@index([enrollmentId])
  @@index([scheduleId, status])
  @@index([orgId, recordedAt])
  @@schema("public")
}

// QR statique d'une salle (émargement par scan de salle). Cycle de vie porté
// par active + expiresAt — pas de soft delete.
model QRCode {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code        String    @unique
  roomId      String    @db.Uuid
  expiresAt   DateTime?
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  room        Room      @relation(fields: [roomId], references: [id])
  scanHistory QRScan[]

  @@index([roomId])
  @@schema("public")
}

// Trace brute d'un scan (preuve d'émargement) — journal, jamais modifié.
model QRScan {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  qrCodeId  String   @db.Uuid
  userId    String?  @db.Uuid
  sessionId String?  @db.Uuid
  timestamp DateTime @default(now())
  ipAddress String?
  userAgent String?
  qrCode    QRCode   @relation(fields: [qrCodeId], references: [id])
  session   Session? @relation(fields: [sessionId], references: [id], onDelete: SetNull)
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([sessionId])
  @@index([qrCodeId])
  @@schema("public")
}

// Demande de justification d'absence — amont (avant la séance) ou a
// posteriori (absence constatée) : même cycle de vie.
// Le WORKFLOW vit ici (PENDING → verdict) ; le FAIT vit dans Attendance :
// APPROVED → upsert Attendance(scheduleId, studentId) en EXCUSED (+ AuditLog)
// — création si la séance n'a pas eu lieu, passage ABSENT→EXCUSED sinon.
// Pas de FK vers Attendance : le lien est structurel par la clé naturelle
// (scheduleId, studentId) — @@unique côté Attendance — et l'Attendance peut
// ne pas encore exister en phase amont. Lookup par cette clé.
// Garde applicative : une seule PENDING par (scheduleId, studentId).
// Pièces via Document(resourceType: JUSTIFICATION, resourceId: id).
// Pas de soft delete : le cycle de vie EST le statut (retrait = CANCELED).
model Justification {
  id            String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  studentId     String              @db.Uuid
  orgId         String              @db.Uuid
  scheduleId    String              @db.Uuid
  declaredById  String?             @db.Uuid // parent, étudiant, ou staff (saisie guichet)
  reason        String?
  status        JustificationStatus @default(PENDING)
  reviewedById  String?             @db.Uuid
  reviewedAt    DateTime?
  reviewComment String?
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  student      Student      @relation(fields: [studentId], references: [id])
  organization Organization @relation(fields: [orgId], references: [id])
  schedule     Schedule     @relation(fields: [scheduleId], references: [id])
  declaredBy   User?        @relation("JustificationDeclaredBy", fields: [declaredById], references: [id], onDelete: SetNull)
  reviewedBy   User?        @relation("JustificationReviewedBy", fields: [reviewedById], references: [id], onDelete: SetNull)

  @@index([orgId, status])
  @@index([scheduleId, studentId]) // clé naturelle du lien vers Attendance
  @@index([studentId])
  @@index([declaredById])
  @@schema("public")
}

enum JustificationStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELED   // status d une justification retirée par le déclarant avant traitement

  @@schema("public")
}

enum SessionStatus {
  ACTIVE
  CANCELED
  COMPLETED

  @@schema("public")
}

enum VerificationMethod {
  QR
  GPS
  ADMIN_OVERRIDE
  WIFI
  FACE_RECOGNITION

  @@schema("public")
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EXCUSED
  PENDING

  @@schema("public")
}

```

## apps\web\prisma\schemas\billing.prisma

```prisma
// ─── Billing SaaS (schéma Postgres "billing") ────────────────────────────────
// Isolé dans son propre schéma DB : cycle de vie et sensibilité distincts du
// métier. L'abonnement est 1-1 avec Organization ; l'activation des modules
// et les limites se lisent sur Plan.features (Json) — jamais en dur.

model Plan {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code         String   @unique // "STARTER", "STANDARD", "PREMIUM"
  name         String
  priceMonthly Decimal? @db.Decimal(12, 2)
  currency     String   @default("XOF")
  features     Json? // modules actifs, limites (étudiants max, salles max…)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  subscriptions Subscription[]

  @@schema("billing")
}

model Subscription {
  id                 String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orgId              String             @unique @db.Uuid
  planId             String             @db.Uuid
  status             SubscriptionStatus @default(TRIALING)
  trialEndsAt        DateTime?
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  canceledAt         DateTime?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  organization Organization @relation(fields: [orgId], references: [id])
  plan         Plan         @relation(fields: [planId], references: [id])

  @@index([planId])
  @@schema("billing")
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  EXPIRED

  @@schema("billing")
}

```

## apps\web\prisma\schemas\communication.prisma

```prisma
// ─── Communication ───────────────────────────────────────────────────────────
// Channels ORG/CLASS/GROUP auto-provisionnés par triggers DB (création +
// memberships à l'inscription) — voir apply.sql. Cascade partout depuis
// Channel : les messages meurent avec leur canal, le canal avec sa cible.

// NB : les @@unique([classId, type]) / [groupId, type] ne bornent pas les
// canaux ORG (classId et groupId NULL — NULLs distincts) ; les fonctions
// chat_get_*_channel_id tolèrent le doublon (ORDER BY createdAt LIMIT 1).
model Channel {
  id            String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  type          ChannelType
  name          String?
  isPrivate     Boolean         @default(false)
  orgId         String          @db.Uuid
  classId       String?         @db.Uuid
  groupId       String?         @db.Uuid
  createdAt     DateTime        @default(now())
  deletedAt     DateTime?
  class         Class?          @relation(fields: [classId], references: [id], onDelete: Cascade)
  group         Group?          @relation(fields: [groupId], references: [id], onDelete: Cascade)
  organization  Organization    @relation(fields: [orgId], references: [id], onDelete: Cascade)
  members       ChannelMember[]
  messages      Message[]
  realtimeItems RealtimeItem[]

  @@unique([classId, type])
  @@unique([groupId, type])
  @@index([orgId])
  @@schema("public")
}

// lastReadAt = curseur de lecture (badge non-lus calculé côté requête).
model ChannelMember {
  id         String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String          @db.Uuid
  channelId  String          @db.Uuid
  role       ParticipantRole @default(MEMBER)
  joinedAt   DateTime        @default(now())
  lastReadAt DateTime?
  channel    Channel         @relation(fields: [channelId], references: [id], onDelete: Cascade)
  user       User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([channelId, userId])
  @@index([userId])
  @@index([channelId])
  @@schema("public")
}

// Soft delete : un message supprimé s'affiche "supprimé" sans trouer les
// fils de réponses (parentId).
model Message {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  content   String
  createdAt DateTime  @default(now())
  userId    String?   @db.Uuid
  deletedAt DateTime?
  channelId String    @db.Uuid
  parentId  String?   @db.Uuid
  updatedAt DateTime  @updatedAt
  channel   Channel   @relation(fields: [channelId], references: [id], onDelete: Cascade)
  parent    Message?  @relation("MessageReplies", fields: [parentId], references: [id])
  replies   Message[] @relation("MessageReplies")
  user      User?     @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([channelId, createdAt])
  @@index([userId])
  @@index([parentId])
  @@schema("public")
}

// État partagé temps réel d'un canal (positions d'objets collaboratifs) —
// upsert par (itemId, channelId), pas d'historique.
model RealtimeItem {
  itemId    String
  x         Float
  y         Float
  updatedAt DateTime @updatedAt
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  channelId String   @db.Uuid
  channel   Channel  @relation(fields: [channelId], references: [id], onDelete: Cascade)

  @@unique([itemId, channelId])
  @@schema("public")
}

// Commentaire polymorphique (targetId + resource) — même pattern d'intégrité
// applicative que Document : vérifier targetId ∈ org à l'écriture.
// deletedBy distinct de l'auteur = modération tracée.
model Comment {
  id            String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  content       String
  userId        String?      @db.Uuid
  targetId      String
  resource      Resource
  parentId      String?      @db.Uuid
  deletedAt     DateTime?
  deletedBy     String?      @db.Uuid
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  orgId         String       @db.Uuid
  deletedByUser User?        @relation("CommentDeletedBy", fields: [deletedBy], references: [id], onDelete: SetNull)
  organization  Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  parent        Comment?     @relation("CommentReplies", fields: [parentId], references: [id])
  replies       Comment[]    @relation("CommentReplies")
  user          User?        @relation("CommentAuthor", fields: [userId], references: [id], onDelete: SetNull)

  @@index([targetId, resource, deletedAt])
  @@index([userId])
  @@index([orgId])
  @@index([parentId])
  @@schema("public")
}

// Notification in-app. Cycle de vie porté par read — pas de soft delete.
// scheduleId : lien direct vers la séance concernée (absence, changement).
model Notification {
  id         String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String           @db.Uuid
  message    String
  type       NotificationType @default(GENERAL)
  read       Boolean          @default(false)
  scheduleId String?          @db.Uuid
  metadata   Json?
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt
  user       User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  schedule   Schedule?        @relation(fields: [scheduleId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([scheduleId])
  @@schema("public")
}

// Abonnement Web Push d'un appareil (clés VAPID côté client).
model PushSubscription {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String    @db.Uuid
  endpoint  String    @unique
  p256dh    String
  auth      String
  userAgent String?
  deviceId  String?
  expiresAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([endpoint, userId])
  @@index([userId])
  @@schema("public")
}

enum ChannelType {
  CLASS
  GROUP
  ORG
  DM

  @@schema("public")
}

enum ParticipantRole {
  OWNER
  MEMBER

  @@schema("public")
}

enum NotificationType {
  ABSENCE
  COURSE_CHANGE
  NEW_COURSE
  SCHEDULE_UPDATE
  GENERAL
  MESSAGE
  INVITATION

  @@schema("public")
}

```

## apps\web\prisma\schemas\evaluation.prisma

```prisma
// ─── Évaluation ──────────────────────────────────────────────────────────────
// Fait immuable (pas de soft delete) : correction = UPDATE + trace AuditLog.
// Le bulletin se partitionne STRUCTURELLEMENT (Course → UECourse → UE →
// ProgramUE.semester) ; Term ne fait que dater/clôturer les périodes — pas
// de termId ici tant qu'aucune UE ne court sur plusieurs semestres.
// La clôture d'un Term (lockedAt) fige les évaluations de ses cours (garde
// applicative dans le service).

model Evaluation {
  id           String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  courseId     String         @db.Uuid
  studentId    String         @db.Uuid
  type         EvaluationType
  score        Float
  maxScore     Float          @default(20)
  comment      String?
  datedAt      DateTime       @default(now())
  createdAt    DateTime       @default(now())
  classId      String         @db.Uuid
  // orgId dénormalisé : table chaude, requêtes org-wide sans join Course.
  orgId        String         @db.Uuid
  class        Class          @relation(fields: [classId], references: [id])
  course       Course         @relation(fields: [courseId], references: [id])
  student      Student        @relation(fields: [studentId], references: [id])
  organization Organization   @relation(fields: [orgId], references: [id])

  @@index([studentId])
  @@index([courseId])
  @@index([classId])
  @@index([orgId, datedAt])
  @@schema("public")
}

enum EvaluationType {
  DEVOIR
  EXAMEN
  PARTICIPATION
  PROJET

  @@schema("public")
}

```

## apps\web\prisma\schemas\profile.prisma

```prisma
// ─── Profils par rôle ────────────────────────────────────────────────────────
// Un User global peut porter un profil PAR organisation et PAR rôle
// (@@unique([userId, orgId])) : le même compte est prof à l'université A et
// parent à l'université B. Les FK métier (Schedule.teacherId,
// Attendance.studentId…) pointent sur le PROFIL, pas sur User : l'historique
// est scopé org par construction.
//
// deletedAt sur les profils = désactivation dans l'org. Réintégration =
// pattern RESTORE (réveil de la ligne, deletedAt: null), jamais re-create :
// l'historique (cours, présences) reste rattaché au même id.
// Cascade depuis User : un profil n'existe pas sans son compte.

// Profil opérateur interne (back-office produit) — 1-1 avec User, hors org.
model Admin {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String    @unique @db.Uuid
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@schema("public")
}

model Teacher {
  id           String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId       String          @db.Uuid
  orgId        String          @db.Uuid
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  deletedAt    DateTime?
  departmentId String?         @db.Uuid
  courses      CourseTeacher[]
  schedules    Schedule[]
    unavailabilities TeacherUnavailability[]
  department   Department?     @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  user         User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  weeklySlots  WeeklySlot[]

  @@unique([userId, orgId])
  @@index([orgId])
  @@schema("public")
}

model Student {
  id                 String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId             String              @db.Uuid
  orgId              String              @db.Uuid
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
  deletedAt          DateTime?
  attendances        Attendance[]
  evaluations        Evaluation[]
  justifications     Justification[]
  optionalUEs        OptionalUE[]
  childrenRelations  ParentRelation[]    @relation("StudentToParent")
  user               User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  studentEnrollments StudentEnrollment[]

  @@unique([userId, orgId])
  @@index([orgId])
  @@schema("public")
}

model Parent {
  id              String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId          String           @db.Uuid
  orgId           String           @db.Uuid
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  deletedAt       DateTime?
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  parentRelations ParentRelation[] @relation("ParentToStudent")

  @@unique([userId, orgId])
  @@index([orgId])
  @@schema("public")
}

model Direction {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String    @db.Uuid
  orgId     String    @db.Uuid
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, orgId])
  @@index([orgId])
  @@schema("public")
}

// Lien Parent ↔ Student — table de liaison SANS soft delete : rien ne la
// référence, rien de coûteux à reconstruire ; le délien = hard delete + trace
// AuditLog (qui avait accès aux données de quel enfant, sur quelle période).
// relation = nature du lien ("père", "tuteur"…), texte libre.
model ParentRelation {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  parentId  String   @db.Uuid
  studentId String   @db.Uuid
  orgId     String   @db.Uuid
  relation  String
  createdAt DateTime @default(now())

  organization Organization @relation(fields: [orgId], references: [id])
  parent       Parent       @relation("ParentToStudent", fields: [parentId], references: [id])
  student      Student      @relation("StudentToParent", fields: [studentId], references: [id])

  @@unique([parentId, studentId])
  @@index([orgId])
  @@schema("public")
}

```

## apps\web\prisma\schemas\referential.prisma

```prisma
// ─── Référentiel national ────────────────────────────────────────────────────
// Modèles globaux (sans orgId) : catalogue des UE standardisées par pays.
// NationalReferential → UETemplate → UETemplateEC  (lecture seule en prod)
// UETemplateImport  trace les imports par organisation.

model NationalReferential {
  id          String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  country     String       // ISO 3166-1 alpha-2 : "TG", "BJ"…
  issuer      String       // "MESRS-Togo"
  name        String       // "Curricula harmonisés 2022"
  version     String       // "2022-04"
  isActive    Boolean      @default(true)
  publishedAt DateTime

  templates   UETemplate[]

  createdAt   DateTime     @default(now())

  @@index([country])
  @@schema("public")
}

model UETemplate {
  id            String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  referentialId String              @db.Uuid
  referential   NationalReferential @relation(fields: [referentialId], references: [id])

  domain        String              // "LLA", "SHS", "ST"…
  degree        String              // "LICENCE", "MASTER"
  mention       String
  speciality    String?
  semester      Int                 // 1–6
  code          String?             // nullable pour type LIBRE
  name          String
  type          UETemplateType
  credits       Decimal             @db.Decimal(4, 2)

  elements      UETemplateEC[]
  imports       UETemplateImport[]

  // @@unique sur (referentialId, code) seulement si code non null — géré applicativement
  // Pour les cas code non-null, contrainte DB partielle via post-migrate si nécessaire
  @@index([referentialId, domain, mention, semester])
  @@schema("public")
}

model UETemplateEC {
  id         String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  templateId String     @db.Uuid
  template   UETemplate @relation(fields: [templateId], references: [id])

  code       String
  name       String?
  credits    Decimal    @db.Decimal(4, 2)

  @@unique([templateId, code])
  @@schema("public")
}

enum UETemplateType {
  FONDAMENTALE
  COMPLEMENTAIRE
  APPROFONDISSEMENT
  SPECIALITE
  TRANSVERSALE
  LIBRE

  @@schema("public")
}

model UETemplateImport {
  id         String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  templateId String     @db.Uuid
  template   UETemplate @relation(fields: [templateId], references: [id])
  orgId      String     @db.Uuid
  ueId       String     @db.Uuid   // UE créée dans l'org
  importedAt DateTime   @default(now())

  @@unique([templateId, orgId])
  @@index([orgId])
  @@schema("public")
}

```

## apps\web\prisma\schemas\schedule.prisma

```prisma
// ─── Planning ────────────────────────────────────────────────────────────────
// Cœur du produit. L'anti-conflit (salle/prof/classe/groupe) est garanti EN
// BASE par des contraintes d'exclusion GiST sur `during` (tstzrange dérivé de
// startTime/endTime par trigger) — voir prisma/post-migrate/apply.sql.
// Le flux : WeeklyTemplate + WeekRecurence génèrent les Schedules concrets.

// Séance concrète. status PENDING → COMPLETED/CANCELED/MISSED ; "en cours"
// (ONGOING) est UI-only, dérivé du temps — jamais persisté. Un Schedule non
// PENDING est figé (trigger prevent_locked_schedule_update).
// CANCELED/MISSED ne réservent plus la ressource (exclus des contraintes).
model Schedule {
  id               String                    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  courseId         String                    @db.Uuid
  roomId           String                    @db.Uuid
  teacherId        String                    @db.Uuid
  orgId            String                    @db.Uuid
  startTime        DateTime
  endTime          DateTime
  status           ScheduleStatus            @default(PENDING)
  statusChangedAt  DateTime?
  confirmed        Boolean                   @default(false)
  notes            String?
  createdAt        DateTime                  @default(now())
  updatedAt        DateTime                  @updatedAt
  classId          String                    @db.Uuid
  // groupId NULL = séance pour la classe ENTIÈRE (prédicat des contraintes
  // d'exclusion). Restrict : un hard delete de Group ne doit jamais
  // requalifier silencieusement des séances de groupe en séances de classe.
  groupId          String?                   @db.Uuid
  weekRecurrenceId String?                   @db.Uuid
  deletedAt        DateTime?

  // Notification de CRÉATION (manuelle) : PENDING à la création, SENT après
  // envoi. null = hors flux (modifications, séances créées avant la feature).
  notifyState      ScheduleNotifyState?
  notifiedAt       DateTime?

  // Colonne Postgres dérivée (trigger sync_schedule_during) — support des
  // contraintes d'exclusion GiST. Jamais écrite par l'applicatif.
  during           Unsupported("tstzrange")?
  attendances      Attendance[]
  class            Class                     @relation(fields: [classId], references: [id])
  course           Course                    @relation(fields: [courseId], references: [id])
  group            Group?                    @relation(fields: [groupId], references: [id], onDelete: Restrict)
  organization     Organization              @relation(fields: [orgId], references: [id])
  room             Room                      @relation(fields: [roomId], references: [id])
  teacher          Teacher                   @relation(fields: [teacherId], references: [id])
  weekRecurence    WeekRecurence?            @relation(fields: [weekRecurrenceId], references: [id], onDelete: SetNull)
  session          Session?
  justifications   Justification[]
  notifications    Notification[]

  @@index([classId])
  @@index([groupId])
  @@index([courseId])
  @@index([teacherId])
  @@index([roomId])
  @@index([orgId], map: "schedule_org_idx")
  @@index([startTime, endTime], map: "schedule_time_idx")
  @@index([orgId, notifyState])
  @@schema("public")
}

// Modèle de semaine type (grille horaire réutilisable).
model WeeklyTemplate {
  id             String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name           String
  orgId          String          @db.Uuid
  isActive       Boolean         @default(true)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  deletedAt      DateTime?
  weekRecurences WeekRecurence[]
  slots          WeeklySlot[]
  organization   Organization    @relation(fields: [orgId], references: [id])

  @@index([orgId])
  @@schema("public")
}

// Créneau d'une semaine type. startTime/endTime en String ("08:00") : heure
// de grille sans date ni fuseau — la matérialisation en DateTime se fait à
// la génération des Schedules.
model WeeklySlot {
  id         String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  templateId String         @db.Uuid
  dayOfWeek  Int
  startTime  String
  endTime    String
  courseId   String         @db.Uuid
  teacherId  String         @db.Uuid
  roomId     String         @db.Uuid
  isActive   Boolean        @default(true)
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt
  deletedAt  DateTime?
  course     Course         @relation(fields: [courseId], references: [id])
  room       Room           @relation(fields: [roomId], references: [id])
  teacher    Teacher        @relation(fields: [teacherId], references: [id])
  template   WeeklyTemplate @relation(fields: [templateId], references: [id])

  @@index([templateId])
  @@schema("public")
}

// Application d'un template sur une plage de dates : génère les Schedules.
// excludedDates = jours sautés (fériés, vacances) — alimenté manuellement
// aujourd'hui, par un futur module calendrier demain.
model WeekRecurence {
  id            String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  templateId    String         @db.Uuid
  orgId         String         @db.Uuid
  startDate     DateTime
  endDate       DateTime
  interval      Int            @default(1)
  excludedDates DateTime[]
  isActive      Boolean        @default(true)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  deletedAt     DateTime?
  schedules     Schedule[]
  organization  Organization   @relation(fields: [orgId], references: [id])
  template      WeeklyTemplate @relation(fields: [templateId], references: [id])

  @@index([templateId])
  @@index([orgId])
  @@schema("public")
}

// Site géographique (campus, bâtiment) — porte le géofencing du check-in :
// position (dérivée de lat/lng par trigger) + radius, vérifiés par
// verify_point_in_radius côté DB. active=false = géofencing suspendu
// (cours en ligne, GPS défaillant) sans perdre la configuration.
model Location {
  id           String                    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name         String
  address      String
  latitude     Float
  longitude    Float
  radius       Float                     @default(50)
  active       Boolean                   @default(true)
  orgId        String                    @db.Uuid
  createdAt    DateTime                  @default(now())
  updatedAt    DateTime                  @updatedAt

  // Colonne PostGIS dérivée (trigger sync_location_position). Index GiST en
  // post-migrate.
  position     Unsupported("geography")?
  organization Organization              @relation(fields: [orgId], references: [id])
  rooms        Room[]
  sessions     Session[]

  @@index([orgId])
  @@schema("public")
}

// Salle physique — LA ressource disputée du planning (contrainte
// no_room_overlap). deletedAt = désactivation (travaux, fermeture) sans
// casser l'historique des séances passées.
model Room {
  id           String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name         String
  capacity     Int?
  locationId   String?      @db.Uuid
  orgId        String       @db.Uuid
  equipment    String[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  deletedAt    DateTime?
  qrCodes      QRCode[]
  location     Location?    @relation(fields: [locationId], references: [id], onDelete: SetNull)
  organization Organization @relation(fields: [orgId], references: [id])
  schedules    Schedule[]
  weeklySlots  WeeklySlot[]

  @@unique([name, orgId])
  @@index([orgId])
  @@schema("public")
}

// Événement hors planning de cours (réunion, examen, cérémonie) — ciblage
// par rôles (targetRoles) et/ou participants explicites.
model Event {
  id           String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title        String
  description  String?
  startTime    DateTime?
  endTime      DateTime?
  location     String?
  targetRoles  Role[]
  color        String?
  type         EventType          @default(GENERAL)
  isRecurring  Boolean            @default(false)
  createdById  String?            @db.Uuid
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
  deletedAt    DateTime?
  orgId        String             @db.Uuid
  status       EventStatus        @default(PENDING)
  isPublic     Boolean            @default(false)
  createdBy    User?              @relation("CreatedEvents", fields: [createdById], references: [id], onDelete: SetNull)
  organization Organization       @relation(fields: [orgId], references: [id])
  participants EventParticipant[]

  @@index([orgId])
  @@schema("public")
}

model EventParticipant {
  id       String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId   String          @db.Uuid
  eventId  String          @db.Uuid
  role     ParticipantRole @default(MEMBER)
  status   EventStatus     @default(PENDING)
  joinedAt DateTime        @default(now())
  event    Event           @relation(fields: [eventId], references: [id])
  user     User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([eventId, userId])
  @@index([userId])
  @@index([eventId])
  @@schema("public")
}

// Déclaration d'indisponibilité d'un enseignant — consommée par la
// planification (warning à la création de Schedule, rapport de conflits à la
// génération récurrente). DÉLIBÉRÉMENT sans contrainte DB anti-conflit :
// contrairement à no_teacher_overlap (impossibilité physique), une
// indisponibilité est une déclaration que la direction peut arbitrer — le
// conflit est signalé (+ AuditLog si passage en force), jamais bloqué.
// Deux formes selon type (validation Valibot par forme) :
//   WEEKLY     → dayOfWeek (1=lundi…7, ISO) + startTime/endTime (String
//                "08:00", heure locale org — même convention que WeeklySlot)
//   DATE_RANGE → startDate/endDate (bornes réelles)
// Hard delete : déclaration retirée = supprimée, rien ne la référence.
model TeacherUnavailability {
  id        String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  teacherId String             @db.Uuid
  orgId     String             @db.Uuid
  type      UnavailabilityType

  // Forme WEEKLY (récurrente)
  dayOfWeek Int?
  startTime String?
  endTime   String?

  // Forme DATE_RANGE (ponctuelle)
  startDate DateTime?
  endDate   DateTime?

  reason    String?
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt

  teacher      Teacher      @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [orgId], references: [id])

  @@index([teacherId, type])
  @@index([orgId])
  @@schema("public")
}

enum UnavailabilityType {
  WEEKLY
  DATE_RANGE

  @@schema("public")
}
enum ScheduleStatus {
  PENDING
  COMPLETED
  CANCELED
  MISSED

  @@schema("public")
}

// État de notification d'une CRÉATION de séance (envoi manuel).
enum ScheduleNotifyState {
  PENDING
  SENT

  @@schema("public")
}

enum EventType {
  MEETING
  EXAM
  COURSE
  GENERAL
  ADMINISTRATIVE

  @@schema("public")
}

enum EventStatus {
  PENDING
  ACCEPTED
  DECLINED

  @@schema("public")
}

```

## apps\web\prisma\schemas\schema.prisma

```prisma
generator client {
  provider = "prisma-client"
  output   = "../../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  schemas  = ["public", "billing"]
}

```

## apps\web\prisma\schemas\tenant.prisma

```prisma
// ─── Tenant & identité ───────────────────────────────────────────────────────
// Cœur multi-tenant : Organization est la racine de scope de TOUTES les données
// métier (orgId partout, dénormalisé sur les tables chaudes). User est global
// (un compte peut appartenir à plusieurs organisations via UserOrganization) ;
// les profils par rôle (Teacher, Student…) vivent dans profile.prisma.

// Opérateurs de la plateforme (Anthropic du produit) — hors de tout tenant.
model SuperAdmin {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email     String   @unique
  metadata  Json?
  createdAt DateTime @default(now())

  @@schema("public")
}

// Compte global, partagé entre organisations. deletedAt = désactivation du
// compte entier ; l'appartenance à UNE org se coupe via UserOrganization.status.
model User {
  id                  String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  firstName           String?
  lastName            String?
  email               String             @unique
  sex                 Sex                @default(MALE)
  phone               String?            @unique
  avatar_url          String?
  // @db.Date : date pure sans heure/fuseau
  dateOfBirth         DateTime?          @db.Date
  isConnected         Boolean            @default(false)
  status              UserStatus         @default(ACTIVE)
  details             Json?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
  deletedAt           DateTime?
  admin                  Admin?
  approvalRequested      ApprovalRequest[]  @relation("ApprovalRequestedBy")
  approvalReviewed       ApprovalRequest[]  @relation("ApprovalReviewedBy")
  auditLog               AuditLog[]
  channelMemberships  ChannelMember[]
  moderatedComments   Comment[]          @relation("CommentDeletedBy")
  comments            Comment[]          @relation("CommentAuthor")
  direction           Direction[]
  uploadedDocuments   Document[]         @relation("DocumentUploader")
  createdEvents       Event[]            @relation("CreatedEvents")
  eventParticipations EventParticipant[]
  invitations            Invitation[]
  justificationsDeclared Justification[] @relation("JustificationDeclaredBy")
  justificationsReviewed Justification[] @relation("JustificationReviewedBy")
  messages               Message[]
  notifications       Notification[]
  parent              Parent[]
  assigned            Permission[]       @relation("PermissionAssigner")
  permissions         Permission[]       @relation("PermissionReceiver")
  pushSubscription    PushSubscription[]
  qrScans             QRScan[]
  student             Student[]
  teacher             Teacher[]
  assignedFunctions   UserFunction[]     @relation("UserFunctionAssigner")
  functions           UserFunction[]
  userOrganizations   UserOrganization[]

  @@schema("public")
}

// Racine du tenant. Les back-relations listent tout ce qui est scopé org —
// c'est volontairement exhaustif : la purge RGPD d'une org part d'ici.
model Organization {
  id                String                @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name              String                @unique
  email             String?               @unique
  slug              String?               @unique
  logo              String?
  domain            String?               @unique
  details           Json?
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  isActive          Boolean               @default(true)
  deletedAt         DateTime?
  subscription      Subscription?
  academicYears     AcademicYear[]
  approvalRequests  ApprovalRequest[]
  attendances       Attendance[]
  auditLog          AuditLog[]
  evaluations       Evaluation[]
  channels          Channel[]
  comments          Comment[]
  justifications    Justification[]
  courses           Course[]
  departments       Department[]
  documents         Document[]
  events            Event[]
  functions         Function[]
  invitations       Invitation[]
  locations         Location[]
  parentRelations   ParentRelation[]
  settings          OrganizationSettings?
  usage             OrganizationUsage?
  permissions       Permission[]
  programs          Program[]
  programTracks     ProgramTrack[]
  rooms             Room[]
  schedules         Schedule[]
  ues               UE[]
  ueCourses         UECourse[]
  userOrganizations UserOrganization[]
  weekRecurences    WeekRecurence[]
  weeklyTemplates   WeeklyTemplate[]
 teacherUnavailabilities TeacherUnavailability[]
 
  @@schema("public")
}

// Configuration du tenant (1-1). Quotas commerciaux + préférences produit.
// Cascade : la config n'a aucun sens sans son org.
model OrganizationSettings {
  id                    String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  maxUsers              Int          @default(10)
  storageLimit          BigInt       @default(1073741824)
  maxCourses            Int?         @default(50)
  maxRooms              Int?         @default(20)
  maxClasses            Int?         @default(10)
  timezone              String       @default("Africa/Lome")
  currency              String       @default("XOF")
  language              String       @default("fr")
  parentalNotifications Boolean      @default(false)
  smsNotifications      Boolean      @default(false)
  emailNotifications    Boolean      @default(true)
  breakDuration         Int          @default(15)
  settings              Json?
  updatedAt             DateTime     @updatedAt
  orgId                 String       @unique @db.Uuid
  organization          Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@schema("public")
}

// Compteurs d'usage (1-1), maintenus par les services à l'écriture.
// Séparés de Settings : ligne à écriture fréquente vs config froide.
model OrganizationUsage {
  id            String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  currentUsers  Int          @default(0)
  usedStorage   BigInt       @default(0)
  activeCourses Int          @default(0)
  activeRooms   Int          @default(0)
  updatedAt     DateTime     @updatedAt
  orgId         String       @unique @db.Uuid
  organization  Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@schema("public")
}

// Appartenance User ↔ Org + rôle principal. status coupe l'accès à CETTE org
// sans toucher au compte global ni aux autres appartenances.
model UserOrganization {
  id            String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String       @db.Uuid
  orgId         String       @db.Uuid
  isMainOrg     Boolean      @default(false)
  role          Role         @default(TEACHER)
  status        UserStatus   @default(ACTIVE)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  isResponsable Boolean      @default(false)
  departmentId  String?      @db.Uuid
  department    Department?  @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  organization  Organization @relation(fields: [orgId], references: [id])
  user          User         @relation(fields: [userId], references: [id])

  @@unique([userId, orgId])
  @@index([orgId])
  @@index([orgId, status]) // filtre "membres actifs" fréquent
  @@schema("public")
}

// RBAC fin : une Function regroupe des permissions (ex. "Scolarité",
// "Surveillant") et s'assigne aux users — complète le rôle grossier de
// UserOrganization.role.
model Function {
  id           String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name         String
  description  String?
  orgId        String         @db.Uuid
  isMain       Boolean        @default(false)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  icon         String?
  organization Organization   @relation(fields: [orgId], references: [id], onDelete: Cascade)
  permissions  Permission[]
  users        UserFunction[]

  @@unique([name, orgId])
  @@schema("public")
}

model UserFunction {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String   @db.Uuid
  functionId String   @db.Uuid
  assignedAt     DateTime  @default(now())
  assignedBy     String?   @db.Uuid
  function       Function  @relation(fields: [functionId], references: [id], onDelete: Cascade)
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  assignedByUser User?     @relation("UserFunctionAssigner", fields: [assignedBy], references: [id], onDelete: SetNull)

  @@unique([userId, functionId])
  @@schema("public")
}

// Permission atomique, portée par un user OU une function (l'un des deux).
// resource/resourceId nullable = permission large (toute la ressource / toute l'org).
model Permission {
  id           String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId       String?       @db.Uuid
  functionId   String?       @db.Uuid
  assignedById String?       @db.Uuid
  action       Action        @default(READ)
  resource     Resource?
  resourceId   String?
  description  String?
  isActive     Boolean       @default(true)
  expiresAt    DateTime?
  details      Json?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  orgId        String?       @db.Uuid
  assignedBy   User?         @relation("PermissionAssigner", fields: [assignedById], references: [id], onDelete: Cascade)
  function     Function?     @relation(fields: [functionId], references: [id])
  organization Organization? @relation(fields: [orgId], references: [id], onDelete: Cascade)
  user         User?         @relation("PermissionReceiver", fields: [userId], references: [id])

  // Unicités gérées par index UNIQUE NULLS NOT DISTINCT (PG15+) en post-migrate
  // (permission_user_scope_unique_idx / permission_function_scope_unique_idx) :
  // un @@unique Prisma laisserait passer des doublons sur les permissions
  // globales (userId/functionId NULL — NULLs distincts en SQL standard).
  // Les composites ci-dessous servent les lookups (préfixes userId / functionId
  // couverts — pas d'index simples redondants).
  @@index([userId, action, resource, resourceId, orgId])
  @@index([functionId, action, resource, resourceId, orgId])
  @@index([orgId])
  @@schema("public")
}

// token = secret applicatif (crypto.randomUUID), JAMAIS généré par la DB —
// pas de @default(dbgenerated) sur un secret.
// details Json = payload par type (ex. STUDENT : classe cible, liens à créer
// à l'acceptation).
model Invitation {
  id             String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  token          String         @unique
  email          String
  createdAt      DateTime       @default(now())
  expiresAt      DateTime?
  usedAt         DateTime?
  userId         String?        @db.Uuid
  details        Json?
  invitationType InvitationType @default(INVITE_ONLY)
  orgId          String         @db.Uuid
  resourceId     String?        @db.Uuid
  resourceType   Resource?
  organization   Organization   @relation(fields: [orgId], references: [id])
  user           User?          @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([orgId])
  @@index([resourceId])
  @@schema("public")
}

// Document polymorphique : rattaché à une ressource métier via
// (resourceType, resourceId) — pas de FK par modèle cible.
// `path` = chemin storage relatif (orgs/{orgId}/resources/{TYPE}/{resourceId}/…),
// jamais d'URL signée stockée ; l'extension du path porte le format.
// deletedAt = corbeille : découple la suppression logique (réversible) de la
// purge storage (batch différé, irréversible).
// ⚠️ Intégrité applicative : toute ÉCRITURE vérifie que resourceId
// appartient bien à orgId (pas de FK sur la ressource cible).
model Document {
  id           String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orgId        String       @db.Uuid
  resourceType Resource
  resourceId   String       @db.Uuid
  uploadedById String?      @db.Uuid
  name         String // nom original affiché à l'utilisateur
  path         String // chemin du fichier dans le storage
  type         DocumentType @default(GENERAL)
  createdAt    DateTime     @default(now())
  deletedAt    DateTime?

  organization Organization @relation(fields: [orgId], references: [id])
  uploadedBy   User?        @relation("DocumentUploader", fields: [uploadedById], references: [id], onDelete: SetNull)

  @@index([orgId])
  @@index([resourceType, resourceId])
  @@schema("public")
}

// Journal immuable de traçabilité métier (≠ analytics produit, externalisées).
// resource en String : historique durable, modules futurs libres sans toucher
// l'enum. Typage applicatif : AuditResource = Resource | (string & {}).
// userId nullable + SetNull : la ligne d'audit survit à la suppression du user
// (RGPD / erasure), seule l'identité de l'acteur est dissociée.
model AuditLog {
  id           String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId       String?       @db.Uuid
  action       Action
  resource     String? // "STUDENT", "COURSE", "GRADE"…
  resourceId   String?
  details      Json?
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime      @default(now())
  orgId        String?       @db.Uuid
  organization Organization? @relation(fields: [orgId], references: [id], onDelete: SetNull)
  user         User?         @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([resource, resourceId])
  @@schema("public")
}

// Workflow d'approbation générique — pattern command différé : la demande
// stocke un CHANGEMENT proposé (changes Json), la ressource cible n'est
// modifiée qu'à l'approbation, par le service applicateur du kind concerné
// (registre applicatif : Record<kind, { schema Valibot, apply }>).
// kind en String (comme AuditLog.resource) : modules futurs libres.
// changes = { field: { from, to } } — le `from` sert de garde d'obsolescence :
// si la ressource a changé depuis la demande, l'apply détecte le conflit.
// 1er kind prévu : GRADE_CORRECTION (contournement tracé de Term.lockedAt).
// ⚠️ Même contrat que Document : resourceId ∈ orgId vérifié à l'écriture.
model ApprovalRequest {
  id            String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orgId         String         @db.Uuid
  kind          String
  resourceType  Resource
  resourceId    String         @db.Uuid
  changes       Json
  reason        String?
  status        ApprovalStatus @default(PENDING)
  requestedById String         @db.Uuid
  reviewedById  String?        @db.Uuid
  reviewedAt    DateTime?
  reviewNote    String?
  appliedAt     DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  organization Organization @relation(fields: [orgId], references: [id])
  requestedBy  User         @relation("ApprovalRequestedBy", fields: [requestedById], references: [id])
  reviewedBy   User?        @relation("ApprovalReviewedBy", fields: [reviewedById], references: [id], onDelete: SetNull)

  @@index([orgId, status])
  @@index([resourceType, resourceId])
  @@index([requestedById])
  @@schema("public")
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELED

  @@schema("public")
}

// ─── Enums transverses ───────────────────────────────────────────────────────

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  ON_LEAVE
  PENDING

  @@schema("public")
}

enum Role {
  ADMIN
  TEACHER
  STUDENT
  PARENT
  DIRECTION

  @@schema("public")
}

enum Action {
  CREATE
  READ
  UPDATE
  DELETE
  CRUD

  @@schema("public")
}

// Ressources métier attachables (permissions, documents, commentaires,
// invitations) — domaine connu, borné. L'audit, lui, reste en String.
enum Resource {
  COURSE
  SCHEDULE
  USER
  STUDENT
  TEACHER
  ROOM
  LOCATION
  PROGRAM
  FILIERE
  ATTENDANCE
  GRADE
  CLASS
  MESSAGE
  JUSTIFICATION

  @@schema("public")
}

enum InvitationType {
  DIRECT_CREATE
  INVITE_ONLY
  

  @@schema("public")
}

enum Sex {
  MALE
  FEMALE
  OTHER

  @@schema("public")
}

// Usage MÉTIER du document, pas son format (le format = extension du path).
enum DocumentType {
  GENERAL
  ACADEMIC
  PROFILE
  PEDAGOGY
  JUSTIFICATION // pièce justificative d'absence — le cas clé pour Attendancy
  MEDICAL
  DISCIPLINE

  @@schema("public")
}

```
