# Plan — Templates UE référentiel national
**Date :** 2026-08-06

---

## Contexte

Le Togo a défini un référentiel national standardisé (Curricula harmonisés, Avril 2022, MESRS) couvrant 8 domaines LMD. Le besoin : permettre à une université togolaise de sélectionner un **template** basé sur ce référentiel et d'importer les UE qu'elle souhaite utiliser, sans les recréer manuellement.

---

## Réponses aux questions de conception

| Question | Réponse |
|----------|---------|
| ECs → `Course` ? | **Non.** `Course` est lié à une classe (groupe d'étudiants), créé lors de l'application d'un `Program` à une classe. À l'import, on crée `UE` + `UECourse` par EC. |
| Schéma Prisma séparé ? | **Oui.** Nouveau fichier `prisma/schemas/referential.prisma`. |
| `credits` sur `UE` ? | `UE` n'a pas de champ `credits`. Les crédits sont sur `UECourse` (champ `credits: Int`). Les EC du référentiel mappent directement sur `UECourse`. |

---

## Mapping référentiel → modèles existants

```
UETemplate        →  UE          (name, code, orgId)
UETemplateEC      →  UECourse    (name, code, credits, ueId, orgId)
UETemplate.semester → ProgramUE  (semester) si programId fourni
Course            →  créé ultérieurement (application Program → Classe)
```

---

## 1. Modèle de données (`prisma/schemas/referential.prisma`)

```prisma
model NationalReferential {
  id          String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  country     String       // "TG" (ISO 3166-1)
  issuer      String       // "MESRS-Togo"
  name        String       // "Curricula harmonisés 2022"
  version     String       // "2022-04"
  isActive    Boolean      @default(true)
  publishedAt DateTime
  templates   UETemplate[]
}

model UETemplate {
  id            String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  referentialId String              @db.Uuid
  referential   NationalReferential @relation(fields: [referentialId], references: [id])

  domain        String   // "LLA", "SHS", "ST"…
  degree        String   // "LICENCE", "MASTER"
  mention       String   // ex: "Traduction"
  speciality    String?  // ex: "Anglais-Français-Anglais"
  semester      Int      // 1–6

  code          String   // "ANG 1160"
  name          String
  type          UETemplateType
  credits       Int      // crédits totaux de l'UE (info référentiel)

  elements      UETemplateEC[]
  imports       UETemplateImport[]

  @@unique([referentialId, code])
}

model UETemplateEC {
  id         String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  templateId String     @db.Uuid
  template   UETemplate @relation(fields: [templateId], references: [id])
  code       String     // "1ANG1160"
  name       String?
  credits    Float      // crédits de l'EC
}

enum UETemplateType {
  FONDAMENTALE
  COMPLEMENTAIRE
  APPROFONDISSEMENT
  SPECIALITE
  TRANSVERSALE
  LIBRE
}

model UETemplateImport {
  id         String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  templateId String     @db.Uuid
  template   UETemplate @relation(fields: [templateId], references: [id])
  orgId      String     @db.Uuid
  ueId       String     @db.Uuid  // UE créée dans l'org
  importedAt DateTime   @default(now())
  @@unique([templateId, orgId])
}
```

---

## 2. Service `ue-template` (nouveau)

Owner de `NationalReferential`, `UETemplate`, `UETemplateEC`, `UETemplateImport`.

```
services/ue-template/
  CLAUDE.md
  index.ts
  actions/
    index.ts
    referential.queries.ts   # getReferentialsAction, getTemplatesBySpecialityAction
    template.mutations.ts    # importUEFromTemplateAction
  database/
    index.ts
    referential.queries.ts   # getReferentials, getUETemplates (filtres: country, domain, mention, speciality, semester)
    template.mutations.ts    # createUETemplateImport
  cache.ts                   # UE_TEMPLATE_GRAPH (cache global, pas scoped orgId)
  validation.ts
  types.ts
```

### Action principale

```ts
// importUEFromTemplateAction(templateId, programId?, semester?)
// Orchestre :
// 1. createUEAction({ name, code, orgId })          — service ue (owner UE)
// 2. createUECourseAction par EC                    — service ue-course (owner UECourse)
// 3. addUEToProgramAction({ ueId, programId, semester }) — si programId fourni
// 4. createUETemplateImport({ templateId, orgId, ueId }) — interne
```

---

## 3. Seed — données Togo 2022

Fichier : `apps/web/scripts/seed/referential-togo-2022.ts`

- Insère 1 `NationalReferential` (country: "TG", version: "2022-04")
- Insère toutes les `UETemplate` + `UETemplateEC` depuis le résumé
- Idempotent : `upsert` sur `@@unique([referentialId, code])`
- Commande : `bun run seed:referential` (à ajouter dans `package.json`)

---

## 4. UI — sélection et import

Emplacement : section académique (direction) — page programme/filière.

Bouton **"Importer depuis un référentiel"** → Dialog :
1. Sélecteur pays → référentiel (ex: "Curricula harmonisés Togo 2022")
2. Sélecteur domaine → mention → spécialité → semestre
3. Liste des UEs disponibles (code · nom · type · crédits · ECs)
4. Sélection multiple + bouton "Importer X UE"
5. Badge "Déjà importé" si `UETemplateImport` existe pour l'org

---

## 5. Mises à jour du référentiel

Nouvelle version = nouveau `NationalReferential` (`version: "2023-01"`). Les imports existants pointent vers l'ancienne version — inchangés. L'org peut réimporter depuis la nouvelle version : `UETemplateImport.@@unique([templateId, orgId])` empêche le doublon sur la même version.

---

## 6. Multi-pays / multi-organisme

Zéro changement de code pour ajouter un nouveau pays : nouveau seed (`country: "BJ"`, issuer: "MESRS-Bénin"). `NationalReferential.country` + `issuer` suffisent à discriminer.

---

## Ordre d'implémentation

1. Migration Prisma — `referential.prisma` + migration SQL
2. Service `ue-template` — scaffold + database/ + actions/
3. Script seed Togo 2022
4. UI — dialog import dans la section programme
5. `generate:api:svc -- ue-template` + `api:check`
