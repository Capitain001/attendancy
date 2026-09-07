import * as v from 'valibot'

// Partagé par suspend, activate et reintegrate : les trois n'ont besoin
// que de l'id de l'utilisateur ciblé — orgId vient toujours de l'org de
// l'acteur authentifié (auth.data.orgId côté action), jamais d'un input
// client.
export const targetUserOrganizationSchema = v.object({
  userId: v.pipe(v.string(), v.uuid('ID utilisateur invalide')),
})

export type TargetUserOrganizationInput = v.InferInput<typeof targetUserOrganizationSchema>
export type TargetUserOrganizationOutput = v.InferOutput<typeof targetUserOrganizationSchema>

// Alias nommés pour la lisibilité au point d'appel (même schéma, trois flux
// métier distincts : suspendre, activer, et réintégrer un INACTIVE ne sont
// pas la même décision).
export const suspendOrgUserSchema = targetUserOrganizationSchema
export const activateOrgUserSchema = targetUserOrganizationSchema
export const reintegrateUserOrganizationSchema = targetUserOrganizationSchema

export type SuspendOrgUserInput = TargetUserOrganizationInput
export type ActivateOrgUserInput = TargetUserOrganizationInput
export type ReintegrateUserOrganizationInput = TargetUserOrganizationInput