import { describe, it, expect } from 'vitest'
import {
  isDbConstraintViolation,
  extractDbErrorMessage,
  detectConflictReason,
  getConflictMeta,
} from './conflicts'

// ── isDbConstraintViolation ───────────────────────────────────────────────────

describe('isDbConstraintViolation', () => {
  it('P2010 code → true', () => {
    expect(isDbConstraintViolation({ code: 'P2010' })).toBe(true)
  })

  it('cause.code 23P01 → true', () => {
    expect(isDbConstraintViolation({ cause: { code: '23P01' } })).toBe(true)
  })

  it('message contains 23P01 → true', () => {
    expect(isDbConstraintViolation({ message: 'ERROR 23P01 overlap' })).toBe(true)
  })

  it('message contains no_room_overlap → true', () => {
    expect(isDbConstraintViolation({ message: 'violates constraint no_room_overlap' })).toBe(true)
  })

  it('message contains no_teacher_overlap → true', () => {
    expect(isDbConstraintViolation({ message: 'no_teacher_overlap violated' })).toBe(true)
  })

  it('message contains no_class_overlap_global → true', () => {
    expect(isDbConstraintViolation({ message: 'no_class_overlap_global' })).toBe(true)
  })

  it('message contains no_group_overlap → true', () => {
    expect(isDbConstraintViolation({ message: 'no_group_overlap' })).toBe(true)
  })

  it('unrelated error → false', () => {
    expect(isDbConstraintViolation({ code: 'P2002', message: 'unique constraint' })).toBe(false)
  })

  it('null → false', () => {
    expect(isDbConstraintViolation(null)).toBe(false)
  })

  it('string → false', () => {
    expect(isDbConstraintViolation('some error')).toBe(false)
  })
})

// ── extractDbErrorMessage ─────────────────────────────────────────────────────

describe('extractDbErrorMessage', () => {
  it('picks message field', () => {
    expect(extractDbErrorMessage({ message: 'hello' })).toBe('hello')
  })

  it('falls back to cause.message', () => {
    expect(extractDbErrorMessage({ cause: { message: 'cause msg' } })).toBe('cause msg')
  })

  it('prefers message over cause', () => {
    expect(extractDbErrorMessage({ message: 'top', cause: { message: 'nested' } })).toBe('top')
  })

  it('empty object → empty string', () => {
    expect(extractDbErrorMessage({})).toBe('')
  })
})

// ── detectConflictReason ──────────────────────────────────────────────────────

describe('detectConflictReason', () => {
  it('no_room_overlap → ROOM_OVERLAP', () => {
    expect(detectConflictReason('violates no_room_overlap constraint')).toBe('ROOM_OVERLAP')
  })

  it('no_teacher_overlap → TEACHER_OVERLAP', () => {
    expect(detectConflictReason('no_teacher_overlap')).toBe('TEACHER_OVERLAP')
  })

  it('no_class_overlap_global → CLASS_OVERLAP', () => {
    expect(detectConflictReason('no_class_overlap_global')).toBe('CLASS_OVERLAP')
  })

  it('no_group_overlap → GROUP_OVERLAP', () => {
    expect(detectConflictReason('no_group_overlap')).toBe('GROUP_OVERLAP')
  })

  it('unknown message → null', () => {
    expect(detectConflictReason('some unrelated error')).toBeNull()
  })

  it('empty string → null', () => {
    expect(detectConflictReason('')).toBeNull()
  })
})

// ── getConflictMeta ───────────────────────────────────────────────────────────

describe('getConflictMeta', () => {
  it('ROOM_OVERLAP → correct dbConstraint and message', () => {
    const meta = getConflictMeta('ROOM_OVERLAP')
    expect(meta.dbConstraint).toBe('no_room_overlap')
    expect(meta.message).toContain('salle')
  })

  it('TEACHER_OVERLAP → correct dbConstraint and message', () => {
    const meta = getConflictMeta('TEACHER_OVERLAP')
    expect(meta.dbConstraint).toBe('no_teacher_overlap')
    expect(meta.message).toContain('enseignant')
  })

  it('CLASS_OVERLAP → correct dbConstraint and message', () => {
    const meta = getConflictMeta('CLASS_OVERLAP')
    expect(meta.dbConstraint).toBe('no_class_overlap_global')
    expect(meta.message).toContain('classe')
  })

  it('GROUP_OVERLAP → correct dbConstraint and message', () => {
    const meta = getConflictMeta('GROUP_OVERLAP')
    expect(meta.dbConstraint).toBe('no_group_overlap')
    expect(meta.message).toContain('groupe')
  })
})
