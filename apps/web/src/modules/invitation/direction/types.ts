// src/services/invitation/direction/types.ts

/**
 * Types spécifiques pour l'invitation des membres de la direction académique
 */

export interface InviteDirectionParams {
  email: string;
  name?: string;
  functions: string[]; // Noms des fonctions à assigner (ex: ["PRINCIPAL", "SECRETARY"])
  permissions?: string[]; // Permissions personnalisées (optionnel)
  deliveryMethod?: "email" | "link";
}

export interface DirectionFunction {
  id: string;
  name: string;
  description?: string;
}

