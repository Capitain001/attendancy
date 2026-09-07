# Audit de Cohérence du Cache Serveur — Rapport
**Date :** 7 Septembre 2026
**Cible :** `apps/web/src/cache/server/**` et `src/services/**/cache.ts`

Cet audit vérifie la mécanique d'invalidation (Next.js Cache Tag) et de déclaration des événements de mutation métier.

## 1. Graphe d'invalidation cross-service

L'exécution du script `api:check` a retourné un graphe entièrement cohérent (0 orphelins, 18 événements validés sur plus de 39 services indexés). 

**Observations :**
L'architecture via `invalidateEvent(GRAPH, 'X_CREATED', id)` est très bien intégrée dans la couche `database/<model>.mutations.ts`. L'appel au cache ne pollue pas la couche d'actions, et reste bien lié à l'écriture physique en base de données.

## 2. Points de vigilance (Missing Invalidations)

L'audit textuel a révélé que la majorité des écritures appellent de manière assidue `invalidateEvent`. Toutefois, dans les écritures "Bulk" ou conditionnelles, il faut redoubler de vigilance :

- **`bulkSetStudentStatusAction` (`student.mutations.ts`)** : Cette mutation effectue un `updateMany` sur des centaines de statuts étudiants directement depuis la couche d'action (sans passer par la base de données standardisée). 
  - *Problème :* Comme elle contourne un appel individuel, elle ne semble pas déclencher d'invalidation de cache pour `STUDENT_UPDATED`. Les vues de listes d'étudiants pourraient afficher des statuts obsolètes jusqu'à la fin de vie naturelle du cache.
  - *Solution recommandée :* S'assurer que les opérations `updateMany` (bulk) appellent bien un événement de type `STUDENT_BULK_UPDATED` qui purge le tag global de l'organisation.

- **Soft deletes & Hard deletes** : L'utilisation de `TERM_REMOVED` pour un hard delete dans `term` (qui a été remonté dans l'audit général) signifie que le `term.cache.ts` écoute très probablement le mauvais tag ou qu'il y a un décalage sémantique. Une passe de renommage sur l'événement `TERM_REMOVED` → `TERM_DELETED` rétablira une invalidation cohérente de l'arbre sémantique.

## 3. Santé du registre (key.ts)

Le registre global (`key.ts`) est tenu de manière très propre. La convention de préfixe `x:<scopeId>:<id>` isole parfaitement la donnée (Multi-tenant). 

> **Verdict :** Le système de cache est fonctionnel et sain. Seule la gestion des événements lors de grosses requêtes `updateMany`/`deleteMany` nécessite un contrôle manuel occasionnel.
