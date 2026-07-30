# Audit `onDelete` — Inventaire complet + table de décision

> Généré le 2026-07-29. Couvre tous les fichiers `prisma/schemas/*.prisma` et
> `prisma/post-migrate/*.sql` + `prisma/verify/verify.sql`.

## Légende

| Symbole | Signification |
|---|---|
| ✅ | Déjà correct, explicit, documenté |
| ⚠ | Restrict **par défaut** — probablement un oubli |
| ✋ | Restrict **choisi** — garde intentionnelle |
| 🚩 | Champ NOT NULL mais attributif → rendre nullable si SetNull voulu |
| 🔄 | Soft-delete couvre le cas fréquent, Restrict = défense en profondeur |

---

## 1. Table de décision — TOUS les champs FK

### `tenant.prisma`

| Modèle.champ | Cible | Nullable | onDelete actuel | Recommandation | Justification |
|---|---|:---:|---|---|---|
| OrganizationSettings.orgId | Organization | ❌ | **Cascade** ✅ | — | Config 1-1, meurt avec l'org |
| OrganizationUsage.orgId | Organization | ❌ | **Cascade** ✅ | — | Compteurs 1-1, meurt avec l'org |
| UserOrganization.departmentId | Department | ✅ | Restrict (défaut) | **SetNull** ⚠ | Département optionnel, l'appartenance à l'org survit |
| UserOrganization.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Appartenance n'existe pas sans l'org |
| UserOrganization.userId | User | ❌ | Restrict (défaut) | **Cascade** ⚠ | Appartenance n'existe pas sans le user (user.deletedAt couvre le cas fréquent) |
| Function.orgId | Organization | ❌ | **Cascade** ✅ | — | RBAC scopé à l'org |
| UserFunction.functionId | Function | ❌ | **Cascade** ✅ | — | Affectation meurt avec la fonction |
| UserFunction.userId | User | ❌ | **Cascade** ✅ | — | Affectation meurt avec le user |
| UserFunction.assignedBy | User | ✅ | *Aucune FK définie* | **Définir relation + SetNull** 🚩 | Colonne UUID brute sans FK DB — dangling UUID possible si user supprimé |
| Permission.assignedById | User | ✅ | Restrict (défaut) | **SetNull** ⚠ | Attributif "qui a accordé" ; la permission doit survivre |
| Permission.functionId | Function | ✅ | Restrict (défaut) | **Cascade** ⚠ | Permission portée par la fonction, orpheline sans elle |
| Permission.orgId | Organization | ✅ | Restrict (défaut) | **Cascade** ⚠ | Scopée à l'org — contradiction avec purge RGPD (cf. section 3) |
| Permission.userId | User | ✅ | Restrict (défaut) | **Cascade** ⚠ | Permission sur ce user, orpheline sans lui |
| Invitation.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Invitation scopée à l'org |
| Invitation.userId | User | ✅ | Restrict (défaut) | **SetNull** ⚠ | Référence "quel user a accepté/été invité", historique ; invitation survit |
| Document.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Document scopé à l'org |
| Document.uploadedById | User | ✅ | Restrict (défaut) | **SetNull** ⚠ | Attributif "qui a uploadé" ; même pattern que AuditLog.userId (déjà tranché) |
| AuditLog.userId | User | ✅ | **SetNull** ✅ | — | Déjà tranché — trace survit, acteur dissocié |
| AuditLog.orgId | Organization | ✅ | Restrict (défaut) | **SetNull** ⚠ | Log survit à la purge org. **Contradiction critique** : field nullable mais Restrict bloque le DELETE Organization si des lignes existent |
| ApprovalRequest.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Demande scopée à l'org |
| ApprovalRequest.requestedById | User | ❌ | Restrict (défaut) | **SetNull** 🚩 | Attributif "qui a demandé" ; historique de changement doit survivre. Requiert de rendre nullable |
| ApprovalRequest.reviewedById | User | ✅ | Restrict (défaut) | **SetNull** ⚠ | Attributif "qui a statué" ; décision survit |

---

### `profile.prisma`

| Modèle.champ | Cible | Nullable | onDelete actuel | Recommandation | Justification |
|---|---|:---:|---|---|---|
| Admin.userId | User | ❌ | **Cascade** ✅ | — | Profil meurt avec le compte |
| Teacher.userId | User | ❌ | **Cascade** ✅ | — | Profil meurt avec le compte |
| Teacher.departmentId | Department | ✅ | Restrict (défaut) | **SetNull** ⚠ | Département optionnel ; l'enseignant peut exister sans département |
| Student.userId | User | ❌ | **Cascade** ✅ | — | Profil meurt avec le compte |
| Parent.userId | User | ❌ | **Cascade** ✅ | — | Profil meurt avec le compte |
| Direction.userId | User | ❌ | **Cascade** ✅ | — | Profil meurt avec le compte |
| ParentRelation.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Lien scopé à l'org, meurt avec elle |
| ParentRelation.parentId | Parent | ❌ | Restrict (défaut) | **Cascade** ⚠ | Lien meurt avec le profil parent |
| ParentRelation.studentId | Student | ❌ | Restrict (défaut) | **Cascade** ⚠ | Lien meurt avec le profil étudiant |

---

### `academic.prisma`

| Modèle.champ | Cible | Nullable | onDelete actuel | Recommandation | Justification |
|---|---|:---:|---|---|---|
| AcademicYear.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Structure académique scopée à l'org |
| Department.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Idem |
| ProgramTrack.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Idem |
| ProgramTrack.departmentId | Department | ❌ | Restrict (défaut) | **Cascade** ⚠ | Filière meurt avec son département |
| Program.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Maquette scopée à l'org |
| Program.programTrackId | ProgramTrack | ❌ | Restrict (défaut) | **Cascade** ⚠ | Maquette meurt avec sa filière |
| ProgramUE.programId | Program | ❌ | **Cascade** ✅ | — | Position maquette meurt avec le programme |
| ProgramUE.ueId | UE | ❌ | **Restrict** ✅ | — | Intentionnel documenté : garde historique maquette vs archivage UE |
| UE.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | UE scopée à l'org |
| UE.departmentId | Department | ✅ | Restrict (défaut) | **SetNull** ⚠ | Département optionnel sur l'UE |
| UECourse.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Matière scopée à l'org |
| UECourse.ueId | UE | ❌ | **Restrict** ✅ | — | Intentionnel documenté : même logique que ProgramUE |
| Class.academicYearId | AcademicYear | ❌ | Restrict (défaut) | **Cascade** ⚠ | Promo meurt avec son année académique |
| Class.programId | Program | ✅ | Restrict (défaut) | **SetNull** ⚠ | Programme optionnel (nullable) ; la classe peut exister avant programme appliqué |
| Class.programTrackId | ProgramTrack | ❌ | Restrict (défaut) | **Cascade** ⚠ | Promo meurt avec sa filière |
| Term.classId | Class | ❌ | **Cascade** ✅ | — | Semestre meurt avec sa classe |
| Course.classId | Class | ❌ | **Cascade** ✅ | — | Cours meurt avec sa classe |
| Course.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Cours scopé à l'org |
| Course.termId | Term | ✅ | Restrict (défaut) | **SetNull** ⚠ | Cours hors maquette (nullable) ; si Term supprimé par Cascade(classId), SetNull préserve le cours |
| Course.ueCourseId | UECourse | ❌ | Restrict (défaut) | **Restrict** ✋ | Garde intentionnelle : UECourse a deletedAt, hard-delete doit être bloqué si des cours actifs s'y réfèrent |
| CourseTeacher.courseId | Course | ❌ | Restrict (défaut) | **Cascade** ⚠ | Affectation enseignant meurt avec le cours |
| CourseTeacher.teacherId | Teacher | ❌ | Restrict (défaut) | **Restrict** ✋ 🚩 | Teacher a deletedAt ; l'affectation est un fait historique. À discuter : SetNull si on veut conserver l'historique du cours sans le prof |
| OptionalUE.studentId | Student | ❌ | Restrict (défaut) | **Cascade** ⚠ | Choix meurt avec le profil étudiant |
| OptionalUE.ueId | UE | ❌ | Restrict (défaut) | **Cascade** ⚠ | Choix meurt si l'UE est supprimée |
| OptionalUE.yearId | AcademicYear | ❌ | Restrict (défaut) | **Cascade** ⚠ | Choix scopé à l'année académique |
| StudentEnrollment.classId | Class | ❌ | Restrict (défaut) | **Restrict** ✋ 🔄 | Class a deletedAt ; Restrict bloque le hard delete si une inscription existe — intentionnel |
| StudentEnrollment.studentId | Student | ❌ | Restrict (défaut) | **Restrict** ✋ 🔄 | Student a deletedAt ; Restrict bloque le hard delete si des présences existent (chaîne via Attendance.enrollmentId) |
| Group.classId | Class | ❌ | Restrict (défaut) | **Cascade** ⚠ | Groupe meurt avec sa classe (Class hard delete déjà bloqué par StudentEnrollment.Restrict) |
| StudentGroup.enrollmentId | StudentEnrollment | ❌ | **Cascade** ✅ | — | Affectation groupe meurt avec l'inscription |
| StudentGroup.groupId | Group | ❌ | **Cascade** ✅ | — | Affectation groupe meurt avec le groupe |

---

### `schedule.prisma`

| Modèle.champ | Cible | Nullable | onDelete actuel | Recommandation | Justification |
|---|---|:---:|---|---|---|
| Schedule.classId | Class | ❌ | Restrict (défaut) | **Restrict** ✋ 🔄 | Class hard-delete bloqué en amont (StudentEnrollment) ; Restrict en profondeur |
| Schedule.courseId | Course | ❌ | Restrict (défaut) | **Restrict** ✋ 🔄 | Course a deletedAt ; Schedule garde trace de la séance planifiée |
| Schedule.groupId | Group | ✅ | **Restrict** ✅ | — | Intentionnel documenté : évite requalification silencieuse groupe→classe |
| Schedule.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Séance scopée à l'org |
| Schedule.roomId | Room | ❌ | Restrict (défaut) | **Restrict** ✋ 🔄 | Room a deletedAt + contrainte GiST no_room_overlap — Restrict bloque hard delete salle si séances actives |
| Schedule.teacherId | Teacher | ❌ | Restrict (défaut) | **Restrict** ✋ 🔄 | Teacher a deletedAt + contrainte no_teacher_overlap — Restrict bloque hard delete prof si séances actives |
| Schedule.weekRecurrenceId | WeekRecurence | ✅ | Restrict (défaut) | **SetNull** ⚠ | Lien tracé vers la récurrence d'origine ; la séance concrète survit si la récurrence est supprimée |
| WeeklyTemplate.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Template scopé à l'org |
| WeeklySlot.templateId | WeeklyTemplate | ❌ | Restrict (défaut) | **Cascade** ⚠ | Créneau meurt avec son template |
| WeeklySlot.courseId | Course | ❌ | Restrict (défaut) | **Restrict** ✋ 🔄 | Course a deletedAt ; Restrict bloque hard delete cours si des créneaux template l'utilisent encore |
| WeeklySlot.roomId | Room | ❌ | Restrict (défaut) | **Restrict** ✋ 🔄 | Idem |
| WeeklySlot.teacherId | Teacher | ❌ | Restrict (défaut) | **Restrict** ✋ 🔄 | Idem |
| WeekRecurence.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Récurrence scopée à l'org |
| WeekRecurence.templateId | WeeklyTemplate | ❌ | Restrict (défaut) | **Cascade** ⚠ | Récurrence meurt avec son template |
| Location.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Site scopé à l'org |
| Room.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Salle scopée à l'org |
| Room.locationId | Location | ✅ | Restrict (défaut) | **SetNull** ⚠ | Salle sans géofencing est valide (cours en ligne) |
| Event.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Événement scopé à l'org |
| Event.createdById | User | ❌ | Restrict (défaut) | **SetNull** 🚩 | Attributif "créateur" ; Event a deletedAt. Requiert de rendre nullable |
| EventParticipant.eventId | Event | ❌ | Restrict (défaut) | **Cascade** ⚠ | Participation meurt avec l'événement |
| EventParticipant.userId | User | ❌ | Restrict (défaut) | **Cascade** ⚠ | Participation sans user = orpheline (user.deletedAt couvre le cas fréquent) |
| TeacherUnavailability.teacherId | Teacher | ❌ | **Cascade** ✅ | — | Déclaration meurt avec le profil enseignant |
| TeacherUnavailability.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Scopée à l'org |

---

### `attendance.prisma`

| Modèle.champ | Cible | Nullable | onDelete actuel | Recommandation | Justification |
|---|---|:---:|---|---|---|
| Session.scheduleId | Schedule | ❌ | Restrict (défaut) | **Restrict** ✋ | Session = fait historique immuable ; hard delete Schedule bloqué côté planning |
| Session.locationId | Location | ✅ | Restrict (défaut) | **SetNull** ⚠ | Session sans localisation valide (GPS off) ; `session_presence_map` fait déjà un LEFT JOIN |
| SessionToken.sessionId | Session | ❌ | **Cascade** ✅ | — | Token meurt avec la session |
| Attendance.scheduleId | Schedule | ❌ | Restrict (défaut) | **Restrict** ✋ | Fait de présence immuable, garde historique |
| Attendance.studentId | Student | ❌ | Restrict (défaut) | **Restrict** ✋ 🔄 | Fait immuable ; Student hard-delete bloqué par Attendance.enrollmentId (chaîne) |
| Attendance.enrollmentId | StudentEnrollment | ❌ | **Restrict** ✅ | — | Intentionnel documenté : présence rend l'inscription insupprimable |
| Attendance.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Fait de présence scopé à l'org |
| QRCode.roomId | Room | ❌ | Restrict (défaut) | **Cascade** ⚠ | QR code lié à la salle, meurt avec elle |
| QRScan.qrCodeId | QRCode | ❌ | Restrict (défaut) | **Restrict** ✋ | Trace brute d'émargement, preuve — garde intentionnelle |
| QRScan.sessionId | Session | ✅ | Restrict (défaut) | **SetNull** ⚠ | Scan hors session possible ; trace conservée même si session supprimée |
| QRScan.userId | User | ❌ | Restrict (défaut) | **Restrict** ✋ 🚩 | Trace brute immuable. Question RGPD ouverte : SetNull (requiert nullable) ou Restrict + user soft-delete uniquement |
| Justification.studentId | Student | ❌ | Restrict (défaut) | **Restrict** ✋ | Historique métier ; Student soft-delete couvre le cas fréquent |
| Justification.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Justification scopée à l'org |
| Justification.scheduleId | Schedule | ❌ | Restrict (défaut) | **Restrict** ✋ | Historique ; Schedule hard-delete bloqué par Attendance en amont |
| Justification.declaredById | User | ❌ | Restrict (défaut) | **SetNull** 🚩 | Attributif "qui a déclaré" ; historique doit survivre. Requiert de rendre nullable |
| Justification.reviewedById | User | ✅ | Restrict (défaut) | **SetNull** ⚠ | Attributif "qui a statué" ; décision survit |

---

### `evaluation.prisma`

| Modèle.champ | Cible | Nullable | onDelete actuel | Recommandation | Justification |
|---|---|:---:|---|---|---|
| Evaluation.courseId | Course | ❌ | Restrict (défaut) | **Restrict** ✋ | Fait immuable, garde historique (même pattern que Attendance) |
| Evaluation.studentId | Student | ❌ | Restrict (défaut) | **Restrict** ✋ | Fait immuable, même logique |
| Evaluation.classId | Class | ❌ | Restrict (défaut) | **Restrict** ✋ | Contexte de la note, classe hard-delete déjà bloquée |
| Evaluation.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | Scopée à l'org |

---

### `communication.prisma`

| Modèle.champ | Cible | Nullable | onDelete actuel | Recommandation | Justification |
|---|---|:---:|---|---|---|
| Channel.orgId | Organization | ❌ | **Cascade** ✅ | — | Canal meurt avec l'org |
| Channel.classId | Class | ✅ | **Cascade** ✅ | — | Canal meurt avec la classe |
| Channel.groupId | Group | ✅ | **Cascade** ✅ | — | Canal meurt avec le groupe |
| ChannelMember.channelId | Channel | ❌ | **Cascade** ✅ | — | Membership meurt avec le canal |
| ChannelMember.userId | User | ❌ | Restrict (défaut) | **Cascade** ⚠ | Membership sans user = orphelin (user.deletedAt couvre le cas fréquent) |
| Message.channelId | Channel | ❌ | **Cascade** ✅ | — | Message meurt avec le canal |
| Message.userId | User | ❌ | Restrict (défaut) | **SetNull** 🚩 | Attributif "auteur" ; Message a deletedAt, le fil doit survivre avec auteur anonymisé. Requiert de rendre nullable |
| Message.parentId | Message | ✅ | Restrict (défaut) | **Restrict** ✋ | Auto-référentiel ; les réponses ne disparaissent pas si le parent est soft-deleted |
| RealtimeItem.channelId | Channel | ❌ | **Cascade** ✅ | — | État temps réel meurt avec le canal |
| Comment.orgId | Organization | ❌ | **Cascade** ✅ | — | Commentaire meurt avec l'org |
| Comment.userId | User | ❌ | Restrict (défaut) | **SetNull** 🚩 | Attributif "auteur" ; Comment a deletedAt. Requiert de rendre nullable |
| Comment.deletedBy | User | ✅ | Restrict (défaut) | **SetNull** ⚠ | Attributif "modérateur" ; trace de modération survit |
| Comment.parentId | Comment | ✅ | Restrict (défaut) | **Restrict** ✋ | Auto-référentiel ; même logique que Message.parentId |
| Notification.userId | User | ❌ | Restrict (défaut) | **Cascade** ⚠ | Notif sans destinataire est sans sens |
| Notification.scheduleId | Schedule | ✅ | Restrict (défaut) | **SetNull** ⚠ | Notif stale mais conservée si la séance est supprimée |
| PushSubscription.userId | User | ❌ | **Cascade** ✅ | — | Abonnement push meurt avec le user |

---

### `billing.prisma`

| Modèle.champ | Cible | Nullable | onDelete actuel | Recommandation | Justification |
|---|---|:---:|---|---|---|
| Subscription.orgId | Organization | ❌ | Restrict (défaut) | **Cascade** ⚠ | L'abonnement n'a pas de sens sans son org ; suit la purge RGPD |
| Subscription.planId | Plan | ❌ | Restrict (défaut) | **Restrict** ✋ | Plan = table lookup, rarement supprimé ; garde appropriée |

---

## 2. Croisement SQL post-migrate — contradictions potentielles

| Fichier | Objet SQL | Relation concernée | Risque |
|---|---|---|---|
| `40_schedule.sql` | Contraintes GiST (`no_room_overlap`, `no_teacher_overlap`, `no_class_overlap_global`, `no_group_overlap`) | Schedule.roomId / teacherId / classId / groupId | Toutes NOT NULL + Restrict — **cohérent** : Restrict bloque le hard delete d'une salle/prof/classe tant qu'il y a des séances actives. Contraintes GiST portent uniquement sur `deletedAt IS NULL`. |
| `40_schedule.sql` | `prevent_locked_schedule_update` | Schedule.courseId / teacherId / roomId / classId / groupId | Trigger BEFORE UPDATE sur champs structurants — compatible avec Restrict : si une ressource est supprimée, Restrict bloque en amont, le trigger ne joue pas. |
| `50_attendance.sql` | `teacher_check_in` | Session.locationId → Location | Fonction fait un LEFT JOIN — **SetNull serait safe** : locationId = NULL → géofencing désactivé (comportement déjà documenté via `location_active`). Pas de contradiction. |
| `50_attendance.sql` | `session_presence_map` (vue) | Session.locationId → Location | Vue fait `LEFT JOIN Location ON loc.id = sess."locationId"` — **SetNull compatible** sans modification de la vue. |
| `70_communication.sql` | `trg_chat_on_student_enrollment_ins` | StudentEnrollment.studentId → Student → User | Trigger lookup `Student.userId`. Student.userId est Cascade depuis User. Si User supprimé → Student cascade → StudentEnrollment bloqué par Restrict (Attendance). **Chaîne cohérente** : user avec présences ne peut être hard-deleted. |
| `30_academic.sql` | `validate_student_class_group` | StudentGroup.enrollmentId / groupId | Les deux sont Cascade depuis StudentGroup. Si enrollment ou group supprimé, la ligne StudentGroup est cascadée avant que le trigger BEFORE UPDATE soit pertinent. **Pas de conflit.** |
| **⚠ CONTRADICTION CRITIQUE** | `AuditLog.orgId` | AuditLog.orgId → Organization (NULLABLE, Restrict défaut) | Champ nullable — intention : la ligne d'audit survit à la suppression de l'org. Mais Restrict (défaut) = le DELETE Organization est **rejeté** si des lignes AuditLog ont cet orgId, même si le champ est nullable. Contradiction directe avec le commentaire "la purge RGPD d'une org part d'ici". **Doit passer en SetNull.** |
| **⚠ CONTRADICTION** | `Permission.orgId` | Permission.orgId → Organization (NULLABLE, Restrict défaut) | Même problème : orgId nullable mais Restrict bloque la purge org si des permissions la référencent. À passer en Cascade (permissions meurent avec l'org) selon la stratégie retenue. |

---

## 3. Section `Organization` — stratégie de purge

### Inventaire complet des relations vers `Organization` (tous schémas)

| Modèle.champ | Nullable | onDelete actuel | Si purge DB-directe | Si purge applicative |
|---|:---:|---|---|---|
| OrganizationSettings.orgId | ❌ | Cascade ✅ | — | — |
| OrganizationUsage.orgId | ❌ | Cascade ✅ | — | — |
| Function.orgId | ❌ | Cascade ✅ | — | — |
| Channel.orgId | ❌ | Cascade ✅ | — | — |
| Comment.orgId | ❌ | Cascade ✅ | — | — |
| UserOrganization.orgId | ❌ | Restrict (défaut) | Cascade manquant | Restrict = garde, delete en premier |
| Invitation.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| Document.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| AuditLog.orgId | ✅ | Restrict (défaut) | **SetNull** (trace survit) | SetNull (même intention, indépendante de la stratégie) |
| ApprovalRequest.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| AcademicYear.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| Department.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| ProgramTrack.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| Program.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| UE.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| UECourse.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| Course.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| Schedule.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| WeeklyTemplate.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| WeekRecurence.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| Location.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| Room.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| Event.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| TeacherUnavailability.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| Attendance.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| Evaluation.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| Permission.orgId | ✅ | Restrict (défaut) | **Cascade** manquant | Cascade ou SetNull |
| ParentRelation.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |
| Subscription.orgId | ❌ | Restrict (défaut) | Cascade manquant | Idem |

### Diagnostic

**État actuel : incohérent.** Cinq Cascade explicites existent (Settings, Usage, Function,
Channel, Comment) mais tout le reste est Restrict par défaut. Aucune des deux stratégies
n'est implémentée de façon cohérente.

### Position proposée

**Option A — Purge applicative (recommandée)**

- Garder Restrict sur tous les champs `orgId` NOT NULL (sauf les 5 déjà Cascade qui restent).
- Corriger les deux **contradictions critiques indépendamment** : `AuditLog.orgId → SetNull`
  et `Permission.orgId → Cascade`.
- Écrire un service `purgeOrganization(orgId)` qui supprime dans l'ordre topologique :

```
Attendance / Evaluation
  → Schedule / Session / SessionToken
    → Course / Class / Term
      → AcademicYear / Department / UE / UECourse
        → UserOrganization / ParentRelation
          → Document / ApprovalRequest / Invitation / Justification
            → AuditLog (SetNull orgId)
              → Organization
```

- Documenter le choix dans le commentaire `Organization` du schéma et dans un
  `CLAUDE.md` du service org.
- **Avantages** : observable (chaque étape loggée), rollbackable, pas d'effet de bord
  d'un Cascade DB en chaîne sur des tables chaudes (Attendance, Schedule).

**Option B — Purge DB-directe (CASCADE partout sur orgId)**

- Ajouter `onDelete: Cascade` sur les ~24 champs `orgId` NOT NULL restants.
- La chaîne Cascade atteint 5-6 niveaux sur des tables chaudes. Le
  `DELETE FROM Organization` devient long, non-annulable, difficile à monitorer.
- Requiert de résoudre les Restrict intentionnels intermédiaires
  (ex. `Attendance.enrollmentId → Restrict` bloquerait le cascade depuis `StudentEnrollment`).
- **Déconseillée** pour ce schéma.

---

## 4. Questions ouvertes à trancher (avant toute migration)

| # | Question | Impact |
|---|---|---|
| 1 | **Stratégie purge org** : applicative ou DB-cascade ? | Détermine tous les `onDelete` des champs `orgId` |
| 2 | **Champs NOT NULL attributifs** (🚩) : `ApprovalRequest.requestedById`, `Event.createdById`, `Justification.declaredById`, `Message.userId`, `Comment.userId` — les rendre nullable pour SetNull, ou Restrict pur (soft-delete User obligatoire) ? | Migration de schéma si nullable |
| 3 | **QRScan.userId** : trace brute immuable — SetNull (nullable) ou Restrict + user soft-delete uniquement ? | Question RGPD : effacement user = anonymisation ou suppression de la trace ? |
| 4 | **CourseTeacher.teacherId** : Cascade (affectation meurt avec le prof) ou SetNull (teacherId nullable, historique du cours conservé sans identité) ? | Choix entre perte historique vs colonne nullable |
| 5 | **UserFunction.assignedBy** : ajouter la relation Prisma + SetNull, ou rester sans FK intentionnellement ? | Colonne actuellement sans contrainte DB |
| 6 | **AuditLog.orgId** : SetNull (logs dissociés de l'org) ou Cascade (logs supprimés avec l'org) ? | Dépend du contenu de `details` Json — données personnelles résiduelles ? |
