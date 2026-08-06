# Service : ue-template

Catalogue des référentiels nationaux d'UE (global, sans orgId) et traçabilité des imports par organisation.

Modèles Prisma : `NationalReferential`, `UETemplate`, `UETemplateEC`, `UETemplateImport`.

## Rôle

- Expose le catalogue national en lecture seule (aucune mutation org sur les templates)
- Orchestre l'import : crée `UE` + `UECourse(s)` + `ProgramUE` en composant les services owners
- Trace chaque import dans `UETemplateImport` (idempotence + badge UI)

## Fichiers

| Fichier | Rôle |
|---------|------|
| `database/referential.queries.ts` | `getReferentials`, `getUETemplates`, `getUETemplate` |
| `database/template.queries.ts` | `getUETemplateImport`, `getUETemplateImportsByOrg` |
| `database/template.mutations.ts` | `createUETemplateImport`, `deleteUETemplateImport` |
| `database/import.mutations.ts` | orchestration cross-service : `importUEFromTemplate`, `deleteImportedUE` |
| `actions/referential.queries.ts` | `getReferentialsAction`, `getUETemplatesAction`, `getUETemplateImportsByOrgAction` |
| `actions/template.mutations.ts` | `importUEFromTemplateAction`, `deleteUETemplateImportAction` |
| `cache.ts` | `UE_TEMPLATE_GRAPH` enregistré dans `src/cache/server/key.ts` |
| `validation.ts` | `ImportUETemplateSchema` |
| `types.ts` | DTOs générés depuis `database/*.queries.ts` |

## Contraintes

- `NationalReferential` et `UETemplate` : jamais d'orgId — globaux, lecture seule
- `UETemplateImport` : scopé orgId — unique par (templateId, orgId)
- Cross-service DB : uniquement depuis `database/import.mutations.ts` — jamais depuis `actions/`
- Vérifications pré-import exhaustives avant toute création (idempotence + conflit code)
- Cache global pour templates (`cacheLife('days')`), scopé orgId pour imports
- `importUEFromTemplateAction` requiert rôle DIRECTION ou ADMIN
