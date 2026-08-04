'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getFunctions, getFunctionByName , getFunctionProfiles } from '../database'

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