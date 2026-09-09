export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

import { ERROR_CODES, type ErrorCode } from '@/config'

const KNOWN_CODES: readonly string[] = Object.values(ERROR_CODES)

export function getErrorCode(error: string): ErrorCode {
  const [prefix, rest] = error.split(':')
  const candidate = rest !== undefined ? prefix.trim() : error
  return KNOWN_CODES.includes(candidate) ? (candidate as ErrorCode) : ERROR_CODES.SERVER
}