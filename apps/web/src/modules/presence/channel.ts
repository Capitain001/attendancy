// services/presence/channel.ts
import { UserInfo } from "@/types/user"
import { supabase } from "@/utils/supabase/client"


export interface PresenceChannel {
  channel: any
  track: () => Promise<void>
  untrack: () => Promise<void>
}

/**
 * Crée un canal de présence pour une organisation
 */
export const createPresenceChannel = (
  organizationId: string,
  user: UserInfo,
  onPresenceUpdate: (onlineUsers: Record<string, UserInfo>) => void
): PresenceChannel => {
  const presenceChannel = supabase.channel(`org:${organizationId}`, {
    config: {
      presence: {
        key: user.id,
      },
    },
  })

  // Gestion des mises à jour de présence
  presenceChannel.on("presence", { event: "sync" }, () => {
    const presenceState = presenceChannel.presenceState()
    const onlineUsers: Record<string, UserInfo> = {}

    Object.keys(presenceState).forEach((presenceId) => {
      const userPresences = presenceState[presenceId]
      userPresences.forEach((presence: any) => {
        onlineUsers[presence.user.id] = {
          ...presence.user,
          online_at: presence.online_at,
        }
      })
    })

    onPresenceUpdate(onlineUsers)
  })

  return {
    channel: presenceChannel,
    track: async () => {
      await presenceChannel.track({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          avatar_url: user.avatar_url,
          function: user.function,
          online_at: new Date().toISOString(),
        },

      })
    },
    untrack: async () => {
      await presenceChannel.untrack()
    },
  }
}
