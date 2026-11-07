'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Building2, Calendar, UserCheck, ArrowRight, Loader2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ROLE_LABELS } from '@/modules/user'
import { getOrganizationRolePath } from '@/config/redirects'
import { selectOrganizationProfileAction } from '@/services/organization'
import { useAcceptInvitation, useDeclineInvitation } from '@/hooks/inbox'
import type { EnrichedInboxNotification } from './types'

interface InvitationActionCardProps {
  notification: EnrichedInboxNotification
}

export function InvitationActionCard({ notification }: InvitationActionCardProps) {
  const router = useRouter()
  const metadata = notification.metadata
  const invitationId = metadata?.invitationId
  const kind = metadata?.kind ?? 'INVITATION_RECEIVED'
  const rawStatus = metadata?.status ?? 'PENDING'
  const role = metadata?.role ?? (metadata?.resourceType === 'CLASS' ? 'STUDENT' : undefined)
  const roleKey = role as keyof typeof ROLE_LABELS | undefined
  const roleLabel = (roleKey && ROLE_LABELS[roleKey]) ? ROLE_LABELS[roleKey] : (role ?? 'Membre')
  const acceptedInvitationPath = typeof metadata?.orgSlug === 'string'
    ? roleKey
      ? getOrganizationRolePath(
          { slug: metadata.orgSlug, type: metadata.orgType },
          roleKey,
        )
      : `/${metadata.orgSlug}`
    : null
  const selectInvitedProfileAction =
    typeof metadata?.orgId === 'string' && roleKey
      ? selectOrganizationProfileAction.bind(null, metadata.orgId, roleKey)
      : null

  const expiresAt = metadata?.expiresAt ? new Date(metadata.expiresAt) : null
  const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false
  const effectiveStatus = isExpired && rawStatus === 'PENDING' ? 'EXPIRED' : rawStatus

  const acceptMutation = useAcceptInvitation()
  const declineMutation = useDeclineInvitation()
  const isPendingMutation = acceptMutation.isPending || declineMutation.isPending

  const [localAcceptedPath, setLocalAcceptedPath] = useState<string | null>(null)

  const handleAccept = async () => {
    if (!invitationId) return
    try {
      const res = await acceptMutation.mutateAsync(invitationId)
      toast.success('Invitation acceptée avec succès ! Bienvenue dans l’organisation.')
      if (res?.redirectPath) {
        setLocalAcceptedPath(res.redirectPath)
      } else if (typeof metadata?.orgSlug === 'string') {
        setLocalAcceptedPath(acceptedInvitationPath)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'acceptation de l'invitation")
    }
  }

  const handleDecline = async () => {
    if (!invitationId) return
    try {
      await declineMutation.mutateAsync(invitationId)
      toast.info("L'invitation a été déclinée.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors du refus de l’invitation')
    }
  }

  const orgInitial = metadata?.orgName?.charAt(0).toUpperCase() ?? 'O'

  return (
    <Card className="overflow-hidden border border-border/40 bg-card/60 backdrop-blur-md shadow-xs">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/20 bg-muted/20 p-5">
        <div className="flex items-center gap-3.5">
          <Avatar className="size-12 border border-border/40 shadow-xs">
            {metadata?.orgLogo && <AvatarImage src={metadata.orgLogo} alt={metadata.orgName ?? 'Organisation'} />}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">
              {orgInitial}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {metadata?.orgName ?? 'Organisation'}
              </h3>
              {metadata?.orgSlug && (
                <span className="text-xs text-muted-foreground font-mono">@{metadata.orgSlug}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Building2 className="size-3.5 text-muted-foreground/70" />
              Invitation à rejoindre l'établissement
            </p>
          </div>
        </div>

        <div>
          {effectiveStatus === 'PENDING' && (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
              <Clock className="mr-1 size-3" />
              En attente
            </Badge>
          )}
          {effectiveStatus === 'ACCEPTED' && (
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
              <Check className="mr-1 size-3" />
              Acceptée
            </Badge>
          )}
          {effectiveStatus === 'DECLINED' && (
            <Badge variant="outline" className="border-border bg-muted/50 text-muted-foreground font-medium">
              <X className="mr-1 size-3" />
              Refusée
            </Badge>
          )}
          {effectiveStatus === 'EXPIRED' && (
            <Badge variant="destructive" className="font-medium">
              Expirée
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
          <div className="flex items-center gap-2.5 rounded-lg border border-border/30 bg-background/50 p-3">
            <UserCheck className="size-4 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Rôle assigné</p>
              <p className="font-medium text-foreground capitalize">{roleLabel}</p>
            </div>
          </div>

          {metadata?.senderName && (
            <div className="flex items-center gap-2.5 rounded-lg border border-border/30 bg-background/50 p-3">
              <Building2 className="size-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Invité par</p>
                <p className="font-medium text-foreground truncate">{metadata.senderName}</p>
              </div>
            </div>
          )}

          {expiresAt && (
            <div className="flex items-center gap-2.5 rounded-lg border border-border/30 bg-background/50 p-3 sm:col-span-2">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Date limite de validité</p>
                <p className="font-medium text-foreground">
                  {expiresAt.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Message de confirmation ou lien direct vers l'organisation */}
        {localAcceptedPath ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-3">
            <span>Vous faites désormais partie de cette organisation !</span>
            {selectInvitedProfileAction ? (
              <form action={selectInvitedProfileAction}>
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                >
                  Accéder à l'espace
                  <ArrowRight className="ml-1 size-3.5" />
                </Button>
              </form>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                onClick={() => router.push(localAcceptedPath)}
              >
                Accéder à l'espace
                <ArrowRight className="ml-1 size-3.5" />
              </Button>
            )}
          </div>
        ) : effectiveStatus === 'ACCEPTED' && acceptedInvitationPath ? (
          <div className="flex justify-end pt-1">
            {selectInvitedProfileAction ? (
              <form action={selectInvitedProfileAction}>
                <Button type="submit" size="sm" variant="outline">
                  Accéder à l'espace
                  <ArrowRight className="ml-1 size-3.5" />
                </Button>
              </form>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(acceptedInvitationPath)}
              >
                Accéder à l'espace
                <ArrowRight className="ml-1 size-3.5" />
              </Button>
            )}
          </div>
        ) : null}
      </CardContent>

      {/* Boutons d'action conditionnels */}
      {kind === 'INVITATION_RECEIVED' && effectiveStatus === 'PENDING' && !localAcceptedPath && (
        <CardFooter className="flex items-center justify-end gap-2.5 border-t border-border/20 bg-muted/10 p-4">
          <Button
            variant="outline"
            size="sm"
            disabled={isPendingMutation}
            onClick={handleDecline}
            className="text-muted-foreground hover:text-foreground"
          >
            {declineMutation.isPending ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <X className="mr-1.5 size-3.5" />
            )}
            Décliner
          </Button>

          <Button
            size="sm"
            disabled={isPendingMutation}
            onClick={handleAccept}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            {acceptMutation.isPending ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Check className="mr-1.5 size-3.5" />
            )}
            Accepter l'invitation
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
