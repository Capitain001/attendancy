app/
└── [slug]/

    # ─────────────────────────────────────────────
    # Direction : pilotage global de l'organisation
    # Accès aux données académiques, humaines et opérationnelles
    # ─────────────────────────────────────────────
    └── direction/
        ├── page.tsx                     # Dashboard direction

        # Structure pédagogique
        ├── academic/
             program-track
        │   ├── classes/                 # Gestion des classes
        │   ├── programs/                # Filières / formations
        │   ├── departments/             # Départements
        │   └── courses/                 # Cours / matières
            

        # Acteurs de l'organisation
        ├── people/
        │   ├── teachers/                # Personnel enseignant
        │   ├── students/                # Étudiants
        │   └── parents/                 # Responsables légaux

        # Suivi des présences
        ├── attendance/
        │   ├── sessions/                # Sessions de cours
        │   └── reports/                 # Rapports et statistiques

        # Organisation temporelle et ressources
        ├── schedule/
        │   ├── calendar/                # Vue calendrier globale
        │   ├── rooms/                   # Gestion des salles
        │   └── events/                  # Événements

        # Suivi académique
        ├── evaluation/                  # Évaluations et résultats

        # Configuration organisation
        └── administration/
            ├── settings/                # Paramètres organisation
            └── audit/                   # Journal d'activité



    # ─────────────────────────────────────────────
    # Teacher : gestion des enseignements
    # Point central = Session (activité quotidienne)
    # ─────────────────────────────────────────────
    └── teacher/
        ├── page.tsx                     # Dashboard enseignant

        # Gestion des séances
        # Consultation et suivi des séances prises en charge
        ├── sessions/
        │   ├── page.tsx                 # Séances du jour / prochaines séances
        │   └── [sessionId]/
        │       └── page.tsx              # Détail et suivi d'une séance

        # Référentiel pédagogique
        # Cours enseignés et informations associées
        ├── courses/
        │   └── [courseId]/
        │       ├── page.tsx              # Informations du cours
        │       ├── students/             # Étudiants inscrits
        │       ├── attendance/            # Historique des présences du cours
        │       └── schedule/             # Planning du cours

        # Vue globale personnelle
        └── schedule/
            └── page.tsx                 # Planning enseignant



    # ─────────────────────────────────────────────
    # Student : consultation du parcours académique
    # Point central = Course / Enrollment
    # Session uniquement pour le cours en cours
    # ─────────────────────────────────────────────
    └── student/
        ├── page.tsx                     # Dashboard étudiant

        # Session active uniquement
        # Accès au cours actuellement en séance
        ├── sessions/
        │   └── [sessionId]/
        │       └── page.tsx              # Session en cours

        # Parcours académique
        # Consultation des cours suivis
        ├── courses/
        │   └── [courseId]/
        │       ├── page.tsx              # Détail du cours
        │       ├── schedule/             # Planning du cours
        │       └── evaluation/           # Résultats du cours

        # Vue personnelle globale
        ├── schedule/
        │   └── page.tsx                 # Planning complet

        └── attendance/
            └── page.tsx                 # Historique global de présence



    # ─────────────────────────────────────────────
    # Parent : suivi des enfants
    # Point central = Student suivi
    # ─────────────────────────────────────────────
    └── parent/
        ├── page.tsx                     # Dashboard parent

        # Chaque enfant possède son propre contexte
        └── children/
            └── [studentId]/
                ├── attendance/           # Présence de l'enfant
                ├── schedule/             # Planning de l'enfant
                ├── evaluation/           # Résultats scolaires
                ├── documents/            # Documents liés
                └── messages/             # Communication