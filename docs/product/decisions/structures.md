context/
│
├── product.yaml               # Vision + règles métier
│
├── decisions/
│   ├── product.yaml           # Décisions produit ACTÉES
│   ├── architecture.yaml      # Décisions techniques ACTÉES
│   ├── pending.yaml           # Questions / arbitrages
│   └── legacy.yaml            # Anciennes décisions à réévaluer
│
└── services/


1. product-decisions.yaml

Uniquement les décisions validées.

name: product-decisions

decisions:

  - id: PD-001

    title: Propriétaire de l'organisation

    status: accepted

    decision: >
      La Direction est le propriétaire contractuel de
      l'organisation.
    
    rationale: >
      Séparation claire entre responsabilités
      administratives et responsabilités académiques.

    source:
      - PRD R1

    impacts:
      - auth
      - permissions
      - organization

On ne parle plus de l'ancien projet.

On parle uniquement de la vérité actuelle.

2. architecture-decisions.yaml

Même principe.

decisions:

- id: AD-004

  title: Audit immutable

  status: accepted

  decision: >
      Les journaux d'audit sont conservés même après
      suppression des ressources métier.

  rationale: >
      Permettre la traçabilité légale.

  impacts:

    - audit

    - database
3. pending.yaml

Toutes les questions.

questions:

- id: PQ-001

  title: Suspension d'organisation

  status: pending

  context: >
      Déterminer le comportement utilisateur
      lorsqu'une organisation est suspendue.

  options:

    - Lecture seule

    - Blocage complet

    - Redirection

  depends_on:

    - billing

Une fois décidée :

➡️ elle disparaît d'ici

➡️ elle va dans product-decisions.yaml

