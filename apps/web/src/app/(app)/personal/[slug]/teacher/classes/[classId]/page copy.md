// ─── Tenant & identité ───────────────────────────────────────────────────────
// Cœur multi-tenant : Organization est la racine de scope de TOUTES les données
// métier (orgId partout, dénormalisé sur les tables chaudes). User est global
// (un compte peut appartenir à plusieurs organisations via UserOrganization) ;
// les profils par rôle (Teacher, Student…) vivent dans profile.prisma.

// Compte global, partagé entre organisations. deletedAt = désactivation du
// compte entier ; l'appartenance à UNE org se coupe via UserOrganization.status.
model User {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  firstName   String?
  lastName    String?
  email       String    @unique
  sex         Sex       @default(MALE)
  phone       String?   @unique
  avatar_url  String?
  // @db.Date : date pure sans heure/fuseau
  dateOfBirth DateTime? @db.Date
  //phase 2 : identiter
  nationality String?
  address     String?

  isConnected            Boolean            @default(false)
  status                 UserStatus         @default(ACTIVE)
  details                Json?
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt
  deletedAt              DateTime?
  admin                  Admin?
  approvalRequested      ApprovalRequest[]  @relation("ApprovalRequestedBy")
  approvalReviewed       ApprovalRequest[]  @relation("ApprovalReviewedBy")
  auditLog               AuditLog[]
  channelMemberships     ChannelMember[]
  moderatedComments      Comment[]          @relation("CommentDeletedBy")
  comments               Comment[]          @relation("CommentAuthor")
  direction              Direction[]
  uploadedDocuments      Document[]         @relation("DocumentUploader")
  createdEvents          Event[]            @relation("CreatedEvents")
  eventParticipations    EventParticipant[]
  invitations            Invitation[]
  justificationsDeclared Justification[]    @relation("JustificationDeclaredBy")
  justificationsReviewed Justification[]    @relation("JustificationReviewedBy")
  messages               Message[]
  notes                  Note[]
  notifications          Notification[]
  parent                 Parent[]
  assigned               Permission[]       @relation("PermissionAssigner")
  permissions            Permission[]       @relation("PermissionReceiver")
  pushSubscription       PushSubscription[]
  qrScans                QRScan[]
  student                Student[]
  teacher                Teacher[]
  assignedFunctions      UserFunction[]     @relation("UserFunctionAssigner")
  functions              UserFunction[]
  userOrganizations      UserOrganization[]
  // devices
  devices                UserDevice[]
  sessions               UserSession[]
  // payments               Payment[]
  // feeWaivers             FeeWaiver[]

  @@schema("public")
}

// Racine du tenant. Les back-relations listent tout ce qui est scopé org —
// c'est volontairement exhaustif : la purge RGPD d'une org part d'ici.
model Organization {
  id                      String                  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name                    String
  email                   String?                 @unique
  slug                    String?                 @unique
  logo                    String?
  domain                  String?                 @unique
  details                 Json?
  type                    OrganizationType        @default(INSTITUTION)
  createdAt               DateTime                @default(now())
  updatedAt               DateTime                @updatedAt
  isActive                Boolean                 @default(true)
  deletedAt               DateTime?
  subscription            Subscription?
  academicYears           AcademicYear[]
  approvalRequests        ApprovalRequest[]
  attendances             Attendance[]
  auditLog                AuditLog[]
  evaluations             Evaluation[]
  channels                Channel[]
  comments                Comment[]
  justifications          Justification[]
  courses                 Course[]
  departments             Department[]
  documents               Document[]
  events                  Event[]
  functions               Function[]
  invitations             Invitation[]
  locations               Location[]
  parentRelations         ParentRelation[]
  settings                OrganizationSettings?
  usage                   OrganizationUsage?
  permissions             Permission[]
  programs                Program[]
  programTracks           ProgramTrack[]
  rooms                   Room[]
  schedules               Schedule[]
  ues                     UE[]
  ueCourses               UECourse[]
  userOrganizations       UserOrganization[]
  weekRecurences          WeekRecurence[]
  weeklyTemplates         WeeklyTemplate[]
  teacherUnavailabilities TeacherUnavailability[]
  userSessions            UserSession[]
  teacherCourseHours      TeacherCourseHours[]
  // feeStructures           FeeStructure[]
  // invoices                Invoice[]
  // payments                Payment[]
  // feeWaivers              FeeWaiver[]
  notes                   Note[]
  notifications           Notification[]

  // Un nom peut être réutilisé par les espaces personnels, mais pas par les institutions.
  @@unique([name], where: { type: "INSTITUTION" }, map: "organization_institution_name_unique")
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
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String   @db.Uuid
  functionId     String   @db.Uuid
  assignedAt     DateTime @default(now())
  assignedBy     String?  @db.Uuid
  function       Function @relation(fields: [functionId], references: [id], onDelete: Cascade)
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  assignedByUser User?    @relation("UserFunctionAssigner", fields: [assignedBy], references: [id], onDelete: SetNull)

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
  GROUP
  MESSAGE
  JUSTIFICATION
  INVITATION
  NOTE

  @@schema("public")
}

