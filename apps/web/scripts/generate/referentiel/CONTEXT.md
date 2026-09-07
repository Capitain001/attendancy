## `scripts/generate/referentiel/CONTEXT.md`

```markdown
# scripts/generate/referentiel

## Fichiers

| Fichier | Rôle |
|---------|------|
| `referentiel.ts` | Générateur principal — écrit `src/generated/referentiel.ts` |
| `check.ts` | Rapport non-bloquant : services DOMAIN sans description |

## referentiel.ts

**Input** : `src/services/*` + `prisma/schemas/*.prisma`

**Output** : `src/generated/referentiel.ts` — classification MODEL/DOMAIN complète (dossier ↔
modèle Prisma par kebab-case exact), `path` de chaque service, et alias de type par service
forçant la résolution compile-time de son index.

```
npx tsx scripts/generate/referentiel/referentiel.ts
```

**Règle** : dossier dont le kebab-case correspond exactement au kebab-case d'un modèle Prisma
→ **MODEL**. Sinon → **DOMAIN** par défaut (aucun modèle propre = orchestrateur par
construction — pas de zone grise nécessitant un arbitrage humain sur ce point).

**Limite assumée** : matching exact kebab-case uniquement. Un dossier MODEL renommé pour ne
plus matcher son modèle serait classé DOMAIN par erreur — seul cas nécessitant un override
manuel (voir `src/services/referentiel.ts`).

**Consommé par** : `src/services/referentiel.ts`, qui ré-exporte tout et n'ajoute que
`DOMAIN_DESCRIPTIONS` (texte humain, non dérivable).

## check.ts

**Input** : `src/generated/referentiel.ts` (généré) + `src/services/referentiel.ts` (manuel)

**Vérifie** : que chaque service DOMAIN généré a une entrée dans `DOMAIN_DESCRIPTIONS`.

**Non-bloquant (exit 0)** — signale, ne casse jamais le build. Cohérent avec
`scripts/generate/types/check.ts`.


npx tsx scripts/generate/referentiel/check.ts
```

## Quand lancer
```
- `referentiel.ts` : après ajout/suppression/renommage d'un dossier sous `src/services/`
- `check.ts` : avant chaque commit touchant `src/services/**`, en complément de
  `naming/check.ts` et `types/check.ts`
```

