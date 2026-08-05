# Attendancy — Vision globale du produit

## Proposition de valeur

Attendancy centralise la planification académique et le suivi de présence autour d'une source de vérité unique : **la séance planifiée**. Il garantit une planification sans conflits, une présence vérifiable et un suivi fiable de l'assiduité.

**Cible** : établissements d'enseignement supérieur d'Afrique de l'Ouest francophone.

**Hors périmètre** : finance, RH, paie, vie de campus, cantine, internat.

---

## Problème résolu

Les établissements supérieurs africains gèrent manuellement (papier, tableur, groupes de messagerie) trois processus critiques interdépendants :

1. La planification des cours (conflits de salles, d'enseignants, de créneaux)
2. L'émargement des présences (feuilles de présence perdues, contestations, fraudes)
3. Le suivi de l'assiduité (aucune vision consolidée, décisions tardives)

Attendancy les unifie dans une plateforme multi-tenant, avec garanties d'intégrité en base de données.

---

## Rôles de la plateforme

| Rôle | Description |
|---|---|
| **Direction** | Propriétaire de l'organisation. Vision globale, pilotage, décisions basées sur données. |
| **Admin** | Opérateur de la configuration académique quotidienne (structure, planification, accès). Distinct de la Direction — rôle technique, non propriétaire. |
| **Enseignant** | Gère ses séances, déclare les présences, consulte son planning. |
| **Étudiant** | Consulte son emploi du temps, suit son assiduité, accède à ses résultats. |
| **Parent** | Suit l'assiduité et les résultats académiques de son enfant. |

> **Décision P-01 (acceptée)** : La Direction est le propriétaire de l'organisation. Les Admins sont des opérateurs remplaçables sans impact sur la gouvernance.

> **Décision PROD-001 (acceptée)** : Le rôle Admin est distinct de la Direction dès le MVP. La Direction supervise, l'Admin configure et opère.

---

## Principes d'interaction entre rôles

```
Direction
  ├── configure la structure académique (ou délègue à Admin)
  ├── valide les justificatifs d'absence
  ├── approuve les corrections de notes post-clôture
  └── supervise les rapports d'assiduité

Admin
  ├── crée/gère la structure académique (années, filières, classes, salles)
  ├── planifie les séances (génération récurrente, semaines types)
  ├── gère les invitations et accès utilisateurs
  └── maintient la cohérence des données pour tous les acteurs

Enseignant
  ├── check-in à la séance (GPS / QR / override admin)
  ├── déclare les présences des étudiants
  └── consulte le planning de ses cours

Étudiant
  ├── émarger via QR rotatif (token 15 min)
  ├── consulte son planning et son historique d'assiduité
  └── dépose des justificatifs d'absence

Parent
  ├── consulte la présence de son enfant
  └── dépose des justificatifs d'absence (avant ou après séance)
```

---

## Principes transverses

- **Multi-tenant** : chaque donnée est scopée par `orgId`. Un utilisateur peut appartenir à plusieurs établissements avec des rôles différents par org.
- **Séance comme pivot** : tout le suivi de présence est attaché à une séance planifiée — aucun pointage hors séance.
- **Intégrité garantie en base** : anti-conflits de planification par contraintes d'exclusion GiST ; faits de présence et notes immuables (corrections tracées).
- **Traçabilité** : `AuditLog` immuable sur tout événement important ; justifications d'absence avec pièces jointes.
- **Wizard de setup** (décision PROD-003) : configuration académique séquentielle guidée — année → département → filière → classe.
