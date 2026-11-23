// apps/web/src/services/message/preview.ts
import { REPLY_PREVIEW_MAX_LENGTH } from './constants'

// Array.from : compte en vrais caractères, ne coupe pas un emoji en deux
export function truncatePreview(text: string, max = REPLY_PREVIEW_MAX_LENGTH) {
  const chars = Array.from(text)
  return chars.length > max ? `${chars.slice(0, max).join('')}…` : text
}
