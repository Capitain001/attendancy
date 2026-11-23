import type { ChannelType } from '@/generated/prisma/browser'

export const CHANNEL_TYPES = ['CLASS', 'GROUP', 'ORG', 'DM'] as const satisfies readonly ChannelType[]

export const CHANNEL_TYPE_LABELS: Record<ChannelType, string> = {
  CLASS: 'Classe',
  GROUP: 'Groupe',
  ORG: 'Organisation',
  DM: 'Message direct',
}

export const CHANNEL_NAME_MAX_LENGTH = 100