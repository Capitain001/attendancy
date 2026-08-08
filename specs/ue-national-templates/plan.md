# Tasks: Templates UE Référentiel National

**Branch**: `ue-national-templates`  
**Specs**: [spec.md](./spec.md)  
**Architecture**: [architecture.md](./architecture.md)  
**Status**: En cours ⏰

---

## Outils & patterns à utiliser

### Lire rapidement une fonction existante
```bash
# Vue consolidée d'un service (à lire EN PREMIER avant d'ouvrir les fichiers)
apps/web/summary/<service>.json
# Fiche individuelle d'une fonction
apps/web/src/services/<service>/.api/<fnName>.json
```

### Créer un nouveau service
```bash
cd apps/web
npx tsx scripts/generate/service/service.ts <name> --model=<Model> --minimal [--soft-delete] [--force]
# Effet : scaffold complet + enregistrement auto dans cache/server/key.ts
# TOUJOURS utiliser le générateur — ne jamais scaffolder manuellement
```

### Générer les types DTOs
```bash
# Après avoir écrit les database/*.queries.ts
npm run generate:types:svc -- <service>
# Génère types.ts automatiquement + ajoute export dans index.ts si absent
```

### Workflow post-service (obligatoire avant commit)
```bash
npm run check:naming:svc -- <service>     # exit 0, non bloquant
npm run check:types:svc -- <service>      # exit 0, non bloquant
npm run generate:api:svc -- <service>     # met à jour .api/
npm run api:check                          # valide cohérence cross-service — BLOQUANT
npm run generate:summary:svc -- <service> # vue IA (optionnel)
```

### Règle cross-service database
> Les fonctions `database/` d'un autre service sont importables **uniquement**
> depuis la couche `database/` du service consommateur — jamais depuis `actions/`.

```
ue-template/database/import.mutations.ts   ← importe createUE, createUECourse, addUEToProgram
ue-template/actions/template.mutations.ts  ← appelle uniquement ../database/
```

---

## Phase 0: Migration bloquante — credits Decimal ✅

- [x] T001 Modifier `academic.prisma` : `UECourse.credits Int → Decimal(4,2) @db.Decimal(4,2)`
- [ ] T002 Appliquer migration : `cd apps/web && bunx prisma migrate dev --name ue-course-credits-decimal` ⚠️ DB requise
- [ ] T003 Vérifier types `getProgramUEs` / `getUECoursesByUE` (`credits: Prisma.Decimal`)
- [ ] T004 `npm run generate:api:svc -- ue-course` après correction types si nécessaire

**Note** : Migration SQL créée manuellement dans `migrations/20260806000001_ue_course_credits_decimal/`. À appliquer dès que la DB Supabase est joignable.

---

## Phase 1: Schéma Prisma — referential.prisma ✅

- [x] T005 Créer `apps/web/prisma/schemas/referential.prisma` (4 modèles + enum)
- [x] T006 Vérifier `schema.prisma` — `public` déjà dans schemas list
- [ ] T007 Appliquer migration : `bunx prisma migrate dev --name referential-ue-templates` ⚠️ DB requise
- [x] T008 `bunx prisma generate` — client Prisma généré ✅

**Note** : Migration SQL dans `migrations/20260806000002_referential_ue_templates/`. Prisma client généré avec les nouveaux types (`NationalReferential`, `UETemplate`, etc.).

---

## Phase 2: Service `ue-template` — fondation ⏰

**⚠️ CORRECTION** : Service créé partiellement à la main. Utiliser le générateur pour compléter/corriger.

- [ ] T009 Re-scaffolder avec le générateur (le service existe déjà — utiliser `--force`) :
  ```bash
  cd apps/web
  npx tsx scripts/generate/service/service.ts ue-template --model=UETemplate --minimal --force
  ```
  Vérifier que `cache/server/key.ts` est correctement mis à jour (le générateur l'écrit proprement).

- [x] T010 `CLAUDE.md` rédigé ✅ (à relire après --force pour s'assurer que le générateur ne l'a pas écrasé)

- [x] T011 `database/referential.queries.ts` : `getReferentials`, `getUETemplates`, `getUETemplate`

- [x] T012 `database/template.queries.ts` : `getUETemplateImport`, `getUETemplateImportsByOrg`

- [x] T013 `database/template.mutations.ts` : `createUETemplateImport`, `deleteUETemplateImport`

- [ ] T013b Créer `database/import.mutations.ts` — orchestration cross-service (pattern correct) :
  ```ts
  // Importe database/ des services owners
  import { createUE, removeUE } from '@/services/ue/database'
  import { createUECourse } from '@/services/ue-course/database'
  import { addUEToProgram } from '@/services/program-ue/database'
  // Expose : importUEFromTemplate(), deleteImportedUE()
  ```

- [x] T014 `actions/referential.queries.ts` : `getReferentialsAction`, `getUETemplatesAction`, `getUETemplateImportsByOrgAction`

- [ ] T015 **RÉÉCRIRE** `actions/template.mutations.ts` — appeler `../database/import` (pas database owners directement) :
  ```ts
  import { importUEFromTemplate, deleteImportedUE } from '../database'
  // Ne plus importer depuis @/services/ue/database etc.
  ```

- [x] T016 `validation.ts` : `ImportUETemplateSchema`

- [x] T017 `cache.ts` + enregistrement dans `key.ts` ✅

- [ ] T018 Générer `types.ts` automatiquement :
  ```bash
  npm run generate:types:svc -- ue-template
  ```
  *(supprimer le `types.ts` manuel écrit à la main)*

- [x] T019 `index.ts` barrel ✅

- [x] T020 `database/index.ts` barrel ✅

**Checkpoint** ✋ :
```bash
npm run check:naming:svc -- ue-template
npm run check:types:svc -- ue-template
npm run generate:api:svc -- ue-template
npm run api:check
```

---

## Phase 3: Extension service `ue` — check conflit ⏰

- [x] T021 Ajouter `getUEByCode(code, orgId)` dans `ue/database/ue.queries.ts` ✅
- [ ] T022 `npm run generate:api:svc -- ue` + `npm run api:check`

---

## Phase 4: Seed Togo 2022 ⏳ (~1h30)

> Lire `docs/references/ues/Curricula-harmonises-resumer.md` avant de coder le seed.

- [ ] T023 Créer `apps/web/scripts/seed/referential-togo-2022.ts` :
  - `upsert` 1 `NationalReferential` (country: "TG", issuer: "MESRS-Togo", version: "2022-04")
  - `upsert` toutes `UETemplate` (parser le fichier résumé par domaine/mention/spécialité/semestre)
  - `upsert` `UETemplateEC` correspondants
  - Log : nombre d'UE insérées / skippées
- [ ] T024 Ajouter dans `apps/web/package.json` : `"seed:referential": "tsx scripts/seed/referential-togo-2022.ts"`
- [ ] T025 Exécuter quand DB disponible : `bun run seed:referential`

**Checkpoint** ✋ : Le catalogue Togo 2022 est visible en DB (8 domaines, toutes mentions/spécialités, semestres 1–6).

---

## Phase 5: Générateurs post-service ⏳

```bash
npm run check:naming:svc -- ue-template ue
npm run check:types:svc -- ue-template
npm run generate:api:svc -- ue-template ue
npm run api:check
npm run generate:summary:svc -- ue-template ue ue-course program-ue
```

- [ ] T026 `check:naming:svc -- ue-template ue`
- [ ] T027 `generate:api:svc -- ue-template ue` + `api:check`
- [ ] T028 `generate:summary:svc -- ue-template ue ue-course program-ue`

---

## Phase 6: UI — Dialogue d'import ⏳ (~3h)

> Avant de coder les composants, lire via `summary/ue-template.json` pour voir les actions disponibles.

- [ ] T029 Créer `apps/web/src/components/ue-template/UETemplateFilters.tsx` : selects cascades (pays → domaine → mention → spécialité → semestre)
- [ ] T030 Créer `apps/web/src/components/ue-template/UETemplateList.tsx` : liste des UE filtrées, badge "Déjà importé"
- [ ] T031 Créer `apps/web/src/components/ue-template/UETemplateImportDialog.tsx` : Dialog shadcn/ui + bouton "Importer X UE"
- [ ] T032 Hook `hooks/data/ue-template/useImportUETemplate.ts` pour state + invalidation cache
- [ ] T033 Intégrer bouton "Importer depuis référentiel" dans la page programme académique

**Checkpoint** ✋ : Flow complet testé en dev — filtrer catalogue Togo, sélectionner 2 UE, importer dans programme, badge "Déjà importé".

---

## Phase 7: Service_Context + Polish ⏳

- [ ] T034 Mettre à jour `SERVICE_CONTEXT.md` : ajouter les 4 modèles → owner `ue-template`
- [ ] T035 `npm run check:naming:svc -- ue-template` — corriger violations
- [ ] T036 `npm run check:types:svc -- ue-template` — corriger hors `types.ts`
- [ ] T037 Mettre à jour `docs/rapport/2026-08-06-feature-ue-templates.md` : marquer feature complète

---

## Dépendances & ordre d'exécution

```
Phase 0 (Migration credits) ─┐
                              ↓ BLOQUE migration DB
Phase 1 (Schéma Prisma) ─────┘
    ↓
Phase 2 (Service ue-template) ←── Phase 3 (Extension ue) [parallèle possible]
    ↓                                     ↓
Phase 4 (Seed Togo 2022)        Phase 5 (Générateurs)
    ↓
Phase 6 (UI) ← dépend Phase 5
    ↓
Phase 7 (Polish)
```

---

## Progression

| Phase | Status | Notes |
|-------|--------|-------|
| 0 — Migration credits | ⏰ | T001 ✅, T002–T004 bloqués (DB offline) |
| 1 — Schéma Prisma | ⏰ | T005/T006/T008 ✅, T007 bloqué (DB offline) |
| 2 — Service ue-template | ⏰ | Fichiers créés manuellement — T013b/T015/T018 restants |
| 3 — Extension ue | ⏰ | T021 ✅, T022 restant |
| 4 — Seed Togo 2022 | ⏳ | |
| 5 — Générateurs | ⏳ | |
| 6 — UI | ⏳ | |
| 7 — Polish | ⏳ | |

**Légende** : ⏳ Non démarré · ⏰ En cours · ✅ Terminé

---

## Corrections à appliquer (session courante)

1. **T013b** : créer `database/import.mutations.ts` avec l'orchestration cross-service
2. **T015** : réécrire `actions/template.mutations.ts` pour appeler `../database` uniquement
3. **T018** : supprimer `types.ts` manuel + lancer `npm run generate:types:svc -- ue-template`
4. **T009** : lancer `--force` sur le générateur pour valider la conformité du scaffold
