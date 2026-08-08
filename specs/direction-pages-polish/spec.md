# Feature Specification: Polish & Conception pages Direction restantes

**Feature Branch**: `direction-pages-polish`
**Input**: `docs/features/features2.md` + `docs/visions/roles/direction.md`

---

## Context and Understanding

L'espace Direction est le coeur de la plateforme pour le propriétaire de l'organisation.
La navigation est complète (tous les liens existent dans `navigation.ts`) mais plusieurs
pages sont soit des stubs vides ("en cours de développement") soit incomplètes par rapport
à la vision produit définie dans `docs/visions/roles/direction.md`.

**Ce qui est fonctionnel aujourd'hui :**
- Dashboard (métriques quotidiennes, alertes, widget sessions)
- Structure académique : Classes (liste + détail + groupes), Programmes, Filières, Départements, Années, UEs + détail
- Planning : Calendrier global, Salles
- Invitations, Paramètres, Journal d'audit, Référentiel MESRS

**Ce qui est manquant ou insuffisant :**
- Sessions de cours : page dédiée réduite au widget dashboard sans liste/filtre/détail
- Rapports d'assiduité : affiche uniquement les absences du jour, sans filtres temporels ni agrégations
- Parents/responsables légaux : stub vide
- Événements : stub vide
- Évaluations : stub vide
- Fonctions direction : lien présent dans la nav, aucune page
- Fiche détail enseignant : liste existante mais pas de page `[teacherId]/`
- Fiche détail étudiant : liste par classe existante mais pas de page `[studentId]/`

---

## Feature Description

Polishment et conception des pages Direction restantes pour atteindre une cohérence
fonctionnelle minimale sur l'ensemble de l'espace Direction.

L'objectif n'est pas la feature-completeness totale mais d'avoir **une page réelle**
(pas un stub vide) pour chaque entrée de navigation. Chaque page doit afficher des
données authentiques, permettre la navigation contextuelle et offrir les actions
de base définies par la vision.

---

## Requirements

### Proposed solution

- **US-001 (P1)** — Sessions de cours : liste dédiée avec statuts, filtres et supervision temps réel
- **US-002 (P1)** — Rapports d'assiduité : filtres période/classe + agrégats + scores de risque
- **US-003 (P2)** — Fiche détail enseignant : rattachement, cours affectés, planning, indisponibilités
- **US-004 (P2)** — Fiche détail étudiant : inscription, groupe, taux d'assiduité, justificatifs
- **US-005 (P3)** — Parents/responsables légaux : liste avec liens vers les étudiants suivis
- **US-006 (P3)** — Fonctions direction : liste des fonctions de l'organisation + gestion CRUD
- **US-007 (P4)** — Événements : liste avec types (réunion, examen, soutenance) et statuts invitation
- **US-008 (P4)** — Évaluations : vue globale notes par cours/UE/semestre + demandes de correction

### Functional Requirements

**US-001 — Sessions de cours**
- **FR-001** : La page doit afficher la liste des sessions du jour avec statut check-in (en attente, ouvert, en retard, fermé)
- **FR-002** : La Direction doit pouvoir filtrer les sessions par classe et par plage de dates
- **FR-003** : La Direction doit voir en temps réel l'état de check-in de l'enseignant et le taux de présence étudiant par session
- **FR-004** : Un clic sur une session doit afficher le détail (enseignant, salle, étudiants présents/absents)

**US-002 — Rapports d'assiduité**
- **FR-005** : La page doit permettre de filtrer les absences par période (aujourd'hui, semaine, mois, terme)
- **FR-006** : La Direction doit voir les absences agrégées par étudiant (nombre total, taux, score de risque)
- **FR-007** : La Direction doit pouvoir filtrer par classe et par cours
- **FR-008** : Les étudiants à risque élevé doivent être visuellement mis en avant (badge ou indicateur coloré)

**US-003 — Fiche détail enseignant**
- **FR-009** : La page `[teacherId]/` doit afficher l'identité, le département rattaché et les cours affectés
- **FR-010** : La Direction doit voir le planning de l'enseignant (séances passées et à venir)
- **FR-011** : La Direction doit voir les indisponibilités déclarées
- **FR-012** : La liste des enseignants doit être cliquable pour naviguer vers la fiche détail

**US-004 — Fiche détail étudiant**
- **FR-013** : La page `[studentId]/` doit afficher l'identité, la classe, le groupe d'inscription
- **FR-014** : La Direction doit voir l'historique de présence de l'étudiant par cours
- **FR-015** : La Direction doit voir les justificatifs d'absence soumis (PENDING / APPROVED / REJECTED)
- **FR-016** : La Direction doit pouvoir approuver ou rejeter un justificatif directement depuis la fiche
- **FR-017** : La liste des étudiants doit être cliquable pour naviguer vers la fiche détail

**US-005 — Parents/responsables légaux**
- **FR-018** : La page doit lister les parents avec leurs liens vers les étudiants suivis
- **FR-019** : La Direction doit pouvoir inviter un parent via email

**US-006 — Fonctions direction**
- **FR-020** : La page `direction/functions/` doit afficher les fonctions (titres/postes) de l'organisation
- **FR-021** : La Direction doit pouvoir créer, renommer et supprimer des fonctions

**US-007 — Événements**
- **FR-022** : La page doit lister les événements (réunions, soutenances, examens ponctuels)
- **FR-023** : La Direction doit voir les statuts d'invitation des participants
- **FR-024** : La Direction doit pouvoir créer un événement et y inviter des participants

**US-008 — Évaluations**
- **FR-025** : La page doit afficher les résultats par cours/UE filtrés par terme et classe
- **FR-026** : La Direction doit voir les demandes de correction de note en attente (`GRADE_CORRECTION`)
- **FR-027** : La Direction doit pouvoir approuver ou rejeter une demande de correction

---

## Success Criteria

- **SC-001** : Aucune entrée de navigation Direction ne pointe vers un stub vide — chaque page affiche des données réelles
- **SC-002** : La Direction peut accéder à la fiche d'un enseignant ou d'un étudiant en 2 clics depuis la liste
- **SC-003** : La page Sessions affiche le statut check-in de chaque séance du jour sans rechargement manuel
- **SC-004** : La page Rapports permet de filtrer les absences par période et d'identifier visuellement les étudiants à risque
- **SC-005** : La Direction peut valider ou rejeter un justificatif d'absence depuis la fiche étudiant

---

## Clarification Needed

1. **Sessions — niveau de détail de la supervision temps réel**
   La vision mentionne une "carte de présence en temps réel". Est-ce :
   A) Un simple compteur présents/absents sur la fiche session (recommandé pour MVP)
   B) Un feed temps réel avec mise à jour automatique (Supabase Realtime)
   C) Consultation en lecture seule avec rechargement manuel

2. **Rapports — export**
   La vision mentionne "exporter [non défini dans les sources]". Faut-il inclure :
   A) Aucun export pour ce sprint (recommandé)
   B) Export CSV côté client
   C) Export PDF généré côté serveur

3. **Évaluations — périmètre pour ce sprint**
   Les évaluations impliquent des notes saisies par les enseignants. Le service `evaluation`
   existe-t-il déjà côté base ? Ou faut-il :
   A) Page de consultation uniquement si les données existent déjà (recommandé)
   B) Inclure la gestion des évaluations complète
   C) Déplacer US-008 hors périmètre de ce sprint

4. **Priorité MVP de ce sprint**
   Quel sous-ensemble livrer en premier ?
   A) US-001 + US-002 + US-003 + US-004 (supervision + fiches) — recommandé
   B) Toutes les US sauf US-008 (évaluations)
   C) Uniquement les pages stubs → pages réelles (US-005 + US-006 + US-007 + US-001)

---

## Notes

### Workflow et outils à embarquer dans le plan

Contraintes CLAUDE.md à intégrer dans chaque tâche du plan :

**Avant de toucher un service existant :**
```bash
# Lecture rapide des fonctions exposées
cat apps/web/summary/<service>.json
cat apps/web/src/services/<service>/.api/index.json
```

**Après chaque session sur un service :**
```bash
cd apps/web
bun run check:naming:svc -- <service>
bun run check:types:svc -- <service>
bun run generate:api:svc -- <service>
bun run api:check
```

**Services concernés par cette feature :**
| US | Service(s) owner |
|---|---|
| US-001 Sessions | `session`, `schedule`, `attendance` |
| US-002 Rapports | `attendance`, `student` |
| US-003 Enseignants | `teacher`, `course-teacher`, `schedule`, `teacher-unavailability` |
| US-004 Étudiants | `student`, `attendance`, `justification` (à vérifier) |
| US-005 Parents | `student` (ParentRelation) |
| US-006 Fonctions | `function` |
| US-007 Événements | `event` |
| US-008 Évaluations | `evaluation` (à vérifier existence) |

**Patterns clés :**
- Pages RSC → `await connection()` obligatoire (PPR actif)
- Types UI → `GetXxxDto[number]` depuis `@/services/<service>` (jamais écrit à la main)
- Composants clients → toujours via hook `hooks/data/<domain>/`
- ActionResponse narrowing → `if ('error' in result)`
- Pas de `list*`, toujours `get*`
