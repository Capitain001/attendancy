# Scénarios d'utilisation du référentiel national

Ce schéma modélise un **référentiel national de formations** et son application dans les organisations.

Le référentiel est indépendant des données métier d'une organisation. Il contient les programmes nationaux, leurs UE et leurs EC. Lorsqu'une organisation applique un programme, les entités métier correspondantes sont créées dans son propre contexte.

---

## 1. Structure générale

Le point d'entrée du référentiel est `Referential`.

Un `Referential` représente une **version donnée d'un catalogue national**.

```text
Referential
│
├── ProgramTemplate
│   │
│   └── ProgramUETemplate
│       │
│       └── UETemplate
│           │
│           └── UETemplateEC
│
└── UETemplate
```

Les relations avec les données métier d'une organisation sont conservées séparément :

```text
ProgramTemplate
      │
      ▼
OrgProgramTemplate
      │
      ├── departmentId
      ├── trackId
      └── programId


UETemplate
      │
      ▼
OrgUETemplate
      │
      └── ueId
```

`orgId`, `departmentId`, `trackId`, `programId` et `ueId` sont volontairement de simples UUID de traçage. Ils ne constituent pas des relations Prisma vers les entités métier.

---

# 2. Visualisation du catalogue national

**Acteur** : Administrateur pédagogique / Responsable des programmes

### Flow

1. L'utilisateur sélectionne un `Referential`.
2. Il consulte les `ProgramTemplate` disponibles.
3. Il peut filtrer par :

   * `domain`
   * `mention`
   * `specialty`
   * `degree`
4. Il sélectionne un programme.
5. Il visualise son contenu pédagogique :

   * UE par semestre ;
   * type de chaque UE ;
   * EC de chaque UE ;
   * crédits ;
   * métadonnées du programme.

Il n'existe pas de modèles séparés `Domain`, `Mention` ou `Specialty` dans le référentiel.

Ces informations sont directement portées par `ProgramTemplate` :

```text
ProgramTemplate
├── domain
├── mention
├── specialty
└── degree
```

Cela évite de créer des tables uniquement pour reproduire une structure hiérarchique présente dans le document national.

---

## 2.1. Exemple

```text
Referential
└── ProgramTemplate
    domain    = "SHS"
    mention   = "Travail Social"
    specialty = "Assistance Sociale"
    degree    = LICENCE_PROFESSIONNELLE
```

Le programme contient ensuite :

```text
ProgramTemplate
│
├── profile
├── competencies
├── outcomes
│
└── ProgramUETemplate
    ├── semester = 1
    │   └── UETemplate
    │       └── UETemplateEC[]
    │
    ├── semester = 2
    │   └── UETemplate
    │
    └── ...
```

---

## 2.2. Requête Prisma

```typescript
const program = await prisma.programTemplate.findUnique({
  where: {
    id: programTemplateId,
  },
  include: {
    referential: true,
    programUEs: {
      orderBy: [
        { semester: 'asc' },
        { order: 'asc' },
      ],
      include: {
        ueTemplate: {
          include: {
            elements: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    },
  },
})
```

Le résultat permet d'obtenir le programme complet avec ses UE et leurs EC.

---

# 3. Sélection des templates

**Acteur** : Administrateur pédagogique

L'utilisateur sélectionne les programmes nationaux qu'il souhaite appliquer à son organisation.

### Flow

1. Sélection d'un `Referential`.
2. Sélection d'un ou plusieurs `domain`.
3. Filtrage éventuel par `mention`.
4. Sélection d'une ou plusieurs `specialty`.
5. Confirmation de l'application.

### Exemple d'interface

```text
☑ Sciences de l'Homme et de la Société (SHS)
  ☑ Travail Social
    ☑ Assistance Sociale
    ☑ Développement Local Participatif
    ☑ Éducation Spécialisée
  ☑ Philosophie

☐ Lettres, Langues et Arts (LLA)

☐ Sciences et Technologies (ST)
```

La sélection finale correspond à un ensemble de `ProgramTemplate`.

---

# 4. Application d'un ProgramTemplate

**Acteur** : Administrateur pédagogique ou job automatisé

L'utilisateur clique sur **« Appliquer »**.

Le système prend un `ProgramTemplate` national et crée ou réutilise les entités métier correspondantes dans l'organisation.

## 4.1. Création des entités métier

| Étape | Entité métier  | Source nationale            | Recherche / mutualisation |
| ----- | -------------- | --------------------------- | ------------------------- |
| 1     | `Department`   | `ProgramTemplate.domain`    | `name` + `orgId`          |
| 2     | `ProgramTrack` | `ProgramTemplate.mention`   | `name` + `departmentId`   |
| 3     | `Program`      | `ProgramTemplate.specialty` | `name` + `programTrackId` |
| 4     | `UE`           | `UETemplate.code`           | `code` + `orgId`          |
| 5     | `UECourse`     | `UETemplateEC`              | `(ueId, order)`           |
| 6     | `ProgramUE`    | `ProgramUETemplate`         | `(programId, ueId)`       |

Aucun `Course` opérationnel n'est créé à cette étape.

---

## 4.2. Traçage du programme

Après l'application, une entrée `OrgProgramTemplate` est créée :

```text
Organization
     │
     │ orgId
     ▼
OrgProgramTemplate
     │
     ├── programTemplateId
     │       │
     │       ▼
     │  ProgramTemplate
     │
     ├── departmentId
     ├── trackId
     └── programId
```

`OrgProgramTemplate` permet donc de savoir :

* quel `ProgramTemplate` a été appliqué ;
* dans quelle organisation ;
* quel `Department` a été créé ;
* quel `ProgramTrack` a été créé ;
* quel `Program` a été créé.

Les IDs métier sont stockés comme de simples UUID de traçage.

---

# 5. Mutualisation des UETemplate

Une même `UETemplate` peut être utilisée par plusieurs `ProgramTemplate`.

Exemple :

```text
UETemplate
ANG1160 — Grammaire anglaise
│
├── ProgramTemplate A
├── ProgramTemplate B
└── ProgramTemplate C
```

Lors de l'application dans une organisation, le système recherche l'UE métier existante avant d'en créer une nouvelle.

```text
UETemplate
    │
    ├── Organization A
    │      └── UE métier A
    │
    ├── Organization B
    │      └── UE métier B
    │
    └── Organization C
           └── UE métier C
```

---

# 6. Traçage des UETemplate utilisés

`OrgUETemplate` permet de conserver la correspondance entre :

* une organisation ;
* une `UETemplate` nationale ;
* l'`UE` métier correspondante.

```text
UETemplate
    │
    ▼
OrgUETemplate
    ├── orgId
    └── ueId
          │
          ▼
       UE métier
```

Le modèle ne possède volontairement **pas de FK vers `Organization` ni vers `UE`**.

La seule relation Prisma est :

```text
OrgUETemplate
      │
      │ templateId
      ▼
UETemplate
```

Cela permet notamment de retrouver les organisations utilisant un template :

```typescript
const template = await prisma.uETemplate.findUnique({
  where: {
    id: templateId,
  },
  include: {
    orgUETemplates: true,
  },
})
```

Chaque entrée permet ensuite d'identifier l'organisation via `orgId` et l'UE métier via `ueId`.

---

# 7. Idempotence et réapplication

L'application d'un même `ProgramTemplate` doit être idempotente.

Si l'administrateur applique deux fois le même programme :

```text
Application 1
    ↓
Création des entités métier

Application 2
    ↓
Réutilisation des entités existantes
```

Le système ne doit pas créer de doublons.

La contrainte suivante garantit qu'une organisation ne peut avoir qu'un seul rattachement vers un `ProgramTemplate` :

```prisma
@@unique([orgId, programTemplateId])
```

De même, pour une UE :

```prisma
@@unique([templateId, orgId])
```

garantit une seule correspondance entre une organisation et une `UETemplate`.

---

# 8. Application d'un domaine entier

L'application peut porter sur tous les programmes d'un domaine.

Exemple :

```typescript
async function applyDomain(
  orgId: string,
  referentialId: string,
  domain: string,
) {
  const programs = await prisma.programTemplate.findMany({
    where: {
      referentialId,
      domain,
    },
    include: {
      programUEs: {
        include: {
          ueTemplate: {
            include: {
              elements: true,
            },
          },
        },
      },
    },
  })

  for (const program of programs) {
    await applyProgramTemplate(orgId, program.id)
  }
}
```

Le `referentialId` est obligatoire dans cette opération afin d'identifier précisément la version du catalogue utilisée.

---

# 9. Référentiels et versions

`Referential` constitue la racine du catalogue national.

Exemple :

```text
Referential
│
├── name    = "Curricula harmonisés 2022"
├── version = "2022-04"
├── country = "TG"
├── issuer  = "MESRS-Togo"
│
├── ProgramTemplate[]
└── UETemplate[]
```

Une nouvelle version du catalogue peut être enregistrée comme un nouveau `Referential`.

```text
Referential 2022
├── ProgramTemplate A
├── ProgramTemplate B
└── UETemplate X


Referential 2025
├── ProgramTemplate A'
├── ProgramTemplate C
└── UETemplate X'
```

Les versions restent ainsi indépendantes.

L'organisation peut continuer à utiliser les templates issus d'une ancienne version sans que l'ajout d'un nouveau référentiel modifie automatiquement les données existantes.

---

# 10. Cas particuliers

## 10.1. Réapplication d'un programme

L'administrateur réapplique un `ProgramTemplate` déjà utilisé.

Résultat :

* les entités métier existantes sont réutilisées ;
* les entités manquantes sont créées ;
* aucun doublon de `OrgProgramTemplate` n'est créé ;
* les `UE` existantes peuvent être mutualisées ;
* aucun nouveau `Course` opérationnel n'est créé.

---

## 10.2. Application de plusieurs domaines

| Sélection                   | Résultat                                                  |
| --------------------------- | --------------------------------------------------------- |
| **1 domaine** (`SHS`)       | Application de tous les `ProgramTemplate` du domaine      |
| **Plusieurs domaines**      | Application des programmes des domaines sélectionnés      |
| **1 mention**               | Application des programmes correspondant à la mention     |
| **Spécialités spécifiques** | Application uniquement des `ProgramTemplate` sélectionnés |

---

## 10.3. Désactivation d'un programme

Le schéma actuel **ne possède pas de champ `status` sur `OrgProgramTemplate`**.

Il ne faut donc pas considérer `OrgProgramTemplate` comme une table d'état ou d'activation.

Elle représente uniquement le rattachement :

```text
Organization
      ↕
ProgramTemplate
```

Si une fonctionnalité de désactivation doit être ajoutée ultérieurement, elle devra être modélisée explicitement dans le modèle concerné.

---

# 11. Ce qui est créé lors de l'application

Lorsqu'un `ProgramTemplate` est appliqué :

```text
ProgramTemplate
      │
      ├── Department
      │
      ├── ProgramTrack
      │
      ├── Program
      │
      └── ProgramUETemplate
             │
             └── UETemplate
                    │
                    └── UETemplateEC
```

Les entités métier produites sont :

```text
Department
ProgramTrack
Program
UE
UECourse
ProgramUE
```

Les tables de traçage sont :

```text
OrgProgramTemplate
OrgUETemplate
```

---

# 12. Ce qui n'est PAS créé

L'application du référentiel ne crée pas :

```text
❌ Course
❌ Session
❌ Schedule
❌ Class
```

Ces objets appartiennent au fonctionnement opérationnel de l'organisation.

En particulier, un `Course` ne représente pas simplement un EC national : il s'agit d'une instance opérationnelle qui intervient plus tard dans le cycle métier.

---

# 13. Récapitulatif

| Scénario                  | Données concernées                                                     | Résultat                                |
| ------------------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| Visualisation             | `Referential`, `ProgramTemplate`, `UETemplate`, `UETemplateEC`         | Lecture seule                           |
| Sélection                 | `ProgramTemplate`                                                      | Sélection des formations                |
| Application               | `Department`, `ProgramTrack`, `Program`, `UE`, `UECourse`, `ProgramUE` | Création / réutilisation                |
| Traçage programme         | `OrgProgramTemplate`                                                   | Programme national ↔ organisation       |
| Traçage UE                | `OrgUETemplate`                                                        | UE nationale ↔ organisation ↔ UE métier |
| Réapplication             | Entités existantes                                                     | Pas de doublons                         |
| Nouvelle version          | `Referential`                                                          | Nouveau catalogue indépendant           |
| Désactivation             | —                                                                      | Non modélisée actuellement              |
| Instances opérationnelles | `Course`, `Session`, etc.                                              | Créées ultérieurement                   |

---

## Résumé métier

L'administrateur sélectionne une version du **catalogue national (`Referential`)**, puis choisit les `ProgramTemplate` correspondant aux formations qu'il souhaite utiliser dans son organisation.

L'application d'un `ProgramTemplate` transforme sa structure nationale en structure métier :

```text
                    Referential
                         │
                  ProgramTemplate
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
     Program métier                UETemplate
          │                             │
          │                        UETemplateEC
          │
     ProgramUE métier
```

Les correspondances avec le référentiel sont conservées par :

```text
OrgProgramTemplate
OrgUETemplate
```

Ainsi, le référentiel national reste **indépendant des données métier des organisations**, tout en permettant de savoir précisément **quel template a été utilisé pour produire quelle donnée métier**.

Les instances opérationnelles (`Course`, `Session`, `Schedule`, etc.) sont créées ultérieurement dans le cycle de vie métier et ne font pas partie de l'application du référentiel.
