//apps\web\src\modules\chat\host-profile.ts
// Profils d'hébergement : transforment « qui est dans quel canal » en réglages du relais.
// Fonction pure, sans E/S : testable sans relais.

export type HostProfileKind = 'class' | 'room' | 'dm'

export type HostChannel = { id: string; memberIds: string[] }

export type HostProfile = {
  kind: HostProfileKind
  hostUserId: string
  channels: HostChannel[]
}

/** Réglages transmis au service d'hébergement (le jeton et l'adresse se décident ailleurs). */
export type HostProfileOptions = {
  hostUserId: string
  members: Record<string, string[]>
  maxConnections: number
  maxPendingHello: number
}

// Un client qui se reconnecte reste compté par le relais jusqu'à `idle_timeout` (60 s) : le
// plafond de connexions = effectif attendu + une marge pour ces connexions fantômes.
// Marge = max(marginMin, ceil(effectif × marginRatio)). Valeurs par défaut, à ajuster.
const PROFILE_LIMITS: Record<HostProfileKind, { marginRatio: number; marginMin: number }> = {
  class: { marginRatio: 0.2, marginMin: 2 },
  room: { marginRatio: 0.2, marginMin: 2 },
  dm: { marginRatio: 0, marginMin: 2 }, // 1 pair + 2 = 3
}

// Plafonds du relais (HubConfig : max_connections, max_channels)
const MAX_CONNECTIONS_CAP = 256
const MAX_CHANNELS = 64
// Connexions sans `hello` simultanées : toute une classe scanne le QR en même temps. Le défaut
// du relais (32) refuserait des élèves légitimes ; ils réessaieraient, mais autant l'éviter.
const MAX_PENDING_HELLO_CAP = 64

export function buildHostOptions(profile: HostProfile): HostProfileOptions {
  const { kind, hostUserId, channels } = profile
  if (!hostUserId) throw new RangeError('hostUserId vide')
  if (channels.length === 0) throw new RangeError('aucun canal')
  if (channels.length > MAX_CHANNELS) throw new RangeError(`plus de ${MAX_CHANNELS} canaux`)
  if (kind === 'dm' && channels.length !== 1) throw new RangeError('un DM n\'a qu\'un canal')

  const members: Record<string, string[]> = {}
  const peers = new Set<string>()

  for (const { id, memberIds } of channels) {
    if (!id) throw new RangeError('identifiant de canal vide')
    // L'hôte est toujours membre de ses canaux (sinon `HostNotInMembers` côté relais)
    const users = new Set([...(members[id] ?? []), hostUserId, ...memberIds])
    members[id] = [...users]
    users.forEach((u) => u !== hostUserId && peers.add(u))
  }

  const { marginRatio, marginMin } = PROFILE_LIMITS[kind]
  const expected = peers.size
  const margin = Math.max(marginMin, Math.ceil(expected * marginRatio))
  const maxConnections = Math.min(MAX_CONNECTIONS_CAP, expected + margin)

  return {
    hostUserId,
    members,
    maxConnections,
    maxPendingHello: Math.min(maxConnections, MAX_PENDING_HELLO_CAP),
  }
}
