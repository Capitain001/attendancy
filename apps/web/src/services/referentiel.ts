// src/services/referentiel.ts
//
// Point d'entrée du référentiel des services de src/services/ — LIRE CE
// FICHIER avant d'aller chercher dans src/generated/referentiel.ts.
//
// Deux catégories, jamais une troisième :
//
// 1. SERVICE MODÈLE (MODEL) — 1 service = 1 modèle Prisma (règle d'or, voir
//    SKILL.md service-module-pattern). Le dossier ne contient QUE la
//    logique CRUD/lecture de CE modèle. `prisma.<model>` n'est appelé nulle
//    part ailleurs dans la codebase que dans ce dossier.
//
// 2. SERVICE DOMAINE (DOMAIN) — orchestrateur : compose plusieurs services
//    modèles pour livrer une fonctionnalité métier qui dépasse un seul
//    modèle. Ne possède PAS de modèle Prisma propre — importe les
//    `actions/` d'autres services, jamais leur `database/`.
//
// ─── Ce que ce fichier ré-exporte de src/generated/referentiel.ts ────────
//
//   ServiceType       — l'enum 'MODEL' | 'DOMAIN'.
//   MODEL_SERVICES    — { [dossier]: { model, path } }, un par service MODEL.
//   getServiceType()  — folderName -> ServiceType | null.
//
// (voir CONTEXT.md pour la mécanique de génération de ces trois exports —
// ils sont entièrement dérivés de la comparaison src/services/* ↔
// prisma/schemas/*.prisma, aucune donnée humaine dedans)
//
// ─── Ce que ce fichier AJOUTE (ne vient pas du généré) ───────────────────
//
//   DOMAIN_DESCRIPTIONS — texte humain : ce qu'orchestre chaque service
//     DOMAIN. Non dérivable d'un nom de dossier, donc jamais généré.
//     ⚠ Le générateur ne PEUT PAS savoir qu'un nouveau dossier DOMAIN a
//     besoin d'une description ici — lancer
//     `npx tsx scripts/generate/referentiel/check.ts` après tout ajout de
//     service pour être averti (non bloquant) d'un oubli.
//
//   SERVICES — vue de lecture recommandée. Fusionne DOMAIN_SERVICES (path,
//     généré) avec DOMAIN_DESCRIPTIONS (description, manuel) pour chaque
//     service DOMAIN — pas la peine d'aller croiser les deux objets à la
//     main au point d'appel. SERVICES.MODEL n'a pas besoin de fusion (déjà
//     complet côté généré : model + path), donc simplement ré-exposé tel
//     quel. Exemple d'usage :
//
//       import { SERVICES } from '@/services/referentiel'
//       SERVICES.MODEL.course.path            // '../course'
//       SERVICES.DOMAIN.planning.path          // '../planning'
//       SERVICES.DOMAIN.planning.description   // 'Orchestre schedule...'

import {
  ServiceType,
  MODEL_SERVICES,
  DOMAIN_SERVICES,
  getServiceType,
  type ModelServiceName,
  type DomainServiceName,
} from '@/generated/referentiel'

export { ServiceType, MODEL_SERVICES, getServiceType }
export type { ModelServiceName, DomainServiceName }

export const DOMAIN_DESCRIPTIONS: Partial<Record<DomainServiceName, string>> = {
  planning: 'Orchestre schedule, weekly-template et week-recurrence pour générer le calendrier des séances.',
  chat: 'Gère la communication, les messages et les salons de discussion.',
  curriculum: 'Gère le plan d\'études, les modules et ressources pédagogiques.',
  device: 'Gère la sécurité et l\'historique des connexions (appareils et sessions).',
  entity: 'Gestion générique des entités et métadonnées associées.',
  seed: 'Scripts et utilitaires pour peupler la base de données.',
}

// Fusion path (généré) + description (manuel). Un service DOMAIN sans
// entrée dans DOMAIN_DESCRIPTIONS obtient une description de repli
// explicite plutôt qu'un `undefined` silencieux — le repli lui-même est le
// signal qu'il faut lancer check.ts.
const domainServicesWithDescription = Object.fromEntries(
  Object.entries(DOMAIN_SERVICES).map(([folder, entry]) => [
    folder,
    {
      ...entry,
      description:
        DOMAIN_DESCRIPTIONS[folder as DomainServiceName] ??
        `⚠ Description manquante — voir DOMAIN_DESCRIPTIONS dans src/services/referentiel.ts`,
    },
  ]),
) as Record<DomainServiceName, { path: string; description: string }>

export const SERVICES = {
  MODEL: MODEL_SERVICES,
  DOMAIN: domainServicesWithDescription,
} as const