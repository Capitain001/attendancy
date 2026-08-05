import type { ChatMessage as RealtimeMessage } from "@/hooks/chat/use-realtime-chat";
import type { ChatMessage as DbChatMessage } from "@/services/chat";

// const mapDBMessages = (messages: DbChatMessage[] = []): RealtimeMessage[] =>
//   messages.map((m) => ({
//     id: m.id,
//     content: m.content,
//     createdAt: m.createdAt.toISOString(),
//     user: {
//       name: m.user?.name,
//     },
//   }));

// export { mapDBMessages };


export const mapMessages = (messages: DbChatMessage[] = []): RealtimeMessage[] =>
  messages.map((message) => ({
    id: message.id,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    user: {
      name: [message.user?.firstName, message.user?.lastName].filter(Boolean).join(' ') || '',
    },
  }));

