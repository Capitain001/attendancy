# scripts/generate/naming

## check.ts

Rappeleur de conventions de nommage — **non bloquant (exit 0 toujours)**.
Analyse par regex (pas d'AST) : rapide, fonctionne sur tout fichier `.ts`.

**Usage** :
```
npx tsx scripts/generate/naming/check.ts              # tous les services
npx tsx scripts/generate/naming/check.ts <service>    # un service
npx tsx scripts/generate/naming/check.ts svc1 svc2    # plusieurs
```

**Règles vérifiées** :

| # | Règle | Déclencheur | Attendu |
|---|-------|-------------|---------|
| 1 | Lecture | fn nommée `list*` | renommer en `get*` |
| 2 | Soft delete — fn | fn `delete*` dans un corps qui contient `deletedAt` | renommer en `remove*` |
| 3 | Soft delete — event | `invalidateEvent('*_DELETED', …)` avec `deletedAt` dans le corps | `*_REMOVED` |
| 4 | Hard delete — fn | fn `remove*` dont le corps appelle `prisma.x.delete(` | renommer en `delete*` |
| 5 | Hard delete — event | `invalidateEvent('*_REMOVED', …)` avec `prisma.x.delete` dans le corps | `*_DELETED` |

**Méthode** : extraction des corps de fonctions par comptage d'accolades (pas d'AST).
Faux positifs rares possibles sur des commentaires ou strings — à juger manuellement.

**Quand lancer** : avant chaque commit sur `src/services/**`.
