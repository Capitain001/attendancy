// src/components/notification/admin/AdminNotificationList.tsx
// thumb
"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Bell, 
  Search, 
  Filter, 
  RefreshCw,
  User,
  Calendar,
  CheckCircle2,
  Circle
} from 'lucide-react'
import { useAdminNotifications } from '@/hooks/notification/useAdminNotifications'
import { formatDate } from '@/lib/utils'

import { cn } from '@/lib/utils'
import { NotificationType} from '@/generated/prisma/browser';

export function AdminNotificationList() {
  const { notifications, unread, isLoading, error, actions } = useAdminNotifications()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'read' | 'unread' | NotificationType>('all')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  // Filtrer les notifications
  const filteredNotifications = notifications.filter((notification) => {
    // Filtre par recherche
    if (searchQuery && !notification.message.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !notification.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !notification.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !notification.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Filtre par type
    if (filterType === 'read' && !notification.read) return false
    if (filterType === 'unread' && notification.read) return false
    if (filterType !== 'all' && filterType !== 'read' && filterType !== 'unread' && notification.type !== filterType) {
      return false
    }

    // Filtre par utilisateur
    if (selectedUser && notification.userId !== selectedUser) return false

    return true
  })

  // Obtenir la liste unique des utilisateurs
  const uniqueUsers = Array.from(
    new Map(notifications.map(n => [n.userId, n.user])).values()
  )

  if (error) {
    return (
        <div></div>
    )
  }

  return (
  <div></div>
  )
}

