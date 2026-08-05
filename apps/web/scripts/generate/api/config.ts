/**
 * //scripts/generate-api/config.ts
 * Configuration du générateur — TOUT ce qui est spécifique à un projet/domaine
 * métier vit ici, jamais dans generate-api.ts. Objectif : réutiliser le
 * générateur tel quel sur un autre projet en ne touchant que ce fichier.
 */

// ─────────────────────────────────────────────────────────────────────────────
// ORG_ID_CHECK — assertion de scope tenant (§5 du skill)
// ─────────────────────────────────────────────────────────────────────────────
//
// enabled     : false désactive complètement le check (projet non multi-tenant,
//               ou scope vérifié par un autre mécanisme — RLS, middleware, etc.).
// fieldName   : nom du champ de scope tenant dans le schéma Prisma. Changer ici
//               (ex. "tenantId", "companyId", "accountId") suffit à adapter tout
//               le check — le script ne connaît plus jamais la string en dur.
// exemptFns   : fns totalement exemptées (pas de warn du tout).
//               Raisons valides : lookup par clé globale unique (userId) ou scope
//               vérifié par un autre mécanisme non traçable statiquement.
// exemptDirs  : répertoires entiers exemptés (super-admin, auth). Chemins relatifs
//               à la racine du projet, doivent matcher le préfixe de fileRel tel
//               que produit par relPath() (donc sans espace ni typo).
// globalModels  : modèles Prisma dont l'id est global-unique (pas de scope
//                 tenant nécessaire).
// profileModels : modèles "profil" scopés par tenant (ex. après migration
//                 @@unique([userId, orgId])). Pour ces modèles, un lookup sans
//                 le champ de scope dans le where racine est ambigu — message
//                 dédié plus explicite que le warn générique.
// messages    : gabarits de message, paramétrés par fieldName — à adapter si le
//               vocabulaire métier change (ex. mentionner la migration réelle).
export const ORG_ID_CHECK = {
  enabled: true,

  fieldName: "orgId",

  // Fns exemptées du check (lookup par clé globale unique, ex. userId — pas
  // de tenant à vérifier pour ces cas précis).
  exemptFns: [
    "getStudentIdByUserId",
    "getProfileIdByUserRole",
    // invite — lookup par token (clé globale unique), orgId dans le join organization
    "getInviteByToken",
    // invite — lookup par invitation.id avant guard UserOrganization(orgId) dans deleteInvitationUserAction
    "deleteInvitationUserAction",
    // function — orgId dans clé composite @@unique([name, orgId]) → scopé correctement
    "getFunctionByName",
    // notification — Notification n'a pas de colonne orgId (scope par userId)
    "getNotificationsForUser",
    "getUnreadNotificationsForUser",
    "getUnreadCountForUser",
    // notification admin — orgId imbriqué dans user.userOrganizations (join obligé, pas de colonne directe)
    "getOrganizationNotifications",
    "getOrganizationUnreadNotifications",
    "getOrganizationUserNotifications",
    "getOrganizationUnreadCount",
    "getOrganizationNotificationStats",
    // push — PushSubscription n'a pas de colonne orgId (scope par userId)
    "getPushSubscriptionsByUserId",
    "getActivePushSubscriptionsByUserId",
    "getSubscriptionStats",
    // teacher — orgId imbriqué dans relation course/schedule (pas de colonne orgId directe sur CourseTeacher/Session)
    "getTeacherCourses",
    "getTeacherStats",
    // schedule — orgId dans buildScheduleWhere() (helper non traçable statiquement)
    "getSchedules",
    "getDaySchedules",
    // schedule — orgId imbriqué dans programTrack: { orgId } (Class sans colonne orgId directe)
    "assertClassInOrg",
    // schedule — Class n'a pas orgId direct (via programTrack.orgId)
    "createSchedule",
    // course — Class via programTrack.orgId ; CourseTeacher via course.orgId ; partial unique check sans orgId (classId scope)
    "createCourse",
    "deleteTeacherFromCourse",
    "getCourseTeachers",
    "getCourseTeachersIds",
    // class — Class/Group/StudentEnrollment n'ont pas orgId direct (via programTrack.orgId)
    "getClasses",
    "getClass",
    "getClassGroupsAction",
    "getGroupEligibleStudentsAction",
    // users — orgId imbriqué via userOrganizations (User n'a pas de colonne orgId directe)
    "getUserProfile",
    // users — orgId imbriqué via UserFunction.function.orgId (UserFunction n'a pas de colonne orgId directe)
    "getFunctionProfiles",
    // planning — Class n'a pas orgId direct (via academicYear.orgId) ; Teacher via courses.course.orgId
    "getOrgPlanningResources",
  ],

  // Répertoires exemptés (auth, super-admin — scope vérifié autrement ou
  // hors périmètre multi-tenant classique).
  // ⚠ À RECONFIRMER après réorganisation de service : si super-admin/ a été
  // déplacé/renommé/supprimé côté V2, ajuster ce chemin en conséquence.
  exemptDirs: [
    "src/services/super-admin/",
    "src/services/auth/",
  ],

  globalModels: ["User"],

  // Modèles "profil" scopés par tenant (@@unique([userId, orgId]) — cf. A-07
  // ARCHITECTURE.md : Teacher/Student/Parent/Direction sont désormais
  // org-scopés). Un lookup sans orgId sur ces modèles est ambigu (retourne
  // potentiellement le mauvais profil si l'utilisateur appartient à
  // plusieurs organisations) — message dédié plus explicite que le warn
  // générique.
  profileModels: ["Teacher", "Student", "Parent", "Direction"],

  messages: {
    absent: (model: string, method: string, fieldName: string) =>
      `prisma.${model}.${method} : where racine sans ${fieldName} — scope non vérifié`,
    nested: (model: string, method: string, fieldName: string) =>
      `prisma.${model}.${method} : ${fieldName} possiblement imbriqué dans where/select — relecture requise`,
    absentProfile: (model: string, method: string, fieldName: string) =>
      `prisma.${model}.${method} : modèle profil — ${fieldName} absent du where racine. Un lookup sur un modèle scopé par tenant est ambigu sans ce champ (retourne potentiellement le mauvais profil si l'utilisateur appartient à plusieurs tenants).`,
    nestedProfile: (model: string, method: string, fieldName: string) =>
      `prisma.${model}.${method} : modèle profil — ${fieldName} imbriqué dans where/select. Vérifier que le filtre couvre bien le bon profil tenant.`,
  },
} as const;

export type OrgIdCheckConfig = typeof ORG_ID_CHECK;

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT_LAYOUT — conventions de fichiers/imports du projet
// ─────────────────────────────────────────────────────────────────────────────
//
// pathAlias : alias TS résolu par le générateur (doit correspondre au
//             tsconfig.json du projet — baseUrl + paths).
// dirNames  : noms des sous-dossiers "couche DB" et "couche action" à l'intérieur
//             d'un service. Un service peut aussi n'avoir qu'un fichier plat
//             (`${dirNames.db}.ts` / `${dirNames.actions}.ts}`) au lieu d'un
//             dossier — les deux formes sont supportées.
export const PROJECT_LAYOUT = {
  pathAlias: {
    baseUrl: ".",             // relatif à la racine du projet (ROOT)
    paths: { "@/*": ["./src/*"] },
  },
  servicesRoot: "src/services",
  dirNames: {
    db: "database",
    actions: "actions",
  },
} as const;

export type ProjectLayoutConfig = typeof PROJECT_LAYOUT;