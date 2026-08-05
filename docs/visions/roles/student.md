# Rôle : Étudiant

## Positionnement

L'étudiant est un acteur **en consultation** de son parcours académique. Son point d'entrée principal est le cours et l'inscription — la session lui est accessible uniquement quand un cours est en séance. Il émarger via QR rotatif.

---

## Besoins métier

| Besoin | Description |
|---|---|
| Planning lisible | Consulter facilement son emploi du temps par cours |
| Émargement simple | S'émarginer rapidement via QR pendant la séance |
| Suivi d'assiduité | Voir son taux de présence par cours et global |
| Transparence | Comprendre son historique de présence (présent, absent, excusé) |
| Résultats accessibles | Consulter ses notes et moyennes par cours et par semestre |
| Justifier les absences | Déposer une justification avant ou après une séance |

---

## Parcours utilisateurs clés

1. **Émargement en séance** : recevoir notification de séance ouverte → accéder à la session en cours → scanner le QR rotatif (token valable 15 min) → confirmation d'émargement.
2. **Consultation du planning** : accéder à la vue planning → naviguer par semaine → consulter le détail d'une séance planifiée.
3. **Suivi de son assiduité** : accéder à la page d'historique → consulter les statuts par séance (PRESENT / ABSENT / LATE / EXCUSED) → identifier les cours à risque.
4. **Consultation d'un cours** : sélectionner un cours → voir le planning du cours, ses résultats, son historique de présence pour ce cours.
5. **Justifier une absence** : accéder à l'historique de présence → sélectionner une séance absente → déposer un justificatif (motif + pièce jointe optionnelle) → statut `PENDING` → la Direction approuve ou rejette avec commentaire → statut devient `APPROVED` ou `REJECTED`.

---

## Pages / interfaces disponibles

### Dashboard étudiant (`student/`)

| Élément | Détail |
|---|---|
| **Contenu** | Vue synthétique : prochain cours, cours du jour, indicateur de taux d'assiduité global |
| **Actions** | Accéder à la session en cours (si active), naviguer vers les sections |

### Session en cours (`student/sessions/[sessionId]/`)

| Élément | Détail |
|---|---|
| **Contenu** | Informations de la séance active (cours, salle, enseignant, horaire), QR rotatif d'émargement (token 15 min, rotation automatique) |
| **Actions** | Scanner le QR pour s'émarginer → confirmation PRESENT enregistrée |

> Seules les sessions actuellement actives sont accessibles par cet écran. L'étudiant ne navigue pas librement vers des sessions passées ou futures via cette route.

### Détail d'un cours (`student/courses/[courseId]/`)

| Élément | Détail |
|---|---|
| **Contenu** | Fiche cours : intitulé, UE, crédits, enseignant(s), volume horaire |
| **Actions** | Naviguer vers les sous-sections |

#### Planning du cours (`student/courses/[courseId]/schedule/`)

| Élément | Détail |
|---|---|
| **Contenu** | Séances planifiées du cours (passées et à venir) avec statuts |
| **Actions** | Consulter, [lien vers la session active si en cours] |

#### Résultats du cours (`student/courses/[courseId]/evaluation/`)

| Élément | Détail |
|---|---|
| **Contenu** | Notes par type d'évaluation (devoir, examen, participation, projet), barème, appréciations, moyenne calculée à la volée |
| **Actions** | Consulter uniquement — les notes sont immuables après saisie |

### Planning global (`student/schedule/`)

| Élément | Détail |
|---|---|
| **Contenu** | Vue calendrier de toutes les séances de l'étudiant sur l'ensemble de ses cours et groupes |
| **Actions** | Naviguer par semaine / mois, accéder à la session active |

### Historique de présence (`student/attendance/`)

| Élément | Détail |
|---|---|
| **Contenu** | Historique global de présence : toutes séances de tous les cours, statuts (PRESENT / ABSENT / LATE / EXCUSED / PENDING), taux par cours, indicateurs de risque |
| **Actions** | Filtrer par cours / période, consulter le détail d'une séance, accéder au dépôt de justificatif pour les séances ABSENT |

### Justificatif d'absence (`student/attendance/[attendanceId]/justify/`)

| Élément | Détail |
|---|---|
| **Contenu** | Détail de la séance concernée (cours, date, horaire, statut actuel), formulaire de justification, historique du justificatif si déjà déposé (statut, commentaire direction) |
| **Actions** | Saisir le motif, joindre une pièce jointe (optionnel), soumettre → statut passe à `PENDING` ; si rejeté, l'étudiant peut soumettre à nouveau |

> Accessible uniquement pour les séances au statut `ABSENT`. Une séance `EXCUSED` (justificatif approuvé) est en lecture seule.

---

## Interactions avec les autres rôles

| Interaction | Sens | Description |
|---|---|---|
| Émargement QR | Étudiant → Session (Enseignant) | L'étudiant scanne le QR rotatif pour confirmer sa présence ; l'enseignant voit la mise à jour en temps réel |
| Justificatif d'absence | Étudiant → Direction | Dépôt avant ou après séance ; workflow PENDING → APPROVED / REJECTED avec commentaire direction |
| Résultats | Enseignant (saisie) → Étudiant (lecture) | Les notes saisies par l'enseignant sont visibles par l'étudiant après saisie |
| Planification | Admin / Direction → Étudiant | Les séances planifiées et les modifications de planning déclenchent des notifications |
| Choix d'options | Étudiant → Structure académique | Choix d'UE optionnelles (`OptionalUE`) par année |
