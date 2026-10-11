import type { ReactNode } from "react"

export type NotificationCategory = "PERSONNEL" | "ACADEMIQUE" | "URGENT"

export interface NotificationCardData {
  id: string
  title: string
  description: string
  icon?: ReactNode
  color?: string
  unread?: boolean
  category: NotificationCategory
}

export interface StackedCard extends NotificationCardData {
  stackPosition: number
}
