// src/services/invitation/direction/index.ts

/**
 * Service d'invitation des membres de la direction académique
 * 
 * Ce service permet d'inviter des membres de la direction avec des fonctions spécifiques.
 * Les fonctions sont assignées via le modèle UserFunction lors de l'acceptation de l'invitation.
 */

export { inviteDirection } from "./actions";
export type { InviteDirectionParams, DirectionFunction } from "./types";
export { inviteDirectionSchema } from "./validation";
export type { InviteDirectionInput } from "./validation";
export { checkFunctionsExist, getFunctionsByNames, allFunctionsExist } from "./database";

