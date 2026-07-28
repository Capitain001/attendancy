// src/services/user/lru-cache.ts
// Cache LRU process-local des UserInfo — 2e niveau de cache de getUserInfo()
// (le 1er est React.cache(), scopé requête). TTL court : les métadonnées
// changent à chaque mutation de profil/organisation.
import { LRUCache } from 'lru-cache'
import type { UserInfo } from './types'

const cache = new LRUCache<string, Partial<UserInfo>>({
  max: 1000,
  ttl: 10 * 60 * 1000, // 10 min
})

export function getUser(userId: string): Partial<UserInfo> | null {
  return cache.get(userId) ?? null
}

export function setUser(userId: string, userInfo: Partial<UserInfo>): void {
  cache.set(userId, userInfo)
}

export function removeUser(userId: string): boolean {
  return cache.delete(userId)
}

export function clearCache(): void {
  cache.clear()
}

// Invalidation ciblée : purge tous les users rattachés à une organisation
// (après mutation de l'org — renommage, suppression, changement de droits).
export function removeUsersByOrg(orgSlug: string): number {
  let deleted = 0
  for (const [userId, userInfo] of cache.entries()) {
    const inMain = userInfo.organization?.slug === orgSlug
    const inList = userInfo.organizations?.some((o) => o?.slug === orgSlug) ?? false
    if (inMain || inList) {
      cache.delete(userId)
      deleted++
    }
  }
  return deleted
}
