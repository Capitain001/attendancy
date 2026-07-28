'use server'
import type { CreateNotificationData } from './database'

export type NotificationItem = {
  id: string
  read: boolean
  type: string
  content: string
  createdAt: Date
  userId?: string
  orgId?: string
}

export type NotificationStats = {
  total: number
  unread: number
  byType: Record<string, number>
}

export async function getNotifications(): Promise<{ data: NotificationItem[] } | { error: string }> {
  return { data: [] }
}

export async function markNotificationAsRead(_notificationId: string): Promise<{ data: true } | { error: string }> {
  return { data: true }
}

export async function markAllRead(): Promise<{ data: true } | { error: string }> {
  return { data: true }
}

export async function getAdminNotifications(_limit?: number): Promise<{ data: NotificationItem[] } | { error: string }> {
  return { data: [] }
}

export async function getAdminUnreadNotifications(): Promise<{ data: NotificationItem[] } | { error: string }> {
  return { data: [] }
}

export async function getAdminUnreadCount(): Promise<{ data: number } | { error: string }> {
  return { data: 0 }
}

export async function getAdminNotificationStats(): Promise<{ data: NotificationStats } | { error: string }> {
  return { data: { total: 0, unread: 0, byType: {} } }
}

export async function getAdminUserNotifications(_userId: string, _limit?: number): Promise<{ data: NotificationItem[] } | { error: string }> {
  return { data: [] }
}

export async function createAdminNotification(_userId: string, _data: CreateNotificationData): Promise<{ data: NotificationItem } | { error: string }> {
  return { error: 'Not implemented' }
}
