// src/modules/auth/persmission/acces.unit.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ERROR_CODES } from '@/config'

/*
 Dans ce test, React.cache ne doit pas mémoriser hors rendu serveur : 
c'est pourquoi chaque cas a son identifiant. 
*/
const getUserInfo = vi.hoisted(() => vi.fn())
const getEffectivePermissionNames = vi.hoisted(() => vi.fn())

vi.mock('@/modules/user', () => ({ getUserInfo }))
vi.mock('@/services/permission/server', () => ({ getEffectivePermissionNames }))
// Seule la fonction pure est nécessaire : on évite de charger les actions du service.
vi.mock('@/services/permission', async () => {
  const utils = await vi.importActual<typeof import('@/services/permission/utils')>('@/services/permission/utils')
  return { hasPermission: utils.hasPermission }
})

import { authAccess } from './acces'

const check = { action: 'UPDATE', resource: 'STUDENT' } as const

// Un identifiant distinct par test : la lecture est dédupliquée par (userId, orgId).
function userFixture(id: string, overrides: Record<string, unknown> = {}) {
  return { id, name: 'Test', email: 'test@example.com', role: 'ADMIN', function: 'PRINCIPAL', organization: { id: 'org-1' }, ...overrides }
}

describe('authAccess — permission fine', () => {
  beforeEach(() => {
    getUserInfo.mockReset()
    getEffectivePermissionNames.mockReset()
  })

  it("ne lit aucune permission quand aucune n'est exigée", async () => {
    getUserInfo.mockResolvedValue(userFixture('u-none'))
    const res = await authAccess()
    expect(res.data?.orgId).toBe('org-1')
    expect(getEffectivePermissionNames).not.toHaveBeenCalled()
  })

  it('SUPER_ADMIN passe sans lecture', async () => {
    getUserInfo.mockResolvedValue(userFixture('u-super', { function: 'SUPER_ADMIN' }))
    const res = await authAccess({ requiredPermission: check })
    expect(res.data).toBeDefined()
    expect(getEffectivePermissionNames).not.toHaveBeenCalled()
  })

  it('autorise quand la base accorde la permission, lue pour cet utilisateur et cette organisation', async () => {
    getUserInfo.mockResolvedValue(userFixture('u-allowed'))
    getEffectivePermissionNames.mockResolvedValue(['UPDATE:STUDENT'])
    const res = await authAccess({ requiredPermission: check })
    expect(res.data).toBeDefined()
    expect(getEffectivePermissionNames).toHaveBeenCalledWith('u-allowed', 'org-1')
  })

  it("refuse quand la base ne l'accorde pas", async () => {
    getUserInfo.mockResolvedValue(userFixture('u-denied'))
    getEffectivePermissionNames.mockResolvedValue(['READ:STUDENT'])
    const res = await authAccess({ requiredPermission: check })
    expect(res.data).toBeUndefined()
    expect(res.code).toBe(ERROR_CODES.FORBIDDEN)
  })

  it("ignore organization.permissions du JWT : seule la base fait foi (révocation immédiate)", async () => {
    getUserInfo.mockResolvedValue(
      userFixture('u-revoked', { organization: { id: 'org-1', permissions: ['UPDATE:STUDENT'] } })
    )
    getEffectivePermissionNames.mockResolvedValue([]) // droit révoqué en base, JWT pas encore rafraîchi
    const res = await authAccess({ requiredPermission: check })
    expect(res.code).toBe(ERROR_CODES.FORBIDDEN)
  })
})