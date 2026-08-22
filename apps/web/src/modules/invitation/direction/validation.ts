// src/services/invitation/direction/validation.ts
import * as v from "valibot";
import { DELIVERY_METHODS } from "@/modules/invitation/constants";
 
/**
 * Schéma de validation pour les paramètres d'invitation de direction
 */
export const inviteDirectionSchema = v.object({
  email: v.pipe(
    v.string(),
    v.email("Format d'email invalide")
  ),
  name: v.optional(v.string()),
  functions: v.array(
    v.string(),
    "Au moins une fonction doit être spécifiée"
  ),
  permissions: v.optional(v.array(v.string())),
  deliveryMethod: v.optional(
    v.picklist(DELIVERY_METHODS, "Le mode de remise doit être 'email' ou 'link'")
  ),
});
 
export type InviteDirectionInput = v.InferInput<typeof inviteDirectionSchema>;
 