// packages/ui/src/components/chat/utils.ts
// Fonctions pures de présentation (testables sans React ni DOM).
import type { ChatMessage } from './types'

const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const dayYearFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

// Deux messages du même auteur à moins de 5 minutes d'écart sont regroupés
export const GROUP_WINDOW_MS = 5 * 60_000

export const formatTime = (iso: string) => timeFormat.format(new Date(iso))

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

export const isSameDay = (a: string, b: string) => startOfDay(new Date(a)) === startOfDay(new Date(b))

export function dayLabel(iso: string, now = new Date()) {
  const date = new Date(iso)
  // round : un changement d'heure donne des journées de 23 h ou 25 h
  const diff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Hier'
  return date.getFullYear() === now.getFullYear() ? dayFormat.format(date) : dayYearFormat.format(date)
}

// Un message ouvre un groupe (nom de l'auteur affiché) sauf s'il prolonge le précédent :
// même auteur connu, même jour, peu d'écart, et ce n'est pas une réponse (sa citation
// a besoin de son contexte).
export function startsGroup(prev: ChatMessage | undefined, message: ChatMessage) {
  if (!prev || message.replyTo) return true
  if (prev.user.id === null || prev.user.id !== message.user.id) return true
  if (!isSameDay(prev.createdAt, message.createdAt)) return true
  return Date.parse(message.createdAt) - Date.parse(prev.createdAt) > GROUP_WINDOW_MS
}

export function typingLabel(names: string[]) {
  if (names.length === 0) return ''
  if (names.length === 1) return `${names[0]} écrit…`
  if (names.length === 2) return `${names[0]} et ${names[1]} écrivent…`
  return 'Plusieurs personnes écrivent…'
}
