//src/services/presence/subscribtion.ts
import { PresenceChannel } from "./channel"

/**
 * Gère l'abonnement à un canal de présence
 */
export const subscribeToPresence = async (
  presenceChannel: PresenceChannel,
  onSubscribe: () => void
): Promise<() => void> => {
  const subscription = await presenceChannel.channel.subscribe(
    async (status: string) => {
      if (status === "SUBSCRIBED") {
        await presenceChannel.track()
        onSubscribe()
      }
    }
  )

  return () => {
    presenceChannel.untrack()
    subscription.unsubscribe()
  }
}