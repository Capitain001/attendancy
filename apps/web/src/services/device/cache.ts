import { CACHE } from '@/cache/server/key'

export const DEVICE_GRAPH = {
  DEVICE_SESSION_CREATED: (userId: string) => [
    CACHE.USER_DEVICES(userId),
    CACHE.USER_SESSIONS(userId),
  ],
  DEVICE_SESSION_ENDED: (userId: string) => [CACHE.USER_SESSIONS(userId)],
  DEVICE_SESSION_REVOKED: (userId: string) => [CACHE.USER_SESSIONS(userId)],
  DEVICE_REVOKED: (userId: string) => [
    CACHE.USER_DEVICES(userId),
    CACHE.USER_SESSIONS(userId),
  ],
  DEVICE_UPDATED: (userId: string) => [CACHE.USER_DEVICES(userId)],
}