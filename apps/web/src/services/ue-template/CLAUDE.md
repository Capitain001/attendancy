# Service : ue-template

Catalogue des référentiels nationaux de formations, de programmes et d'UE (global, sans orgId) et gestion de l'import (déclinaison opérationnelle par organisation).

Modèles Prisma : `Referential`, `ProgramTemplate`, `UETemplate`, `UETemplateEC`, `ProgramUETemplate`, `OrgProgramTemplate`, `OrgUETemplate`.

## Rôle

- Expose le catalogue national en lecture seule : domaines, mentions, spécialités, UE, et EC.
- Orchestre l'import (`applyProgramTemplate`) : lit un programme national et crée (si manquants) `Department`, `ProgramTrack`, `Program`, `UE`, `UECourse`, et `ProgramUE` en composant les tables du domaine académique.
- Trace chaque import dans `OrgProgramTemplate` et `OrgUETemplate` pour garantir l'idempotence.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `database/referential.queries.ts` | `getReferentials`, `getReferential` |
| `database/template.queries.ts` | `getProgramTemplates`, `getUETemplates` |
| `database/import.mutations.ts` | orchestration cross-domain : `applyProgramTemplate` |
| `actions/referential.queries.ts` | `getReferentialsAction`, `getReferentialAction` |
| `actions/import.mutations.ts` | `applyProgramTemplateAction` |
| `cache.ts` | `REFERENTIAL_GRAPH` enregistré dans `src/cache/server/key.ts` |
| `validation.ts` | schémas Valibot (ex: `ApplyProgramTemplateSchema`) |
| `types.ts` | DTOs générés |

## Contraintes

- **Exception au "1 modèle = 1 service"** : ce service regroupe de manière cohésive tous les modèles du schéma `referential.prisma` (ils forment un seul domaine conceptuel national).
- Modèles nationaux : jamais d'orgId (scopés globalement).
- Modèles d'import (`OrgProgramTemplate`, `OrgUETemplate`) : scopés `orgId`.
- L'import nécessite le rôle DIRECTION ou ADMIN.
- Les actions ne contiennent pas la logique métier, elles ne font que de l'orchestration + validation.
- L'import est idempotent : réappliquer le même programme national ne crée pas de doublons mais réutilise les entités métier existantes.
