// src/modules/invitation/student/validation.ts
import * as v from "valibot";
import { DELIVERY_METHODS } from "../constants";

/**
 * Schéma de validation pour les paramètres d'invitation d'étudiant
 */
export const inviteStudentSchema = v.object({
  email: v.pipe(
    v.string(),
    v.email("Format d'email invalide")
  ),

  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),

  classId: v.pipe(
    v.string(),
    v.nonEmpty("L'ID de la classe est requis")
  ),

  expiresInDays: v.optional(
    v.pipe(
      v.number(),
      v.picklist([1, 3, 7, 14, 30], "La durée doit être 1, 3, 7, 14 ou 30 jours")
    )
  ),

  // ✅ tableau de groupIds
  groupIds: v.optional(
    v.array(
      v.pipe(v.string(), v.nonEmpty("Un ID de groupe est invalide"))
    )
  ),

  parentEmail: v.optional(
    v.pipe(v.string(), v.email("Format d'email invalide pour le parent"))
  ),

  deliveryMethod: v.optional(
    v.picklist(DELIVERY_METHODS, "Le mode de remise doit être 'email' ou 'link'")
  ),
});

export type InviteStudentInput = v.InferInput<typeof inviteStudentSchema>;

export const bulkStudentItemSchema = v.object({
  email: v.pipe(
    v.string(),
    v.trim(),
    v.toLowerCase(),
    v.email("Format d'email invalide")
  ),
  firstName: v.optional(v.pipe(v.string(), v.trim())),
  lastName: v.optional(v.pipe(v.string(), v.trim())),
  parentEmail: v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.toLowerCase(),
      v.email("Format d'email invalide pour le parent")
    )
  ),
});

export const inviteStudentsBulkSchema = v.object({
  classId: inviteStudentSchema.entries.classId,
  expiresInDays: inviteStudentSchema.entries.expiresInDays,
  groupIds: inviteStudentSchema.entries.groupIds,
  deliveryMethod: inviteStudentSchema.entries.deliveryMethod,
  students: v.pipe(
    v.array(bulkStudentItemSchema),
    v.minLength(1, "Sélectionnez au moins un étudiant"),
    v.maxLength(50, "Maximum 50 invitations par envoi")
  ),
});

export type InviteStudentsBulkInput = v.InferInput<typeof inviteStudentsBulkSchema>;
