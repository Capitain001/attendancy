// src/services/user/userInfo.ts
// getUserInfo() — LE point d'entrée auth de toutes les server actions et
// pages RSC. Architecture en 3 niveaux :
//
//   1. getUserId()     — décode le JWT de session (pas d'appel réseau)
//   2. React.cache()   — déduplique dans la même requête (page + actions
//                        peuvent appeler getUserInfo() sans surcoût)
//   3. LRU process     — évite l'aller-retour Supabase entre requêtes (TTL 10 min)
//
// Sécurité : les données viennent de supabase.auth.getUser() (vérifié côté
// serveur Supabase), jamais du JWT seul. Le userId du JWT sert uniquement de
// clé de cache — un mismatch avec getUser() invalide le résultat.
//
// Effet Next.js 16 (cacheComponents/PPR) : l'accès aux cookies via
// createClient() rend l'appelant dynamique — une page RSC qui appelle
// getUserInfo() directement n'a pas besoin de `await connection()`.
import { cache } from 'react'
import { jwtDecode } from 'jwt-decode'
import { createClient } from '@/utils/supabase/server'
import type { UserInfo, UserMetadata } from './types'
import { getUser, setUser, removeUser } from './lru-cache'

export interface GetUserInfoOptions {
  /** false → bypasse le LRU (lecture fraîche, sans écrire le cache) */
  cache?: boolean
  /** true → force la lecture Supabase et met à jour le LRU */
  refresh?: boolean
}

async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return null
  const token = jwtDecode<{ sub: string }>(session.access_token)
  return token.sub ?? null
}

const fetchUserFromSupabase = cache(async (userId: string): Promise<Partial<UserInfo> | null> => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  if (user.id !== userId) {
    console.error(`[getUserInfo] userId mismatch: expected ${userId}, got ${user.id}`)
    return null
  }

  const meta: UserMetadata = user.user_metadata ?? {}

  return {
    id: user.id,
    email: user.email ?? undefined,
    role: meta.role,
    name: meta.name ?? user.email?.split('@')[0] ?? '',
    avatar_url: meta.avatar_url ?? '/avatar.png',
    function: meta.function,
    organization: meta.organization,
    organizations: meta.organizations ?? [],
    invited_by: meta.invited_by,
    status: meta.status,
    invitationToken: meta.invitationToken,
    invitationType: meta.invitationType,
    isConnected: meta.isConnected ?? true,
  }
})

const getUserInfoWithCache = cache(async (
  userId: string,
  options: GetUserInfoOptions = {}
): Promise<Partial<UserInfo> | null> => {
  const { cache: useCache = true, refresh = false } = options

  if (!useCache) return fetchUserFromSupabase(userId)

  if (refresh) {
    const fresh = await fetchUserFromSupabase(userId)
    if (fresh) setUser(userId, fresh)
    else removeUser(userId)
    return fresh
  }

  const cached = getUser(userId)
  if (cached) return cached

  const userInfo = await fetchUserFromSupabase(userId)
  if (userInfo) setUser(userId, userInfo)
  return userInfo
})

export async function getUserInfo(
  options: GetUserInfoOptions = {}
): Promise<Partial<UserInfo> | null> {
  const userId = await getUserId()
  if (!userId) return null
  return getUserInfoWithCache(userId, options)
}
