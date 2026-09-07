'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getFunctions, getFunctionByName , getFunctionProfiles, getUserFunctions } from '../database'
import { getUserFunctionsSchema } from '../validation'
import type { GetUserFunctionsInput } from '../validation'

export async function getFunctionsAction() {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getFunctions(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getFunctionByNameAction(name: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data
  try {
    const data = await getFunctionByName(name, orgId)
    if (!data) return { error: 'Fonction introuvable' }
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}


export async function getFunctionProfilesAction(functionId: string) {

    if (!functionId) throw new Error("ID de fonction manquant")

    const auth = await authAccess({ requiredRole: 'DIRECTION' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data
  try {
    const profiles = await getFunctionProfiles({ functionId, orgId });
    return { data: profiles };
  } catch (error) {
    console.error("Erreur récupération profils par fonction:", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}




// Fonctions d'un utilisateur CIBLÉ — admin only, userId validé (uuid).
export async function getUserFunctionsAction(input: GetUserFunctionsInput) {
  const auth = await authAccess({ requiredRole: 'ADMIN' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(getUserFunctionsSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await getUserFunctions({ userId: parsed.output.userId, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// Fonctions de l'utilisateur COURANT — pas de rôle requis, pas d'userId en input
// (dérivé du token via authAccess, jamais du client — même contrainte que orgId).
export async function getCurrentUserFunctionsAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data

  try {
    return { data: await getUserFunctions({ userId: user.id, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}