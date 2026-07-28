import type { DomainError } from './errors'

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: DomainError }
