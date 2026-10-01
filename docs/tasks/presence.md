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
  name                    String                  @unique
  email                   String?                 @unique
  logo                    String?
....

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
  
  courseHours TeacherCourseHours[]
  weeklySlots  WeeklySlot[]

  @@unique([userId, orgId])
  @@index([orgId])
  @@schema("public")
}