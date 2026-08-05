# Architecture de navigation globale

## Structure de l'URL

```
/{slug}/          ← Organisation (tenant)
  direction/      ← Espace Direction
  teacher/        ← Espace Enseignant
  student/        ← Espace Étudiant
  parent/         ← Espace Parent
```

L'`{slug}` identifie l'organisation. Un même compte utilisateur peut basculer entre plusieurs slugs (plusieurs établissements).

---

## Arbre de navigation par rôle

### Direction

```
/{slug}/direction/
├── (dashboard)                        # Vue d'ensemble
├── academic/
│   ├── classes/                       # Classes et promotions
│   ├── programs/                      # Filières et maquettes pédagogiques
│   ├── departments/                   # Départements
│   └── courses/                       # Cours et matières
├── people/
│   ├── teachers/                      # Enseignants
│   ├── students/                      # Étudiants
│   └── parents/                       # Responsables légaux
├── attendance/
│   ├── sessions/                      # Sessions de cours (supervision)
│   └── reports/                       # Rapports d'assiduité
├── schedule/
│   ├── calendar/                      # Calendrier global
│   ├── rooms/                         # Salles
│   └── events/                        # Événements
├── evaluation/                        # Évaluations et résultats
└── administration/
    ├── settings/                      # Paramètres de l'organisation
    └── audit/                         # Journal d'activité
```

### Enseignant

```
/{slug}/teacher/
├── (dashboard)                        # Séances du jour + résumé
├── sessions/
│   ├── (liste)                        # Séances du jour / à venir
│   └── [sessionId]/                   # Détail : check-in + émargement
└── courses/
│   └── [courseId]/
│       ├── (info)                     # Fiche cours
│       ├── students/                  # Étudiants inscrits
│       ├── attendance/                # Historique de présence
│       └── schedule/                  # Planning du cours
└── schedule/                          # Planning personnel global
```

### Étudiant

```
/{slug}/student/
├── (dashboard)                        # Prochain cours + indicateur assiduité
├── sessions/
│   └── [sessionId]/                   # Session en cours uniquement (QR émargement)
├── courses/
│   └── [courseId]/
│       ├── (info)                     # Fiche cours
│       ├── schedule/                  # Planning du cours
│       └── evaluation/                # Résultats
├── schedule/                          # Planning complet
└── attendance/                        # Historique global de présence
```

### Parent

```
/{slug}/parent/
├── (dashboard)                        # Vue sur les enfants suivis
└── children/
    └── [studentId]/
        ├── attendance/                # Présence de l'enfant
        ├── schedule/                  # Planning de l'enfant
        ├── evaluation/                # Résultats scolaires
        ├── documents/                 # Documents liés
        └── messages/                  # Communication
```

---

## Comment les interfaces s'articulent

### Pivot central : la Séance (Schedule)

```
Admin/Direction → crée les séances planifiées
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   Planning Direction  Planning Enseignant  Planning Étudiant/Parent
          │               │
          │       Enseignant → check-in → Session ouverte
          │                                    │
          │                          Étudiant → QR émargement
          │                                    │
          └──────── Rapport de présence ────────┘
                          │
                   Direction → rapports, alertes, justificatifs
```

### Flux justificatif d'absence

```
Étudiant / Parent → dépose Justification (PENDING)
                              │
                     Direction → examine → APPROVED / REJECTED
                              │
                    Si APPROVED → statut étudiant = EXCUSED (auto)
```

### Flux correction de note post-clôture

```
Enseignant → soumet ApprovalRequest (GRADE_CORRECTION)
                              │
                     Direction → examine → approuve
                              │
                    Application avec garde d'obsolescence
```

---

## Points d'entrée et flux entre pages

| Point d'entrée | Destination | Déclencheur |
|---|---|---|
| Dashboard direction → séance | `direction/attendance/sessions/` | Alerte session ouverte ou en retard |
| Dashboard enseignant → séance du jour | `teacher/sessions/[id]/` | Clic sur séance active |
| Dashboard étudiant → session en cours | `student/sessions/[id]/` | Cours actuellement en séance |
| Planning enseignant → cours | `teacher/courses/[id]/` | Clic sur une séance dans le calendrier |
| Planning étudiant → cours | `student/courses/[id]/schedule/` | Clic sur une séance |
| Rapport direction → fiche étudiant | `direction/people/students/[id]/` | Clic sur un étudiant à risque |
| Fiche étudiant → historique présence | [sous-page de la fiche] | Navigation dans le dossier |
| Parent → enfant | `parent/children/[studentId]/` | Sélection de l'enfant depuis le dashboard |

---

## Règles de navigation transverses

- **Séances passées** : immuables — aucune modification possible côté enseignant ou étudiant ; corrections tracées uniquement par la Direction / Admin.
- **Session active** : l'état "en cours" est **dérivé du temps** côté UI, jamais persisté — un rechargement recalcule le statut.
- **Accès multi-org** : le slug dans l'URL est le sélecteur d'organisation. Un utilisateur multi-établissements change de contexte en changeant de slug.
- **Clôture de semestre** : après `Term.lockedAt`, les pages d'évaluation passent en lecture seule pour tous les rôles sauf correction exceptionnelle approuvée.
