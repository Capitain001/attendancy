# Composants UI — Règles

## Structure des dossiers

Chaque dossier correspond à un domaine ou une catégorie de composants :

| Dossier | Contenu |
|---|---|
| `planning/` | Planning de classe — `ClassPlanning`, `CoursePlanningDialog` ✅ CLAUDE.md |
| `direction/` | Interfaces de pilotage Direction (dashboard, membres, alertes) |
| `schedule/` | Composants liés aux séances planifiées |
| `layout/` | Shell de navigation — `CollapseSection`, Header, Sidebar |
| `stats/` | Métriques et cartes de données (`MetricCard`) |
| `forms/` | Composants de formulaire génériques |
| `ui/` | Primitives shadcn/ui — ne pas modifier directement |
| `ux/` | Utilitaires UX transverses (`StatusClock`, `RoomInfo`) |
| `auth/` | Formulaires et pages d'authentification |
| `event-calendar/` | Calendrier d'événements interactif |

---

## Règle : CLAUDE.md obligatoire pour les UI critiques

Tout composant **UI critique** doit avoir un fichier `CLAUDE.md` dans son dossier.

### Définition d'un composant UI critique

Un composant est critique s'il remplit **au moins un** de ces critères :

- Exposé directement depuis une page RSC (point d'entrée d'une feature)
- Possède des props non triviales ou des contraintes d'usage importantes
- Intègre des hooks, des actions serveur, ou un state complexe
- Réutilisé dans plusieurs pages / domaines
- Charge des dépendances lourdes (dynamic import, SSR:false, etc.)

### Ce que doit contenir le CLAUDE.md

```markdown
# Composants `<dossier>`

## Point d'entrée
Quel composant instancier depuis une page RSC, et comment.

## Composants
Tableau : Composant | Rôle | Props clés

## Hooks internes (si applicable)
Signatures et comportement des hooks exposés.

## Types clés
Les types publics exportés depuis le barrel.

## Règles d'usage
Contraintes importantes (SSR, cache, dépendances, invariants).
```

### Composants critiques identifiés

| Dossier | Composant principal | CLAUDE.md |
|---|---|---|
| `planning/` | `ClassPlanning` | ✅ présent |
| `event-calendar/` | `EventCalendar` | ⚠️ à créer |
| `direction/dashboard/` | `TodaySessionsWidget`, `DailyMetricsCard` | ⚠️ à créer |
| `layout/` | `CollapseSection`, Sidebar | ⚠️ à créer |
| `schedule/` | composants séance | ⚠️ à créer |

---

## Règles transverses (toujours enforced)

- Importer via le barrel `index.ts` du dossier — jamais les chemins internes.
- `"use client"` uniquement sur les composants qui en ont besoin — pas sur les wrappers RSC.
- Toast : `@/lib/toast/custom-toast` — jamais `sonner` directement.
- Pas d'appel direct à une server action depuis un composant client — toujours via un hook `src/hooks/data/<domain>/`.
- Composants purement d'affichage (pas de state, pas d'effets) : pas de `"use client"`.
