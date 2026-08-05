# Rôle : Enseignant

## Positionnement

L'enseignant est l'acteur opérationnel central du suivi de présence. Son activité quotidienne gravite autour de la **session** (séance prise en charge). Il consulte son planning, déclare sa présence à la séance et émarger les étudiants.

---

## Besoins métier

| Besoin | Description |
|---|---|
| Planning clair | Consulter ses cours à venir et passés sans ambiguïté |
| Check-in rapide | Déclarer sa présence à une séance en quelques secondes |
| Émargement simple | Enregistrer la présence de chaque étudiant par séance |
| Historique fiable | Accéder à l'historique de ses séances et de la présence |
| Réduction administrative | Minimiser les tâches de saisie hors enseignement |

---

## Parcours utilisateurs clés

1. **Check-in à une séance** : consulter les séances du jour → sélectionner la séance → se localiser (GPS, QR salle) → valider le check-in → la session s'ouvre.
2. **Émargement en séance** : ouvrir la session active → consulter la liste des étudiants → valider les présents / marquer les absents / noter les retards → fermer la session (check-out).
3. **Consultation du planning** : accéder à la vue calendrier → filtrer par semaine → consulter le détail d'une séance.
4. **Suivi d'un cours** : accéder à la fiche cours → voir les étudiants inscrits, l'historique de présence, le planning du cours.
5. **Saisie de notes** : [non défini dans la structure de navigation enseignant — fonctionnalité couverte en base, interface non décrite dans les sources].

---

## Pages / interfaces disponibles

### Dashboard enseignant (`teacher/`)

| Élément | Détail |
|---|---|
| **Contenu** | Vue synthétique : séances du jour, prochaine séance, résumé de l'activité récente |
| **Actions** | Accéder à la séance en cours, naviguer vers les sections |

### Séances (`teacher/sessions/`)

| Élément | Détail |
|---|---|
| **Contenu** | Liste des séances du jour et à venir assignées à l'enseignant (statut : à venir, en cours — dérivé du temps —, passée, annulée, manquée) |
| **Actions** | Sélectionner une séance, initier le check-in |

### Détail d'une séance (`teacher/sessions/[sessionId]/`)

| Élément | Détail |
|---|---|
| **Contenu** | Informations de la séance (cours, salle, horaire), statut de check-in de l'enseignant (retard détecté automatiquement), liste d'émargement des étudiants avec statuts PRESENT / ABSENT / LATE / EXCUSED / PENDING |
| **Actions** | Check-in (GPS / QR / override admin), marquer les présences individuelles, fermer la session (check-out) |

### Cours enseignés (`teacher/courses/[courseId]/`)

| Élément | Détail |
|---|---|
| **Contenu** | Fiche du cours : informations générales, volume horaire prévu vs réalisé |
| **Actions** | Naviguer vers les sous-sections |

#### Étudiants du cours (`teacher/courses/[courseId]/students/`)

| Élément | Détail |
|---|---|
| **Contenu** | Liste des étudiants inscrits au cours (par classe / groupe) |
| **Actions** | Consulter la fiche étudiant |

#### Historique des présences (`teacher/courses/[courseId]/attendance/`)

| Élément | Détail |
|---|---|
| **Contenu** | Historique de présence par séance pour ce cours : taux par étudiant, séances manquées |
| **Actions** | Consulter, filtrer par période |

#### Planning du cours (`teacher/courses/[courseId]/schedule/`)

| Élément | Détail |
|---|---|
| **Contenu** | Séances planifiées pour ce cours (passées et à venir) |
| **Actions** | Consulter, [report/permutation de créneaux — backlog] |

### Planning personnel (`teacher/schedule/`)

| Élément | Détail |
|---|---|
| **Contenu** | Vue calendrier globale de l'enseignant : toutes séances de tous ses cours |
| **Actions** | Naviguer par semaine / mois, accéder au détail d'une séance |

---

## Interactions avec les autres rôles

| Interaction | Sens | Description |
|---|---|---|
| Check-in géolocalisé | Enseignant → Système | GPS vérifié contre le rayon de la salle (décision PROD-005) ; bloquant si hors rayon et `Location.active=true` |
| Override de check-in | Direction / Admin → Enseignant | La Direction peut forcer le check-in avec trace AuditLog |
| Indisponibilités | Enseignant → Planification | Signale des créneaux bloqués ; contournables par la Direction |
| Correction de note | Enseignant → Direction | Demande via `ApprovalRequest` kind `GRADE_CORRECTION` |
| QR rotatif étudiant | Étudiant → Session enseignant | L'étudiant scanne le QR de session pour s'émarginer ; l'enseignant voit le statut se mettre à jour |
