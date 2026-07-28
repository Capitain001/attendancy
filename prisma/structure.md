# Organisation des scripts Prisma et SQL

Cette structure sépare le schéma Prisma des objets SQL non gérés nativement par Prisma afin de conserver une architecture claire, modulaire et maintenable.

## Arborescence

```text
prisma/
├── schemas/
│   ├── schema.prisma
│   ├── tenant.prisma
│   ├── profile.prisma
│   ├── academic.prisma
│   ├── schedule.prisma
│   ├── attendance.prisma
│   ├── evaluation.prisma
│   ├── communication.prisma
│   └── billing.prisma
│
├── post-migrate/
│   ├── 00_extensions.sql
│   ├── 10_tenant.sql
│   ├── 20_profile.sql
│   ├── 30_academic.sql
│   ├── 40_schedule.sql
│   ├── 50_attendance.sql
│   ├── 60_evaluation.sql
│   ├── 70_communication.sql
│   └── 80_billing.sql
│
└── verify/
    └── verify.sql
```

---

## `schemas/`

Contient les différents modules du schéma Prisma.

Chaque fichier regroupe les modèles d'un domaine métier spécifique afin de faciliter la maintenance et la lecture du schéma global.

Le fichier `schema.prisma` constitue le point d'entrée principal et référence les différents modules.

---

## `post-migrate/`

Contient tous les objets SQL qui ne sont pas gérés par Prisma.

Ces scripts sont exécutés après les migrations Prisma afin d'ajouter les fonctionnalités avancées de PostgreSQL.

Chaque fichier correspond à un domaine métier et doit uniquement contenir les objets SQL associés à ce domaine.

L'ordre des fichiers garantit le respect des dépendances entre les modules.

### Organisation interne d'un fichier

Chaque module suit la même structure :

1. Colonnes dérivées
2. Index
3. Contraintes (`CHECK`, `UNIQUE`, ...)
4. Contraintes d'exclusion (`EXCLUDE`)
5. Fonctions
6. Triggers
7. Vues

Le fichier `00_extensions.sql` est réservé aux extensions PostgreSQL.

Tous les scripts doivent rester :

- idempotents ;
- réexécutables après chaque migration Prisma ;
- compatibles avec une base fraîche (`migrate reset`, `db push`) ;
- sans backfill de données.

---

## `verify/`

Contient uniquement des scripts de diagnostic.

Le fichier `verify.sql` permet de vérifier la présence des principaux objets SQL créés par les scripts du dossier `post-migrate` :

- index ;
- contraintes ;
- triggers ;
- fonctions ;
- vues ;
- autres objets SQL.

Aucun script de ce dossier ne doit modifier la base de données.

---

## Principes d'organisation

- Un objet SQL appartient au module métier de la ressource qu'il enrichit.
- Les objets ne doivent jamais être dupliqués entre plusieurs modules.
- La logique métier existante doit être conservée à l'identique.
- Chaque module doit être documenté afin d'expliquer les choix d'architecture et les contraintes métier implémentées.
- La structure SQL doit rester alignée avec l'organisation du schéma Prisma afin de faciliter son évolution.