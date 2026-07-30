# Tâche : Migration V1 → V2 — Copie des composants métier

### Contexte

- **V1** (source) : `C:\PROJECTS\DEV\ULTIMATE\attendancy-sys`
- **V2** (cible) : `C:\PROJECTS\PROJECT\PRODUCTIONS\attendancy`
- Même domaine métier. La logique ne change pas — seul le câblage des données diffère (providers, hooks, actions, schema Prisma V2).

NB: schemas V2 quasi identique , les incoherences entre les schemas sont faible inutile d ecrire from strash
---

### Stratégie d'exécution

**Règle principale : copie d'abord, correction ensuite.**

1. Copier intégralement les composants des pages cibles (cf. périmètre ci-dessous).
2. Ne pas lire un fichier en entier s'il ne présente pas d'erreur en V2.
3. Travailler les fichiers dans cet ordre de priorité :
   - **Imports cassés** → rechercher le symbole en V2 (`src/`) ; si absent, rechercher en V1 et identifier l'équivalent V2.
   - **Passage de données** → identifier comment les props/hooks/actions transmettent les données (même domaine = logique identique, seul le provider change).
4. Documenter, pour chaque composant copié :
   - Ses dépendances d'import résolues en V2.
   - Les data-flows entrants/sortants (props, hooks, actions).
   - Le mapping V1 → V2 des sources de données.
   - Cela permet à une tâche d'implémentation ultérieure de brancher sans relire les fichiers.

---

### Périmètre — Pages et arborescences à copier

| Priorité | Source V1 |
|----------|-----------|
| P0 | `src/app/(attendancy)/[slug]/direction/planning/**` — cœur métier, copie intégrale |
| P1 | `src/app/(attendancy)/[slug]/direction/courses/[courseId]/page.tsx` + composants enfants |
| P1 | `src/app/(attendancy)/[slug]/direction/classes/[classId]/**` (page + toutes pages enfants) |
| P1 | `src/app/(attendancy)/[slug]/direction/invitations/classes/[classId]/page.tsx` |
| P1 | `src/app/(attendancy)/[slug]/direction/program-track/[id]/page.tsx` |

**Point d'attention planning** : lire `src/components/layout/sidebar/views/registry.ts` (V2) pour comprendre comment le filtre planning est câblé côté sidebar, puis lire la V1 pour aligner le comportement.

---

### Tâche secondaire (non bloquante, post-migration)

Réorganiser les dossiers des composants UI copiés selon les conventions V2 :

- Exemple : un header dans `components/admin/` en V1 → déplacer dans `components/layout/` en V2.
- Ne faire cette réorganisation qu'après que les composants fonctionnent en V2.

---

### Livrables attendus

- Composants copiés et erreurs de compilation corrigées.
- Fichier de documentation par page (ou section) copiée : imports résolus, data-flow, mapping V1→V2.
