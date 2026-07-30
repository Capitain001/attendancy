//src/config/data.ts

import { RESOURCE_ICONS, ResourceIconName } from "@/components/icons/generated"

export { RESOURCE_ICONS, type ResourceIconName }

export const CONFIG = {
  EARLY_CHECK_IN_MINUTES: 15,
  MAX_LATE_CHECK_IN_MINUTES: 30,
  REFETCH_INTERVAL: 2 * 60 * 1000, // 2 minutes
  TIME_UPDATE_INTERVAL: 60000, // 1 minute
};


/**
 * Fonctions principales du système
 * Source unique de vérité
 */
export const MAIN_FUNCTIONS = [
  {
    name: "PRINCIPAL",
    description: "Chef d'établissement, responsable de la gestion globale de l'institution et de la supervision du personnel.",
    icon: "principal.svg",
  },
  {
    name: "SECRETARY",
    description: "Secrétaire administratif, gestion des dossiers, de la correspondance et des tâches administratives courantes.",
    icon: "secretary.svg",
  },
  {
    name: "ASSISTANT",
    description: "Assistant administratif, support opérationnel des tâches déléguées par les responsables.",
    icon: "assistant.svg",
  },
  {
    name: "DELEGATE",
    description: "Délégué de classe, représente des élèves en liaison avec l'administration.",
    icon: "delegate.svg",
  },
  {
    name: "COORDINATOR",
    description: "Coordinateur pédagogique ou Responsable de discipline",
    icon: "coordinator.svg",
  },
  {
    name: "MEMBER",
    description: "Membre de l'administration pédagogique",
    icon: "member.svg",
  },
] as const;

/**
 * Type sécurisé dérivé automatiquement
 * inclue SUPER_ADMIN (admin principal) + les fonctions principales pedagogiques
 */
export type FunctionName = (typeof MAIN_FUNCTIONS)[number]["name"] | "SUPER_ADMIN";

/**
 * Type complet d'une fonction
 */
export type MainFunction = (typeof MAIN_FUNCTIONS)[number];

/**
 * Helper optionnel : vérifie si une fonction est admin
 */
export function isSuperAdmin(fn: FunctionName): boolean {
  return fn === "SUPER_ADMIN" ;
}


export const FUNCTIONS = MAIN_FUNCTIONS.reduce((acc, f) => {
  acc[f.name] = f.name;
  return acc;
}, {} as Record<FunctionName, FunctionName>);



export const RESOURCE_BASE_PATH = "/assets/resources" as const

