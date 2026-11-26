// Présentation de l'état du réseau local : fonctions pures, testables sans React.
import { decodePairing, type TransportStatus } from '@attendancy/chat'

export type LanTone = 'off' | 'wait' | 'on' | 'error'
export type LanView = { label: string; detail?: string; tone: LanTone }

// Raisons de refus : celles du hub (bad_token, not_member, bad_hello) et celles
// que le transport détecte lui-même (navigateur qui bloque ws:// depuis une page https).
const FAILURES: Record<string, string> = {
  bad_token: "Le code n'est plus valide. Demandez à l'enseignant d'afficher le code actuel.",
  not_member: "Vous n'avez pas accès à cette séance.",
  bad_hello: "Le serveur local n'a pas compris la connexion. Mettez l'application à jour.",
  insecure_context:
    "Ce navigateur bloque les connexions locales depuis une page sécurisée (https). Utilisez l'application installée.",
  unsupported: "Ce navigateur ne permet pas les connexions locales.",
}

export function describeLan(status: TransportStatus, failure: string | null): LanView {
  if (failure) {
    return {
      label: 'Connexion refusée',
      detail: FAILURES[failure] ?? 'Le serveur local a refusé la connexion.',
      tone: 'error',
    }
  }
  switch (status) {
    case 'connected':
      return { label: 'Connecté au réseau local', tone: 'on' }
    case 'connecting':
      return { label: 'Connexion en cours…', tone: 'wait' }
    default:
      return { label: 'Non connecté', tone: 'off' }
  }
}

// Lien collé ou lu depuis un QR : espaces et retours à la ligne autour sont ignorés
export const parsePairingInput = (raw: string) => decodePairing(raw.trim())

export const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`

// Jeton de séance : 128 bits aléatoires, en base64url (22 caractères)
export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

