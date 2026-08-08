# Architecture: Templates UE Référentiel National

**Feature**: ue-national-templates  
**Date**: 2026-08-06  
**Branch**: `ue-national-templates`  
**Specs**: [spec.md](./spec.md)

---

## Summary

Un nouveau service `ue-template` expose un catalogue global de référentiels nationaux (hors tenant). Une action d'import orchestrée crée atomiquement `UE` + `UECourse(s)` + `ProgramUE` dans le périmètre de l'organisation en composant les services existants (`ue`, `ue-course`, `program-ue`). Un enregistrement `UETemplateImport` trace chaque import et garantit l'idempotence.

---

## Technical Context

**Stack**: Next.js 16 (PPR) · Prisma v7 multi-schema · TypeScript strict · Valibot  
**Nouveaux modèles**: `NationalReferential`, `UETemplate`, `UETemplateEC`, `UETemplateImport`  
**Schéma Prisma**: nouveau fichier `prisma/schemas/referential.prisma`  
**Migration impactante**: `UECourse.credits Int → Decimal(4,2)` dans `academic.prisma`  
**Seed**: `scripts/seed/referential-togo-2022.ts`  
**Tests**: Vitest — unitaires sur `importUEFromTemplate` (logique de conflit/idempotence)

---

## Technical Decisions

### Décision 1 : Service `ue-template` sans modèle Prisma existant

**What**: Nouveau service `ue-template` propriétaire de 4 nouveaux modèles — aucune dépendance vers les modèles `orgId`-scoped existants sauf via FK dans `UETemplateImport.ueId`.  
**Why**: Séparation nette référentiel global / données org. Le catalogue national ne doit pas polluer les schémas académiques existants.  
**Alternatives**: Intégrer dans le service `ue` existant → rejeté (mélange tenant/global, couplage fort).  
**Trade-offs**: Un service de plus à maintenir, mais isolation totale et zero impact sur le code existant.

### Décision 2 : Import comme action d'orchestration (pas de transaction Prisma)

**What**: `importUEFromTemplateAction` appelle séquentiellement les services owners (`createUE` → `createUECourse` × N → `addUEToProgram` → `createUETemplateImport`). Pas de `prisma.$transaction` cross-service.  
**Why**: Les services `ue`, `ue-course`, `program-ue` sont propriétaires de leurs modèles — appeler leur couche `database/` directement depuis un autre service violerait l'invariant `1 modèle = 1 service owner`.  
**Alternatives**: Transaction Prisma cross-service → rejeté (brise les frontières de service, couplage Prisma dans les actions).  
**Trade-offs**: En cas d'échec partiel (UE créée mais UECourse en erreur), des artefacts partiels peuvent rester. Mitigation : vérifications pré-import exhaustives avant toute création.

### Décision 3 : `UECourse.credits` → `Decimal(4,2)`

**What**: Migration du champ `credits` de `Int` vers `Decimal(4,2)` dans `UECourse` (academic.prisma).  
**Why**: Le référentiel Togo contient des crédits décimaux (1.5, 2.5 cr). Stocker en `Int` tronquerait les valeurs.  
**Impact**: Migration bloquante — doit précéder toute autre phase. Impacte les requêtes existantes `getUECoursesByUE`, `getProgramUEs` (type `credits` passe de `number` à `Decimal`).  
**Alternatives**: Multiplier par 10 (stocker 15 pour 1.5) → rejeté (sémantique opaque, conversions partout).

### Décision 4 : Cache global pour `UETemplate`, scopé org pour `UETemplateImport`

**What**: `UETemplate` et `NationalReferential` ont un cache global (`cacheLife('days')`), sans `cacheTag` orgId. `UETemplateImport` est caché par org (`CACHE.UE_TEMPLATE_IMPORT(orgId)`).  
**Why**: Les templates sont identiques pour toutes les orgs — un cache global évite N duplications. Les imports sont propres à chaque org.

---

## Architecture Overview

### Avant

L'admin crée manuellement chaque `UE` + `UECourse` via les actions existantes. Aucun lien avec un référentiel national.

### Après

Un dialogue "Importer depuis référentiel" navigue dans le catalogue `UETemplate`, sélectionne des UE, et déclenche `importUEFromTemplateAction` qui compose les services existants. Les modèles org-scoped (`UE`, `UECourse`, `ProgramUE`) sont créés normalement — le référentiel ne modifie pas leur structure.

### Flux d'import

```
UI (dialog) → importUEFromTemplateAction(templateId, programId, semester)
  │
  ├─ 1. getUETemplate(templateId)                   — ue-template/database
  ├─ 2. CHECK: UETemplateImport exists? → { error } — ue-template/database
  ├─ 3. CHECK: UE.code conflict in org? → { error } — ue/database (getUEByCode)
  ├─ 4. createUE({ name, code, orgId })             — ue/database (owner)
  ├─ 5. createUECourse × N ({ name, code, credits, ueId, orgId })
  │                                                 — ue-course/database (owner)
  ├─ 6. addUEToProgram({ ueId, programId, semester })
  │                                                 — program-ue/database (owner)
  └─ 7. createUETemplateImport({ templateId, orgId, ueId })
                                                    — ue-template/database (owner)
```

---

## Component Structure

### Nouveau schéma Prisma

**Fichier**: `apps/web/prisma/schemas/referential.prisma`

```prisma
// Tous les modèles avec @@schema("public")

model NationalReferential { ... }    // catalogue global
model UETemplate          { ... }    // UE du référentiel (code nullable pour LIBRE)
model UETemplateEC        { ... }    // EC d'une UE template
  @@unique([templateId, code])
model UETemplateImport    { ... }    // trace org-scoped
  @@unique([templateId, orgId])

enum UETemplateType { FONDAMENTALE COMPLEMENTAIRE APPROFONDISSEMENT SPECIALITE TRANSVERSALE LIBRE }
```

**Migration impactante** (à générer en premier) :
```
apps/web/prisma/schemas/academic.prisma
  UECourse.credits: Int → Decimal(4,2)
```

### Nouveau service

```
apps/web/src/services/ue-template/
  CLAUDE.md
  index.ts                              # barrel : actions + types
  actions/
    index.ts
    referential.queries.ts              # getReferentialsAction, getUETemplatesAction
    template.mutations.ts               # importUEFromTemplateAction, deleteUETemplateImportAction
  database/
    index.ts
    referential.queries.ts              # getReferentials, getUETemplates, getUETemplate
    template.mutations.ts               # createUETemplateImport, deleteUETemplateImport
    template.queries.ts                 # getUETemplateImport, getUETemplateImportsByOrg
  cache.ts                              # UE_TEMPLATE_GRAPH
  validation.ts                         # ImportUETemplateSchema
  types.ts                              # GetUETemplatesDto, GetUETemplateDto
```

### Seed

```
apps/web/scripts/seed/
  referential-togo-2022.ts              # NOUVEAU — données Togo 2022 (upsert idempotent)
```

### UI (nouveaux composants)

```
apps/web/src/components/ue-template/
  UETemplateImportDialog.tsx            # dialog principal (cascade filtres + sélection + import)
  UETemplateFilters.tsx                 # filtres pays/domaine/mention/spécialité/semestre
  UETemplateList.tsx                    # liste des UE avec badge "Déjà importé"
```

### Fichiers modifiés

```
apps/web/prisma/schemas/academic.prisma       # credits Int → Decimal(4,2)
apps/web/src/services/ue/database/ue.queries.ts  # ajouter getUEByCode(code, orgId) pour check conflit
```

---

## User Story Mapping

**US-001 — Catalogue filtrable**
- `database/referential.queries.ts` : `getUETemplates({ country, domain, degree, mention, speciality, semester })`
- `actions/referential.queries.ts` : `getUETemplatesAction`
- `UETemplateFilters.tsx` : cascade de selects côté UI

**US-002 — Import UE → UE + UECourse + ProgramUE**
- `actions/template.mutations.ts` : `importUEFromTemplateAction({ templateId, programId, semester })`
- Orchestration séquentielle (voir flux ci-dessus)

**US-003 — Blocage conflit de code**
- Dans `importUEFromTemplateAction` : `getUEByCode(code, orgId)` avant création
- Retour `{ error: "Code ANG1160 déjà utilisé dans votre organisation." }`

**US-004 — Badge "Déjà importé"**
- `getUETemplateImportsByOrg(orgId)` retourne tous les `templateId` importés
- `UETemplateList.tsx` affiche badge si `templateId ∈ importedIds`

**US-005 — Suppression import**
- `deleteUETemplateImportAction(ueId)` :
  1. Vérifie absence de `Course` dépendant (via `ue-course` owner)
  2. Soft-delete `UE` (`deletedAt: new Date()`) via service `ue`
  3. Supprime `UETemplateImport` (hard delete)

**US-006 — Multi-pays sans code**
- `NationalReferential.country: String` + seed isolé par pays
- UI filtre par `country` en premier niveau

---

## Integration Points

- **`ue` (owner UE)** : `createUE`, `removeUE` (soft-delete), nouveau `getUEByCode`
- **`ue-course` (owner UECourse)** : `createUECourse` × N ECs
- **`program-ue` (owner ProgramUE)** : `addUEToProgram({ programId, ueId, semester })`
- **Cache** : `UE_TEMPLATE_GRAPH` enregistré dans `src/cache/server/key.ts`

---

## Technical Constraints

- `orgId` jamais présent sur `NationalReferential` ni `UETemplate` — globaux en lecture seule
- `importUEFromTemplateAction` ne doit pas importer de `database/` hors service `ue-template`
- Migration `credits Decimal` doit précéder toute implémentation — phase 0 bloquante
- Seed idempotent : `upsert` sur `@@unique([referentialId, code])` pour rejouer sans duplication

---

## Risks & Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Import partiel (UE créée, UECourse en erreur) | Médium | Vérifications pré-import exhaustives avant toute écriture |
| Migration `credits Decimal` casse requêtes existantes | Haut | Générer migration en isolation, vérifier types retournés dans `getProgramUEs` |
| Performance du catalogue (milliers de templates) | Bas | Cache global `cacheLife('days')` + filtres côté DB (index sur `domain`, `mention`, `semester`) |
| Seed Togo 2022 mal parsé (données manquantes) | Médium | Script idempotent + log des UE insérées/skippées |

---

## Open Questions

Aucune — toutes les clarifications ont été résolues.

---

## Next Steps

Plan détaillé → [plan.md](./plan.md)

1. **Phase 0** (bloquante) : migration `UECourse.credits Int → Decimal(4,2)` — T001–T004
2. **Phase 1** : créer `referential.prisma` + migration — T005–T008
3. **Phase 2** : scaffolding service `ue-template` — T009–T019
4. **Phases 3+4** (parallèles) : extension `ue` + seed Togo 2022
5. **Phase 5** : logique import `importUEFromTemplateAction`
6. **Phase 7** : UI dialog import
