# Attendancy — Fonctionnalités couvertes par le socle

> **Référence** : schema Prisma modulaire (`prisma/schemas/`) + couche SQL (`prisma/post-migrate/`) + patterns applicatifs actés.
> **Légende** : ✅ = données + garanties en place (service existant ou trivial) · 🔧 = schema complet, service à écrire.
> Document de couverture au démarrage — les exclusions assumées sont en fin.

---

## 1. Socle multi-tenant & Gouvernance

- ✅ Multi-établissements (Organization racine de scope, `orgId` sur toutes les données métier, dénormalisé sur les tables chaudes)
- ✅ Un utilisateur appartient à plusieurs établissements, avec un profil par rôle ET par organisation (Teacher/Student/Parent/Direction scopés org)
- ✅ Rôles principaux + statut d'appartenance par org (`UserOrganization.role/status` — couper l'accès à une org sans toucher au compte)
- ✅ Permissions fines (RBAC) : `Function` (groupes de permissions nommés), `Permission` atomique par action/ressource, portée user OU fonction, permissions larges (resource/resourceId null) avec unicité garantie en base (`NULLS NOT DISTINCT`)
- ✅ Invitations par email : token secret applicatif, expiration, payload par rôle (`details Json` — liens à créer à l'acceptation), types DIRECT_CREATE / INVITE_ONLY / STUDENT
- ✅ Journalisation immuable (`AuditLog` sans cascade, `resource` en String ouvert aux modules futurs, snapshot acteur dans `details`)
- ✅ Documents polymorphiques rattachés à toute ressource métier (`Document` : storage privé path relatif, type métier, corbeille avant purge storage)
- ✅ Workflow d'approbation générique (`ApprovalRequest` : pattern command différé, `changes {from,to}` avec garde d'obsolescence, registre applicatif par `kind`)
- ✅ Quotas et configuration par établissement (`OrganizationSettings` : limites users/salles/classes/storage, timezone, langue, préférences de notification ; `OrganizationUsage` : compteurs)
- ✅ Abonnement SaaS (`billing.Plan` / `billing.Subscription` : essai, statuts, activation de modules et limites via `Plan.features Json`)
- ✅ Back-office plateforme (SuperAdmin hors tenant)
- 🔧 Analytics produit / session replay / error tracking : externalisés (PostHog), distincts de l'AuditLog

## 2. Référentiels académiques

- ✅ Années universitaires (bornes, année courante/active, unique par org)
- ✅ Composantes : départements (rattachement UE, filières, enseignants, responsables)
- ✅ Filières (`ProgramTrack`) et maquettes pédagogiques (`Program`) — structurelles, réutilisées année après année sur n classes
- ✅ UE et matières (`UE` / `UECourse`) : codes uniques par établissement, crédits, volumes horaires prévus, ordre pédagogique
- ✅ Position des UE dans la maquette par semestre structurel (`ProgramUE.semester` + ordre), UE obligatoires/optionnelles
- ✅ Choix d'options par étudiant et par année (`OptionalUE`)
- ✅ Archivage d'UE sans casser l'historique (convention `deletedAt` = archivage ; FK `Restrict` ; blocage de nouvelle utilisation côté service)
- ✅ Niveaux L1 → Doctorat (`Level`)
- ✅ Classes/promotions par année et filière (unicité réelle par filière+nom+année)
- ✅ Semestres datés PAR CLASSE (`Term` : générés à l'application d'un programme, bornés par la direction, clôture `lockedAt` au rythme de chaque jury)
- ✅ Groupes TD/TP par classe, affectation par inscription avec invariant garanti en base (le groupe appartient à la classe de l'inscription — trigger)

## 3. Salles & sites

- ✅ Référentiel salles par établissement (capacité, équipements, unicité du nom par org, désactivation sans perte d'historique)
- ✅ Sites/campus géolocalisés (`Location` : adresse, position PostGIS, rayon de géofencing, activation/désactivation du contrôle)
- ✅ QR statique par salle (`QRCode` : actif, expiration)
- ✅ Occupation des salles : dérivable des Schedules (données + index en place) — 🔧 tableau de bord taux d'occupation

## 4. Enseignants

- ✅ Enseignants par établissement, rattachement département, fiche via profil + User
- ✅ Affectation aux cours avec charge (`CourseTeacher` : heures confiées, enseignant principal, co-enseignement)
- ✅ Indisponibilités individuelles (`TeacherUnavailability` : récurrentes hebdo ou plages de dates, motif) — signalées à la planification, contournables par la direction avec trace AuditLog, jamais bloquantes
- ✅ Filtre "enseignants disponibles pour un créneau" en une requête (occupation Schedule + indisponibilités)
- ✅ Réintégration d'un enseignant parti sans perte d'historique (pattern restore)
- ✅ Charges prévisionnelles vs réalisées : `CourseTeacher.hours` (confié) + `Course.durationDone/durationTotal` (réalisé/prévu) — 🔧 rapport de service

## 5. Étudiants & Inscriptions

- ✅ Étudiants par établissement (profil scopé org, dossier de base via User : identité, contact, photo)
- ✅ Inscription annuelle en classe (`StudentEnrollment`, unique par étudiant+classe) avec départ en cours d'année tracé (`endedAt`) sans casser l'historique
- ✅ Protection de l'historique : une inscription avec présences enregistrées est insupprimable (Restrict en base)
- ✅ Affectation aux groupes TD/TP (via l'inscription, invariant DB)
- ✅ Liens parents-étudiants (`ParentRelation` : nature du lien, délien tracé AuditLog)
- ✅ Documents étudiants via `Document` (certificats, photos, pièces)
- 🔧 Import CSV/Excel des listes (capacité technique — pipeline Rust/NAPI-RS déjà utilisé pour le parsing CSV)

## 6. Planification

- ✅ Anti-conflit garanti EN BASE, même en écriture concurrente : 4 contraintes d'exclusion GiST (salle, enseignant, classe entière, groupe) — les groupes d'une même classe peuvent avoir cours en parallèle, une séance annulée/manquée libère la ressource
- ✅ Détection préalable des conflits côté application (`checkConflicts` dry-run par savepoint) pour le signalement et le guidage avant enregistrement
- ✅ Semaines types réutilisables (`WeeklyTemplate` + `WeeklySlot` : jour, plage, cours, enseignant, salle)
- ✅ Génération récurrente sur une période (`WeekRecurence` : intervalle, dates exclues pour fériés/vacances)
- ✅ Séances ponctuelles et exceptions : création manuelle, annulation (CANCELED), séance non tenue (MISSED), verrou des séances passées (seuls les PENDING sont modifiables — trigger)
- ✅ Statut "en cours" dérivé du temps côté UI (jamais persisté — zéro état à maintenir)
- ✅ Notification de création de planning avec état d'envoi (`notifyState` PENDING/SENT)
- ✅ Événements hors cours (réunions, soutenances, conférences, examens ponctuels) : `Event` ciblé par rôles et/ou participants explicites, statuts d'invitation
- ✅ Historique complet des modifications de planning (AuditLog)
- ✅ Consultation par classe, groupe, enseignant, salle, cours (FK + index dédiés pour chaque axe)
- 🔧 Report/permutation guidés de créneaux (les données et le verrou existent ; UX de déplacement à écrire)
- 🔧 Export PDF / iCal des emplois du temps (pipeline PDF Rust déjà en place)

## 7. Présence & Émargement

- ✅ Check-in enseignant atomique et vérifié : GPS (géofencing PostGIS `verify_point_in_radius`), QR, override admin, WiFi, reconnaissance faciale (méthodes prévues par enum) — transaction unique en base (`teacher_check_in`)
- ✅ Retard enseignant détecté automatiquement (`Session.isLate`)
- ✅ Session de cours 1-1 avec la séance : check-out, durée, fermeture automatique tracée (`endedAutomatically`) — 🔧 cron de fermeture des sessions oubliées
- ✅ Émargement étudiant par QR rotatif (jeton 15 min, rotation atomique en base, un seul token actif) et par QR de salle
- ✅ Preuve d'émargement en cas de litige (`QRScan` : journal brut immuable — IP, user-agent, horodatage)
- ✅ Pointage par séance avec statuts PRESENT / ABSENT / LATE / EXCUSED / PENDING, un enregistrement unique par étudiant et par séance
- ✅ Faits de présence immuables : corrections par UPDATE tracé AuditLog, jamais de suppression
- ✅ Justificatifs d'absence — workflow complet (`Justification`) : déclaration AVANT la séance (parent/étudiant/guichet) ou justification a posteriori, statuts PENDING/APPROVED/REJECTED/CANCELED, revue par la direction avec commentaire, pièces jointes multiples via Document ; approbation = passage/création automatique en EXCUSED
- ✅ Supervision temps réel : vue SQL carte de présence (positions prof, périmètre salle, points étudiants, compteurs)
- ✅ Statistiques d'assiduité à la volée par étudiant / classe / groupe / cours / période (index dédiés, `orgId` dénormalisé pour les requêtes établissement)
- ✅ Analytics de risque étudiant (`computeCourseRisk` / `computeGlobalRisk`, seuils configurables par établissement via `RiskConfig` ← `OrganizationSettings.settings`)
- 🔧 Alertes de seuils d'absentéisme (données + config + Notification en place ; règle de déclenchement à écrire)

## 8. Évaluations & Périodes

- ✅ Saisie des notes par type (devoir, examen, participation, projet), barème par évaluation (`maxScore`), appréciations
- ✅ Faits immuables : correction par UPDATE tracé, pas de suppression
- ✅ Bulletin par semestre : partitionnement structurel (Course → UE → semestre de maquette), en-têtes datés via `Term`
- ✅ Moyennes, totaux crédits : calculés à la volée (jamais stockés)
- ✅ Clôture de période après délibération (`Term.lockedAt`) — par classe, au rythme réel de chaque jury ; notes figées (garde applicative)
- ✅ Correction post-clôture par procédure exceptionnelle tracée (`ApprovalRequest` kind `GRADE_CORRECTION` : demande du prof, approbation direction, application avec garde d'obsolescence)

## 9. Communication

- ✅ Canaux auto-provisionnés en base : channel d'établissement, de classe, de groupe — créés et peuplés automatiquement aux inscriptions (triggers), y compris DM
- ✅ Messagerie par canal : fils de réponses, suppression douce (un message supprimé ne troue pas les fils), curseur de lecture par membre (badges non-lus)
- ✅ Éléments temps réel partagés par canal (`RealtimeItem`)
- ✅ Commentaires polymorphiques sur toute ressource métier, avec fils et modération tracée (suppresseur distinct de l'auteur)
- ✅ Notifications in-app typées (absence, changement de planning, résultats, messages, invitations) liées à la séance concernée
- ✅ Web Push par appareil (`PushSubscription`)
- ✅ Préférences de notification par établissement (Json `OrganizationSettings`) — 🔧 envoi email/SMS via services externes

## 10. Transverse

- ✅ Erreurs métier normalisées de bout en bout (`{ data } / { error }`, mapping contraintes DB → messages utilisateur via `CONSTRAINT_ERROR`)
- ✅ Couche SQL hors-Prisma modulaire, idempotente et vérifiable (`post-migrate/` par domaine + `verify.sql` diagnostic)
- ✅ Schema Prisma modulaire par domaine, documenté (conventions soft-delete par table, structure vs instance, gardes applicatives)
- ✅ Tâches CPU-intensives en Rust natif (QR, CSV, PDF — NAPI-RS)

---

## Exclusions et reports assumés

| Élément | Statut |
|---|---|
| Émargement par signature | ❌ Exclu du workflow (décision) |
| Finance / frais de scolarité | ❌ Hors périmètre (module dédié futur si besoin) |
| Paie, contrats, RH | ❌ Hors périmètre |
| Cantine, internat, transport, bibliothèque | ❌ Hors périmètre |
| Pointage hors séance planifiée | ❌ Hors périmètre (le pointage est par séance) |
| Calendrier universitaire structuré (fériés/vacances → exclusions auto de génération) | 📋 Backlog (`CalendarEvent` conçu, non intégré — `excludedDates` manuel en attendant) |
| Indisponibilités des salles (maintenance, fermeture) | 📋 Backlog (jumeau de `TeacherUnavailability`) |
| Habilitations enseignants (matières autorisées) | 📋 Backlog |
| Mode brouillon / publication du planning avec validation | 📋 Backlog |
| Séance sans salle affectée (avec alerte) | 📋 Backlog (`roomId` obligatoire aujourd'hui) |
| Moyennes/rangs/ECTS stockés | ⚠️ Volontairement à la volée, jamais stockés |
| Détection de conflits | ⚠️ Applicative POUR L'UX **+** garantie en base (contraintes d'exclusion) — les deux, par conception |