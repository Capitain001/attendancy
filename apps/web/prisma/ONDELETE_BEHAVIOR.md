# Comportement onDelete — référence rapide

> Généré le 2026-07-29. Reflète `prisma/migrations/20260729113046_init`.

---

## Scénarios critiques — Planning & Cours

### Suppression d'un Teacher (via User cascade)

```
DELETE User
  → CASCADE → Teacher deleted
      → Schedule.teacherId        (RESTRICT)  ❌ BLOQUÉ si séances planifiées
      → WeeklySlot.teacherId      (RESTRICT)  ❌ BLOQUÉ si grille hebdo active
      → CourseTeacher.teacherId   (SET NULL)  ✓ affectation survit, teacherId = NULL
      → TeacherUnavailability     (CASCADE)   ✓ indisponibilités supprimées
```

**Ordre de purge requis :**
1. Réaffecter ou supprimer les Schedule liés (ou attendre Schedule.deletedAt)
2. Supprimer les WeeklySlot ou les réaffecter
3. `User.delete()` → Teacher en cascade, CourseTeacher.teacherId nullifié auto

---

### Suppression d'un Schedule

```
DELETE Schedule
  → RESTRICT ← Session.scheduleId        ❌ BLOQUÉ si session ouverte
  → RESTRICT ← Attendance.scheduleId     ❌ BLOQUÉ si présences enregistrées
  → RESTRICT ← Justification.scheduleId  ❌ BLOQUÉ si justifications pendantes
  → SET NULL → Notification.scheduleId   ✓ notifications survivent (lien perdu)
```

Schedule avec session ou présences = **insupprimable physiquement**.  
Utiliser `Schedule.deletedAt` (soft delete). Hard delete uniquement si aucune session ni présence.

---

### Suppression d'une Class

```
DELETE Class
  → RESTRICT ← Schedule.classId          ❌ BLOQUÉ si séances planifiées
  → RESTRICT ← StudentEnrollment.classId ❌ BLOQUÉ si étudiants inscrits
  → RESTRICT ← Evaluation.classId        ❌ BLOQUÉ si évaluations
  → RESTRICT ← Group.classId             ❌ BLOQUÉ si groupes actifs
  → CASCADE  → Term                      (terms supprimés)
      → SET NULL → Course.termId         ✓ cours survivent, période nullifiée
  → CASCADE  → Course                    ❌ CASCADE tenté…
      → RESTRICT ← Schedule.courseId     ❌ BLOQUÉ si séances sur ce cours
      → RESTRICT ← Evaluation.courseId   ❌ BLOQUÉ si notes
      → RESTRICT ← CourseTeacher.courseId ❌ BLOQUÉ si profs affectés
  → CASCADE  → Channel                   ✓ canaux classe supprimés
```

Une Class active (avec schedules, inscriptions, évaluations) est **impossible à supprimer**.  
Pattern recommandé : `Class.deletedAt` — la hard-delete ne s'applique qu'à une classe vide créée par erreur.

---

### Suppression d'un Course

```
DELETE Course
  → RESTRICT ← Schedule.courseId      ❌ BLOQUÉ si séances planifiées
  → RESTRICT ← Evaluation.courseId    ❌ BLOQUÉ si notes enregistrées
  → RESTRICT ← CourseTeacher.courseId ❌ BLOQUÉ si enseignants affectés
  → RESTRICT ← WeeklySlot.courseId    ❌ BLOQUÉ si présent dans grille hebdo
```

Cours avec séances ou notes = **insupprimable**. Utiliser `Course.deletedAt`.

---

### Suppression d'un Room

```
DELETE Room
  → RESTRICT ← Schedule.roomId    ❌ BLOQUÉ si séances planifiées dans la salle
  → RESTRICT ← WeeklySlot.roomId  ❌ BLOQUÉ si présente dans grille hebdo
  → RESTRICT ← QRCode.roomId      ❌ BLOQUÉ si QR codes émis
```

Une salle utilisée (passée ou future) est insupprimable.  
`Room.deletedAt` = désactivation sans casser l'historique.

---

### Suppression d'un Group

```
DELETE Group
  → RESTRICT ← Schedule.groupId    ❌ BLOQUÉ si séances de groupe planifiées
  → CASCADE  → Channel              ✓ canal groupe supprimé
  → CASCADE  → StudentGroup         ✓ affectations groupe supprimées
```

`Schedule.groupId` est RESTRICT **délibéré** : un hard delete de Group ne doit pas
silencieusement requalifier des séances de groupe en séances de classe entière
(groupId NULL = classe entière dans les contraintes GiST). Soft delete uniquement.

---

### Suppression d'un AcademicYear

```
DELETE AcademicYear
  → RESTRICT ← Class.academicYearId   ❌ BLOQUÉ si classes existent
  → RESTRICT ← OptionalUE.yearId      ❌ BLOQUÉ si choix d'UE optionnelles
```

Jamais hard-deletable en production — l'année est l'ancre de toute l'instance.

---

### Suppression d'un Department

```
DELETE Department
  → RESTRICT ← ProgramTrack.departmentId  ❌ BLOQUÉ si filières rattachées
  → SET NULL → Teacher.departmentId       ✓ profs survivent, département nullifié
  → SET NULL → UE.departmentId            ✓ UEs survivent, département nullifié
  → SET NULL → UserOrganization.departmentId ✓ appartenance survit
```

Un département sans filières peut être supprimé. Les profs et UEs perdent leur
rattachement département (champ attributif) mais restent intacts.

---

### Suppression d'une WeekRecurence

```
DELETE WeekRecurence
  → SET NULL → Schedule.weekRecurrenceId  ✓ séances survivent, lien de récurrence perdu
```

Les séances concrètes générées survivent en tant que séances autonomes.
Permet de supprimer un template de récurrence sans invalider l'historique.

---

### Suppression d'un Term (période)

```
DELETE Term
  → SET NULL → Course.termId  ✓ cours survivent hors période
```

Un cours sans période = cours hors-maquette (rattrapage, module exceptionnel).
Supprimer un Term est possible après clôture si aucune contrainte applicative ne bloque.

---

### Suppression d'une UE

```
DELETE UE
  → RESTRICT ← ProgramUE.ueId   ❌ BLOQUÉ si présente dans une maquette
  → RESTRICT ← UECourse.ueId    ❌ BLOQUÉ si matières définies
  → RESTRICT ← OptionalUE.ueId  ❌ BLOQUÉ si choisie en optionnel
```

UE ne se hard-delete que si elle n'a jamais servi.  
**Pattern projet** : `UE.deletedAt` = archivage (reste lisible, non proposée pour de nouvelles affectations).

---

### Suppression d'une Location (site géographique)

```
DELETE Location
  → SET NULL → Room.locationId     ✓ salles survivent (géofencing désactivé)
  → SET NULL → Session.locationId  ✓ sessions survivent (position de référence perdue)
```

Suppressible — les salles et sessions perdent leur ancrage géographique mais restent intactes.

---

### Suppression d'un WeeklyTemplate

```
DELETE WeeklyTemplate
  → RESTRICT ← WeeklySlot.templateId    ❌ BLOQUÉ si créneaux définis
  → RESTRICT ← WeekRecurence.templateId ❌ BLOQUÉ si récurrences actives
```

Un template en cours d'utilisation est insupprimable. Utiliser `WeeklyTemplate.deletedAt`.

---

### Suppression d'une Session

```
DELETE Session
  → CASCADE  → SessionToken  ✓ tokens rotatifs supprimés
  → SET NULL → QRScan.sessionId  ✓ scans survivent (preuve d'émargement conservée)
```

Session supprimable dès lors que le Schedule associé ne la protège plus.  
Les QRScan conservés sans sessionId restent comme preuves brutes.

---

## Suppression d'un User — chemins de propagation

### User avec profil Teacher + Schedules

```
DELETE User
  → CASCADE → Teacher deleted
      → Schedule.teacherId  (RESTRICT)
          ❌ BLOQUÉ — DB rejette si le teacher a des schedules
```

`teacherId` est `NOT NULL` + RESTRICT. Le Teacher (et donc son User) ne peut pas
être supprimé tant que des Schedule lui sont rattachés.  
**Orchestration requise** : réaffecter ou soft-supprimer les schedules en amont.

### User avec profil Student + Attendance

```
DELETE User
  → CASCADE → Student deleted
      → Attendance.studentId  (RESTRICT)
          ❌ BLOQUÉ — DB rejette si l'étudiant a des présences
```

Idem : `Attendance.studentId` RESTRICT protège l'historique de présence.  
**Orchestration requise** : vérifier / archiver avant suppression.

### User auteur de Justification

```
DELETE User
  → SET NULL → Justification.declaredById  ✓
  → SET NULL → Justification.reviewedById  ✓
```

La justification survit, les champs "qui a déclaré / qui a traité" sont nullifiés.

### User ayant scanné des QR

```
DELETE User
  → SET NULL → QRScan.userId  ✓
```

La trace de scan survit (preuve d'émargement), l'identité de l'acteur disparaît.

### Notifications

```
DELETE User
  → CASCADE → Notification deleted  (Notification.userId)
```

Les notifications appartenant à l'user sont supprimées en cascade.  
`Notification.scheduleId` → SET NULL n'intervient que si un Schedule est supprimé,
pas un User.

### Autres relations User

| Relation | onDelete | Effet |
|---|---|---|
| Admin.userId | CASCADE | profil admin supprimé |
| Teacher.userId | CASCADE | profil teacher supprimé (puis RESTRICT si schedules) |
| Student.userId | CASCADE | profil student supprimé (puis RESTRICT si attendance) |
| Parent.userId | CASCADE | profil parent supprimé |
| Direction.userId | CASCADE | profil direction supprimé |
| UserFunction.userId | CASCADE | affectations de fonctions supprimées |
| UserFunction.assignedBy | SET NULL | champ "qui a affecté" nullifié |
| ChannelMember.userId | CASCADE | memberships de canaux supprimés |
| EventParticipant.userId | CASCADE | participations aux événements supprimées |
| PushSubscription.userId | CASCADE | abonnements push supprimés |
| Message.userId | SET NULL | message survit, auteur anonymisé |
| Comment.userId | SET NULL | commentaire survit, auteur anonymisé |
| Comment.deletedBy | SET NULL | champ modérateur nullifié |
| Event.createdById | SET NULL | événement survit, créateur nullifié |
| AuditLog.userId | SET NULL | log survit, acteur anonymisé (RGPD) |
| Invitation.userId | SET NULL | invitation survit |
| ApprovalRequest.reviewedById | SET NULL | demande survit, reviewer nullifié |
| Permission.assignedById | CASCADE | permission supprimée si l'assigneur est supprimé |
| Permission.userId | SET NULL | permission survit, bénéficiaire nullifié |
| Justification.declaredById | SET NULL | voir ci-dessus |
| Justification.reviewedById | SET NULL | voir ci-dessus |
| QRScan.userId | SET NULL | voir ci-dessus |

---

## Suppression d'un Schedule — chemins de propagation

```
DELETE Schedule
  → RESTRICT ← Session.scheduleId       ❌ BLOQUÉ si session existe
  → RESTRICT ← Attendance.scheduleId    ❌ BLOQUÉ si présences existent
  → RESTRICT ← Justification.scheduleId ❌ BLOQUÉ si justifications existent
  → SET NULL → Notification.scheduleId  ✓ notifications survivent
```

Un Schedule avec session, présences ou justifications ne peut pas être supprimé
physiquement. Utiliser `deletedAt` (soft delete).

---

## Décisions onDelete complètes (migration init)

### SET NULL — champs attributifs ("qui a fait X")

| Table | Champ | Raison |
|---|---|---|
| AuditLog | userId | RGPD — log immuable, acteur anonymisé |
| AuditLog | orgId | org supprimée, logs conservés |
| Comment | userId | contenu survit, auteur anonymisé |
| Comment | deletedBy | champ de modération, non structurel |
| CourseTeacher | teacherId | affectation survit pour historique |
| Event | createdById | événement survit, créateur nullifié |
| Justification | declaredById | workflow survit, déclarant nullifié |
| Justification | reviewedById | workflow survit, reviewer nullifié |
| Message | userId | message survit ("message supprimé") |
| QRScan | userId | trace d'émargement immuable |
| QRScan | sessionId | scan survit si session supprimée |
| Invitation | userId | invitation réutilisable |
| ApprovalRequest | reviewedById | demande survit, reviewer nullifié |
| UserFunction | assignedBy | affectation survit, assigneur nullifié |
| Room | locationId | salle survit si site supprimé |
| Session | locationId | session survit si site supprimé |
| Notification | scheduleId | notif survit si séance supprimée |
| Schedule | weekRecurrenceId | séance survit si récurrence supprimée |
| Class | programId | classe survit si maquette supprimée |
| Course | termId | cours survit si période supprimée |
| Teacher | departmentId | profil survit si département supprimé |
| UE | departmentId | UE survit si département supprimé |
| UserOrganization | departmentId | appartenance survit si département supprimé |

### CASCADE — relations de composition

| Table | Champ | Raison |
|---|---|---|
| Permission | assignedById | permission sans assigneur = orpheline |
| Permission | orgId | permission hors org = sans sens |
| EventParticipant | userId | participation sans user = sans sens |
| ChannelMember | userId | membership sans user = sans sens |
| Notification | userId | notification sans destinataire = sans sens |
| OrganizationSettings | orgId | config 1-1, meurt avec l'org |
| OrganizationUsage | orgId | compteurs 1-1, meurent avec l'org |
| Function | orgId | fonction hors org = sans sens |
| UserFunction | functionId | affectation sans fonction = sans sens |
| UserFunction | userId | affectation sans user = sans sens |
| Admin / Teacher / Student / Parent / Direction | userId | profil sans compte = sans sens |
| PushSubscription | userId | abonnement sans user = sans sens |
| Channel | orgId / classId / groupId | canal sans parent = sans sens |
| ChannelMember | channelId | membership sans canal = sans sens |
| Message | channelId | message sans canal = sans sens |
| RealtimeItem | channelId | état temps réel sans canal = sans sens |
| Comment | orgId | commentaire sans org = sans sens |
| SessionToken | sessionId | token sans session = sans sens |
| StudentGroup | enrollmentId / groupId | affectation sans les deux = sans sens |
| Term | classId | période sans classe = sans sens |
| Course | classId | cours sans classe = sans sens |
| ProgramUE | programId | position maquette sans maquette = sans sens |
| TeacherUnavailability | teacherId | indisponibilité sans prof = sans sens |

### RESTRICT — gardes intentionnels

| Table | Champ | Raison |
|---|---|---|
| Schedule | teacherId | séance sans enseignant = incohérente |
| Attendance | studentId | présence sans étudiant = incohérente |
| Attendance | enrollmentId | présence sans inscription = incohérente |
| Attendance | scheduleId | présence sans séance = incohérente |
| Session | scheduleId | session sans séance = incohérente |
| Justification | scheduleId | justification sans séance = incohérente |
| Justification | studentId | justification sans étudiant = incohérente |
| ProgramUE | ueId | position maquette sans UE = incohérente |
| UECourse | ueId | matière sans UE = incohérente |
| Evaluation | studentId / courseId | note sans élève/cours = incohérente |
| ApprovalRequest | requestedById | demande sans demandeur = incohérente |
| StudentEnrollment | studentId / classId | inscription sans les deux = incohérente |
