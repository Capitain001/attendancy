---
description: Plan rapide de correction de bug (attendancy)
argument-hint: <description du bug>
---

# Fast Bug — attendancy

Crée un plan de correction chirurgicale dans `specs/<nom>.md`.

## Instructions

- Lis le service concerné (`src/services/<service>/CLAUDE.md`) avant de planifier
- Correction minimale — ne pas refactorer autour du fix
- Vérifier les invariants : orgId serveur, layer séparation, naming

## Plan Format

```md
# Bug: <nom>

## Description
<symptôme et comportement attendu>

## Étapes de reproduction
1. ...

## Analyse root cause
<cause identifiée, fichier:ligne>

## Fix proposé
<changement minimal et ciblé>

## Fichiers touchés
- `src/services/<service>/<layer>/<file>` — <pourquoi>

## Validation
```
npx tsx scripts/generate/naming/check.ts <service>
npx vitest run --reporter=verbose <test-file>
```

## Régression à vérifier
<ce qui pourrait casser>
```

## Bug
$ARGUMENTS
