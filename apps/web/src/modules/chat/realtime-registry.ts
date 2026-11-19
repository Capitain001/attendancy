type Sender = (m: { id: string; content: string; createdAt: string; parentId: string | null }) => Promise<unknown>

const senders = new Map<string, Sender>()

export function registerRealtimeSender(channelId: string, send: Sender) {
  senders.set(channelId, send)
  return () => {
    if (senders.get(channelId) === send) {
      senders.delete(channelId)
    }
  }
}

// Aucun useChat monté pour ce canal : pas de diffusion, les autres rattrapent au prochain refetch
export const broadcastSent = (channelId: string, m: Parameters<Sender>[0]) => senders.get(channelId)?.(m)
