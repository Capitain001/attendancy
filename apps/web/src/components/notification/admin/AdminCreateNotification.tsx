// src/components/notification/admin/AdminCreateNotification.tsx
"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Send, Loader2 } from 'lucide-react'
import { useAdminNotifications } from '@/hooks/notification/useAdminNotifications'
import { NotificationType } from '@/generated/prisma/browser'
import UserIcon from '@/components/users/UserIcon'

export function AdminCreateNotification() {
  const { notifications, actions } = useAdminNotifications()
  const [userId, setUserId] = useState<string>('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<NotificationType>(NotificationType.GENERAL)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Obtenir la liste unique des utilisateurs
  const uniqueUsers = Array.from(
    new Map(notifications.map(n => [n.userId, n.user])).values()
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsSubmitting(true)

    try {
      await actions.createNotification({
        userId,
        data: {
          message,
          type,   
        }
      })
      setSuccess(true)
      setMessage('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la notification')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer une notification</CardTitle>
        <CardDescription>
          Envoyer une notification à un utilisateur de l'organisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">Utilisateur</Label>
            <Select value={userId} onValueChange={setUserId} required>
              <SelectTrigger id="user">
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {uniqueUsers.map((user) => (
                  <SelectItem key={user?.id} value={user?.id || ''}>
                    {/* {user?.firstName} {user?.lastName} ({user?.email}) */}
                    <UserIcon avatarUrl={user.avatar_url} /> {user?.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as NotificationType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NotificationType.GENERAL}>Général</SelectItem>
                <SelectItem value={NotificationType.ABSENCE}>Absence</SelectItem>
                <SelectItem value={NotificationType.COURSE_CHANGE}>Changement de cours</SelectItem>
                <SelectItem value={NotificationType.NEW_COURSE}>Nouveau cours</SelectItem>
                <SelectItem value={NotificationType.SCHEDULE_UPDATE}>Mise à jour planning</SelectItem>
                {/* <SelectItem value={NotificationType.MESSAGE}>Message</SelectItem> */}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Entrez le message de la notification..."
              required
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950 p-3 rounded-md">
              Notification créée avec succès !
            </div>
          )}

          <Button type="submit" disabled={isSubmitting || !userId || !message} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Envoyer la notification
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

