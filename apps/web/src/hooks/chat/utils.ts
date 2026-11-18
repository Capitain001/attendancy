
// src/hooks/chat/utils.ts
import { ANONYMOUS_NAME } from '@/hooks/chat/constants'
import type { RealtimeMessage } from '@/hooks/chat/use-realtime-chat'
import { getFullName } from '@/lib/utils'
import type { GetMessagesDto } from '@/services/message'
 
export const mapMessages = (messages: GetMessagesDto = []): RealtimeMessage[] =>
  messages.map(({ id, content, parentId, createdAt,editedAt, user }) => ({
    id,
    content,
    parentId,
    createdAt: typeof createdAt === 'string' ? createdAt : createdAt.toISOString(),
    editedAt:  editedAt ? new Date(editedAt).toISOString() : null,
    // Auteur supprimé (user null) ou sans nom : même repli que côté temps réel
    user: {
      id: user?.id ?? null,
      name: getFullName(user?.firstName, user?.lastName) ?? ANONYMOUS_NAME,
    },
  }))
 