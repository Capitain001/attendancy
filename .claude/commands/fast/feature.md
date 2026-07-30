---
description: Plan rapide d'une nouvelle feature (attendancy)
argument-hint: <description de la feature>
---

# Fast Feature — attendancy

Crée un plan dans `specs/<nom>.md` pour implémenter la feature décrite.

## Instructions

- Lis `CLAUDE.md` et les `CLAUDE.md` du service concerné avant de planifier
- Respecte les conventions du projet (naming, layering, stack)
- Stack : Next.js 16 · React 19 · Prisma v7 · Supabase · Tailwind v4 · Valibot · Vitest

## Plan Format

```md
# Feature: <nom>

## Description
<décrire la feature et sa valeur métier>

## User Story
En tant que <rôle>
Je veux <action>
Afin de <bénéfice>

## Services concernés
<lister les services src/services/* impactés et pourquoi>

## Fichiers à créer / modifier
<lister avec leur couche : database/ | actions/ | hooks/data/ | components/>

## Plan d'implémentation

### Phase 1 — DB / Schema
<changements Prisma si nécessaire>

### Phase 2 — Service layer (database/ + actions/)
<fonctions DB et actions serveur>

### Phase 3 — Frontend (hooks + composants)
<hooks React Query et composants UI>

## Validation
```
npx tsx scripts/generate/naming/check.ts <service>
npx tsx scripts/generate/types/check.ts <service>
npx tsx scripts/generate/api/api.ts <service>
npx vitest run
```

## Critères d'acceptation
<liste des critères mesurables>
```

## Feature
$ARGUMENTS
