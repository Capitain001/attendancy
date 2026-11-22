// src/services/permission/utils.unit.test.ts
import { describe, expect, it } from 'vitest'
import { hasAllPermissions, hasAnyPermission, hasPermission, permissionName } from './utils'

describe('permissionName', () => {
  it('compose le nom selon la portée', () => {
    expect(permissionName('READ')).toBe('READ')
    expect(permissionName('READ', 'STUDENT')).toBe('READ:STUDENT')
    expect(permissionName('READ', 'STUDENT', 'abc')).toBe('READ:STUDENT:abc')
  })

  it('ignore un resourceId sans ressource (la ligne se lit comme une permission large)', () => {
    expect(permissionName('READ', null, 'abc')).toBe('READ')
  })
})

describe('hasPermission', () => {
  it('accepte le droit exact', () => {
    expect(hasPermission(['UPDATE:STUDENT:abc'], { action: 'UPDATE', resource: 'STUDENT', resourceId: 'abc' })).toBe(true)
  })

  it('un droit sur la ressource couvre tous ses resourceId', () => {
    expect(hasPermission(['UPDATE:STUDENT'], { action: 'UPDATE', resource: 'STUDENT', resourceId: 'abc' })).toBe(true)
  })

  it("un droit sans ressource couvre toutes les ressources et tous les resourceId", () => {
    expect(hasPermission(['READ'], { action: 'READ', resource: 'TEACHER' })).toBe(true)
    expect(hasPermission(['READ'], { action: 'READ', resource: 'TEACHER', resourceId: 'abc' })).toBe(true)
  })

  it('un droit plus fin ne remonte pas', () => {
    expect(hasPermission(['UPDATE:STUDENT:abc'], { action: 'UPDATE', resource: 'STUDENT' })).toBe(false)
    expect(hasPermission(['UPDATE:STUDENT:abc'], { action: 'UPDATE', resource: 'STUDENT', resourceId: 'xyz' })).toBe(false)
  })

  it("ne déborde pas sur une autre ressource ni une autre action", () => {
    expect(hasPermission(['READ:STUDENT'], { action: 'READ', resource: 'TEACHER' })).toBe(false)
    expect(hasPermission(['READ:STUDENT'], { action: 'UPDATE', resource: 'STUDENT' })).toBe(false)
  })

  it('CRUD couvre les quatre actions, à la portée où il est accordé', () => {
    for (const action of ['CREATE', 'READ', 'UPDATE', 'DELETE'] as const) {
      expect(hasPermission(['CRUD:STUDENT'], { action, resource: 'STUDENT' })).toBe(true)
    }
    expect(hasPermission(['CRUD:STUDENT'], { action: 'READ', resource: 'TEACHER' })).toBe(false)
    expect(hasPermission(['CRUD'], { action: 'DELETE', resource: 'ROOM' })).toBe(true)
  })

  it("un contrôle CRUD exige un droit CRUD, pas une seule action", () => {
    expect(hasPermission(['READ:STUDENT'], { action: 'CRUD', resource: 'STUDENT' })).toBe(false)
    expect(hasPermission(['CRUD:STUDENT'], { action: 'CRUD', resource: 'STUDENT' })).toBe(true)
  })

  it("refuse tout avec une liste vide", () => {
    expect(hasPermission([], { action: 'READ', resource: 'STUDENT' })).toBe(false)
  })
})

describe('hasAnyPermission / hasAllPermissions', () => {
  const granted = ['READ:STUDENT', 'UPDATE:COURSE']
  const read = { action: 'READ', resource: 'STUDENT' } as const
  const del = { action: 'DELETE', resource: 'STUDENT' } as const

  it('any : au moins un contrôle satisfait', () => {
    expect(hasAnyPermission(granted, [read, del])).toBe(true)
    expect(hasAnyPermission(granted, [del])).toBe(false)
  })

  it('all : tous les contrôles satisfaits', () => {
    expect(hasAllPermissions(granted, [read, { action: 'UPDATE', resource: 'COURSE' }])).toBe(true)
    expect(hasAllPermissions(granted, [read, del])).toBe(false)
  })
})