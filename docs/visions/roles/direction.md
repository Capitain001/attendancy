# Rôle : Direction

## Positionnement

La Direction est le **propriétaire de l'organisation** (décision P-01). Elle représente l'établissement sur la plateforme et dispose d'une vision globale de l'activité académique.

---

## Besoins métier

| Besoin | Description |
|---|---|
| Vision globale | Accès consolidé à l'activité académique (planning, présences, résultats) |
| Pilotage par la donnée | Rapports et statistiques fiables pour décisions éclairées |
| Traçabilité | Journal d'audit des événements importants |
| Contrôle qualité | Suivi de la régularité des enseignements |
| Gouvernance des accès | Gestion des utilisateurs et de leurs rôles |
| Validation d'exceptions | Approbation des justificatifs d'absence, corrections post-clôture |

---

## Parcours utilisateurs clés

1. **Pilotage de l'assiduité** : consulter les rapports → identifier les étudiants à risque → déclencher des alertes ou actions correctives.
2. **Validation des justificatifs** : recevoir une demande de justification → examiner les pièces → approuver ou rejeter avec commentaire → mise à jour automatique en EXCUSED.
3. **Approbation de correction de note** : recevoir la demande `GRADE_CORRECTION` d'un enseignant → vérifier → approuver (garde d'obsolescence active).
4. **Supervision du planning** : consulter le calendrier global → vérifier la couverture des cours → identifier les séances manquées ou annulées.
5. **Gestion des acteurs** : inviter des enseignants, étudiants, parents → gérer les accès et rôles.

---

## Pages / interfaces disponibles

### Dashboard direction

| Élément | Détail |
|---|---|
| **Titre** | Dashboard direction |
| **Contenu** | Vue synthétique de l'activité académique : séances du jour, taux de présence global, alertes en attente, indicateurs clés |
| **Actions** | Naviguer vers les sections détaillées |

### Structure pédagogique

#### Classes (`direction/academic/classes/`)

| Élément | Détail |
|---|---|
| **Contenu** | Liste des classes par année universitaire, filière, effectifs |
| **Actions** | Consulter le détail d'une classe, accéder aux semestres (`Term`) |

#### Filières / formations (`direction/academic/programs/`)

| Élément | Détail |
|---|---|
| **Contenu** | Maquettes pédagogiques (`Program`), filières (`ProgramTrack`), UE et matières |
| **Actions** | Consulter la structure pédagogique |

#### Départements (`direction/academic/departments/`)

| Élément | Détail |
|---|---|
| **Contenu** | Départements, responsables, enseignants rattachés, UE portées |
| **Actions** | Consulter, naviguer vers les enseignants du département |

#### Cours / matières (`direction/academic/courses/`)

| Élément | Détail |
|---|---|
| **Contenu** | Cours avec volumes horaires prévus vs réalisés, enseignants affectés |
| **Actions** | Consulter la charge prévisionnelle et réalisée par enseignant |

### Acteurs de l'organisation

#### Enseignants (`direction/people/teachers/`)

| Élément | Détail |
|---|---|
| **Contenu** | Fiche enseignant, rattachement département, cours affectés, indisponibilités |
| **Actions** | Inviter, consulter la fiche, voir le planning |

#### Étudiants (`direction/people/students/`)

| Élément | Détail |
|---|---|
| **Contenu** | Dossier étudiant, inscription en classe, groupe, taux d'assiduité, risque absentéisme |
| **Actions** | Consulter le dossier, voir l'historique de présence, accéder aux justificatifs |

#### Parents / responsables légaux (`direction/people/parents/`)

| Élément | Détail |
|---|---|
| **Contenu** | Liste des parents, liens avec les étudiants suivis |
| **Actions** | Consulter, inviter |

### Suivi des présences

#### Sessions de cours (`direction/attendance/sessions/`)

| Élément | Détail |
|---|---|
| **Contenu** | Liste des sessions avec statut (check-in enseignant, retard, fermeture), carte de présence en temps réel |
| **Actions** | Superviser en temps réel, consulter le détail d'une session |

#### Rapports (`direction/attendance/reports/`)

| Élément | Détail |
|---|---|
| **Contenu** | Statistiques d'assiduité par étudiant / classe / groupe / cours / période, scores de risque |
| **Actions** | Filtrer, exporter [non défini dans les sources] |

### Planning et ressources

#### Calendrier global (`direction/schedule/calendar/`)

| Élément | Détail |
|---|---|
| **Contenu** | Vue calendrier de toutes les séances planifiées par classe, enseignant, salle |
| **Actions** | Filtrer par axe, consulter les séances annulées / manquées |

#### Salles (`direction/schedule/rooms/`)

| Élément | Détail |
|---|---|
| **Contenu** | Référentiel salles : capacité, équipements, QR code, taux d'occupation |
| **Actions** | Consulter l'occupation |

#### Événements (`direction/schedule/events/`)

| Élément | Détail |
|---|---|
| **Contenu** | Réunions, soutenances, conférences, examens ponctuels avec statuts d'invitation |
| **Actions** | Consulter les événements ciblés par rôle |

### Évaluations (`direction/evaluation/`)

| Élément | Détail |
|---|---|
| **Contenu** | Notes par cours/UE/semestre, moyennes à la volée, bulletins |
| **Actions** | Approuver les demandes de correction post-clôture (`GRADE_CORRECTION`) |

### Administration

#### Paramètres organisation (`direction/administration/settings/`)

| Élément | Détail |
|---|---|
| **Contenu** | Configuration de l'établissement : limites, timezone, langue, seuils de risque d'absentéisme, préférences de notification, abonnement |
| **Actions** | Modifier les paramètres, gérer l'abonnement SaaS |

#### Journal d'activité (`direction/administration/audit/`)

| Élément | Détail |
|---|---|
| **Contenu** | `AuditLog` immuable : événements horodatés, acteurs, snapshots |
| **Actions** | Filtrer, consulter le détail d'un événement |

---

## Interactions avec les autres rôles

| Interaction | Sens | Description |
|---|---|---|
| Justificatifs d'absence | Étudiant / Parent → Direction | La Direction approuve ou rejette |
| Correction de note | Enseignant → Direction | La Direction approuve la demande `GRADE_CORRECTION` |
| Override check-in | Direction → Enseignant | La Direction peut forcer un check-in hors géofencing (tracé AuditLog) |
| Indisponibilités enseignant | Enseignant → Direction (signal) | Contournables par la Direction avec trace |
| Clôture de période | Direction → Tous | `Term.lockedAt` fige les notes pour toute la classe |
| Invitation utilisateurs | Direction → Enseignant / Étudiant / Parent | Tokens d'invitation par email |
