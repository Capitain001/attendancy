# Feature Specification: Templates UE Référentiel National

**Feature Branch**: `ue-national-templates`  
**Input**: `docs/rapport/2026-08-06-feature-ue-templates.md`

---

## Context and Understanding

Les universités togolaises doivent aujourd'hui créer manuellement chaque Unité d'Enseignement (UE) et ses Éléments Constitutifs (EC), alors qu'un référentiel national standardisé existe (Curricula harmonisés, MESRS Togo, Avril 2022). Ce référentiel couvre 8 domaines LMD, des mentions, des spécialités, 6 semestres de Licence, avec codes, crédits et types normalisés.

L'absence de templates oblige chaque établissement à ressaisir des centaines d'UE identiques, avec des risques d'erreur (codes incorrects, crédits mal reportés) et une perte de temps significative lors de la configuration initiale.

L'objectif est de permettre à une université togolaise de sélectionner un template national et d'importer en une opération les UE de son programme, tout en gardant la liberté de personnalisation post-import.

---

## Feature Description

Le système expose un **catalogue de référentiels nationaux** (commençant par le Togo 2022, extensible à d'autres pays et organismes). Une direction peut naviguer dans ce catalogue — par domaine, mention, spécialité, semestre — sélectionner les UE souhaitées et les importer dans son programme. L'import crée les UE et leurs Éléments Constitutifs (UECourse) dans le périmètre de l'établissement. Un historique des imports traçe la correspondance template ↔ UE locale et empêche les doublons.

---

## Requirements

### Proposed Solution

- **US-001** : En tant que direction, je peux accéder à un catalogue de référentiels nationaux filtrable par pays, domaine LMD, mention, spécialité et semestre, afin de trouver rapidement les UE correspondant à mon programme.

- **US-002** : En tant que direction, je peux sélectionner une ou plusieurs UE du catalogue et les importer dans un programme existant d'un seul geste, afin d'éviter la ressaisie manuelle.

- **US-003** : En tant que direction, si une UE importée partage le même code qu'une UE existante dans mon organisation, je reçois un avertissement explicite et l'import est bloqué pour ce code, afin d'éviter les conflits silencieux.

- **US-004** : En tant que direction, je vois quelles UE ont déjà été importées depuis le référentiel (badge "Déjà importé"), afin de ne pas créer de doublons accidentels.

- **US-005** : En tant que direction, je peux supprimer un import (archiver la UE importée) depuis l'interface, afin de garder mon catalogue propre.

- **US-006** : En tant qu'administrateur système, je peux ajouter un nouveau référentiel national (autre pays, nouvelle version) sans modifier le code applicatif, via un script de seed.

### Functional Requirements

- **FR-001** : Le système DOIT exposer un catalogue global de templates UE, non scopé par organisation, alimenté par des référentiels nationaux.

- **FR-002** : Le système DOIT permettre de filtrer les templates par : pays, référentiel/version, domaine, niveau (Licence/Master), mention, spécialité, semestre.

- **FR-003** : L'import d'un template DOIT créer dans le périmètre de l'organisation : une `UE` (nom, code), une `UECourse` par Élément Constitutif (nom, code, crédits), et un `ProgramUE` liant l'UE au `Program` cible avec le semestre correspondant.

- **FR-004** : L'import DOIT être bloqué si le code de l'UE existe déjà dans l'organisation (`UE.@@unique([code, orgId])`), avec un message d'erreur explicite.

- **FR-005** : L'import DOIT être idempotent par couple `(template, organisation)` — réimporter le même template sur la même org est bloqué avec message explicite (pas de doublon silencieux).

- **FR-006** : Le système DOIT tracer chaque import dans un historique `(templateId, orgId, ueId)` pour permettre l'affichage du badge "Déjà importé".

- **FR-007** : Les crédits des Éléments Constitutifs DOIVENT supporter les valeurs décimales (ex : 1.5, 2.5 crédits). Migration requise : `UECourse.credits Int → Decimal(4,2)`.

- **FR-008** : Le code d'une UE template DOIT pouvoir être nul pour les UE de type LIBRE.

- **FR-009** : L'import DOIT obligatoirement cibler un `Program` existant et un semestre — le `ProgramUE` est créé dans la foulée.

- **FR-010** : Le système DOIT permettre la suppression d'un import (archivage `deletedAt` de l'UE) avec contrôle des dépendances (ProgramUE, UECourse).

- **FR-011** : L'ajout d'un référentiel d'un nouveau pays DOIT ne nécessiter aucune modification du code applicatif — uniquement un nouveau script de seed.

- **FR-012** : Deux versions d'un même référentiel (v2022, v2023) sont indépendantes — une org peut importer depuis l'une ou l'autre sans contrainte.

---

## Success Criteria

### Measurable Outcomes

- **SC-001** : Une direction peut importer 10 UE d'un même semestre en moins de 3 clics depuis la page programme.

- **SC-002** : Aucun doublon de code UE n'est créé silencieusement — toute tentative produit un message d'erreur lisible.

- **SC-003** : Le catalogue affiche l'intégralité des UE du référentiel Togo 2022 (8 domaines, toutes mentions/spécialités, semestres 1–6).

- **SC-004** : L'ajout du référentiel Bénin ne nécessite qu'un nouveau fichier seed, sans toucher au code ni aux migrations.

- **SC-005** : Les crédits décimaux du référentiel (ex : 1.5 cr) sont préservés sans troncature après import.

---

## Clarification Needed

*Toutes les questions ont été répondues.*

| Question | Réponse |
|----------|---------|
| Périmètre import V1 | UE + UECourse + Program + ProgramUE — le Program est la représentation des UE |
| UE Libre sans code | `UETemplate.code` nullable |
| Suppression d'import | In scope V1 — action dédiée avec contrôle dépendances |
| Réimport nouvelle version | Deux versions = deux templates indépendants (unicité par templateId) |

---

## Notes

- Le référentiel Togo 2022 sera seedé via `scripts/seed/referential-togo-2022.ts` — données en lecture seule, jamais éditables via UI.
- L'architecture est conçue pour être multi-pays dès V1 (`NationalReferential.country: String ISO 3166-1`).
- Les crédits décimaux nécessitent une migration du champ `UECourse.credits: Int → Decimal(4,2)` — cette migration impacte le schéma existant et doit précéder l'implémentation des templates.
- Les audits de schéma et fonctionnel ont identifié 0 point bloquant architectural — plan cohérent avec l'existant.
- Scope V2 (hors cette session) : suppression d'import, comparateur de dérive versioning, audit de conformité org/référentiel.
