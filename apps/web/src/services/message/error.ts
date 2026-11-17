import { ERROR_CODES } from '@/config'
import type { ErrorType } from '@/utils/server/error'

export const MESSAGE_ERRORS = {
  ID_CONFLICT: { message: 'Cet identifiant de message est déjà utilisé', code: ERROR_CODES.CONFLICT },
  CHANNEL_NOT_FOUND: { message: 'Canal introuvable', code: ERROR_CODES.NOT_FOUND },
  PARENT_NOT_FOUND: { message: 'Message parent introuvable', code: ERROR_CODES.NOT_FOUND },
} as const satisfies Record<string, ErrorType>