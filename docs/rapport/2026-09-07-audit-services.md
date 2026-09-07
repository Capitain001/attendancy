# Audit des Services — Rapport
**Date :** 7 Septembre 2026
**Cible :** `apps/web/src/services/**`

Cet audit a été réalisé en confrontant le code actuel aux règles définies dans le référentiel de compétence (le fameux pattern des services).

L'audit révèle une base de code extrêmement solide, avec un grand respect de l'encapsulation (Prisma reste cantonné au sous-répertoire `database/`, les actions serveur gardent jalousement le `"use server"`, et l'authentification est bien placée). 

Toutefois, quelques optimisations de syntaxe et de conventions ont été relevées.

## 1. Pattern `safeParse` vs `parse`

La convention impose l'utilisation de `v.safeParse` (sans bloc `try/catch` pour la validation) plutôt que `v.parse` afin de typer le retour d'erreur explicitement via le mécanisme d'ActionResponse sans déclencher d'exception.

**Observations (Fichiers utilisant encore `v.parse`) :**
- `src/services/student/actions/student.mutations.ts` (lignes 17, 42)
- `src/services/teacher/actions/teacher.mutations.ts` (ligne 14)
- `src/services/subscription/actions/subscription.mutations.ts` (ligne 16)
- `src/services/teacher-unavailability/actions/teacher-unavailability.mutations.ts` (lignes 25, 38)

> **Action recommandée :** Refactorer ces actions pour utiliser `const parsed = v.safeParse(...)` et retourner `if (!parsed.success) return { error: parsed.issues[0]?.message }`.

## 2. Conventions de Naming (Soft Delete vs Hard Delete)

La convention stipule très clairement :
- Soft delete (`deletedAt`) → `remove*`
- Hard delete (suppression physique) → `delete*`

**Observations soulevées par le linter :**
- `src/services/schedule/database/schedule.mutations.ts` : 
  - `deleteSchedulesByRule` effectue un soft delete. Doit être renommé en `removeSchedulesByRule`.
  - `deleteNextSchedulesByRule` effectue un soft delete. Doit être renommé en `removeNextSchedulesByRule`.
- `src/services/term/database/term.mutations.ts` :
  - `removeTerm` effectue un hard delete. Doit être renommé en `deleteTerm`.
  - En conséquence, l'événement `TERM_REMOVED` émis par cette fonction devrait être `TERM_DELETED`.

## 3. Bonne pratiques validées

- **Aucune fuite de Prisma** dans les couches supérieures (les actions orchestrent, la DB exécute).
- **Le pattern AuthGuardFirst** est respecté, aucune vérification `if (auth.error)` fallacieuse n'a été détectée, le `if (!auth.data)` est utilisé partout.
- L'injection du scope multi-tenant (`orgId`) est omniprésente dans les `where`.
