// src/services/function/cache.unit.test.ts
import { describe, expect, it } from 'vitest'
import { CACHE } from '@/cache/server/key'
import { FUNCTION_GRAPH } from './cache'

const orgId = 'org-1'
const userId = 'user-1'

describe('FUNCTION_GRAPH — invalidation des permissions effectives', () => {
  it.each(['FUNCTION_ASSIGNED', 'FUNCTION_UNASSIGNED', 'USER_FUNCTIONS_UPDATED'] as const)(
    "%s expire les droits effectifs de l'utilisateur, pas ceux de l'organisation",
    (event) => {
      const tags = FUNCTION_GRAPH[event](orgId, userId)
      expect(tags).toContain(CACHE.PERMISSION(orgId, userId))
      expect(tags).not.toContain(CACHE.PERMISSION(orgId))
    }
  )

  it("FUNCTION_DELETED expire les droits de toute l'organisation", () => {
    expect(FUNCTION_GRAPH.FUNCTION_DELETED(orgId)).toContain(CACHE.PERMISSION(orgId))
  })

  it("FUNCTION_UPDATED n'expire aucun droit (nom, icône, description)", () => {
    expect(FUNCTION_GRAPH.FUNCTION_UPDATED(orgId)).toEqual([CACHE.FUNCTION(orgId)])
  })
})