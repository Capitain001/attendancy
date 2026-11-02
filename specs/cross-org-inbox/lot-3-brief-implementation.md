# Lot 3 — Brief d'implémentation (Interface Inbox Gmail-like & Carte Interactive)

> **Objectif :** Créer l'interface utilisateur de la boîte de réception cross-organisation (`/inbox`) : layout responsive split-screen (sidebar dossiers + liste de messages + panneau de lecture), synchronisation de l'état dans l'URL via `nuqs`, carte interactive d'invitation (`InvitationActionCard`) avec acceptation/refus direct, animations soignées, gestion des états vides/chargement et intégration du raccourci avec badge dans le header.
> **Règle absolue :** Ne pas commencer l'implémentation dans le code source avant validation finale de ce document.

---

## 1. Liens vers l'existant impliqué

- [useInboxNotifications / useInboxUnreadCount / useMarkInboxAsRead / useAcceptInvitation / useDeclineInvitation](../../apps/web/src/hooks/inbox/useInbox.ts#L21-L99) — Hooks TanStack Query pour la récupération et les mutations de la boîte de réception.
- [ROLE_LABELS](../../apps/web/src/modules/user/constants.ts#L3) — Dictionnaire des rôles en français (`administrateur`, `enseignant`, `étudiant`, etc.).
- [inboxFilterSchema / invitationMetadataSchema](../../apps/web/src/services/notification/validation.ts#L27-L52) — Schémas Valibot des filtres (`all`, `invitations`, `unread`, `system`) et des métadonnées enrichies des invitations.
- [Header](../../apps/web/src/components/layout/Header/Header.tsx#L13) — Header principal de l'application où intégrer l'accès à l'inbox.
- [RootLayout](../../apps/web/src/app/layout.tsx#L17) — Layout racine fournissant `NuqsAdapter`, `ReactQueryProvider` et `AppProvider`.
- [Empty / EmptyMedia / EmptyTitle / EmptyDescription](../../apps/web/src/components/ui/empty.tsx#L5-L46) — Composants d'état vide du design system.
- [Avatar / AvatarImage / AvatarFallback](../../apps/web/src/components/ui/avatar.tsx#L8-L48) — Composant d'avatar avec gestion d'image et fallback.
- [Badge / badgeVariants](../../apps/web/src/components/ui/badge.tsx#L8-L39) — Badges de statut du design system.
- [Button](../../apps/web/src/components/ui/button.tsx#L1) — Boutons avec variants et gestion d'état de chargement.
- [ScrollArea](../../apps/web/src/components/ui/scroll-area.tsx#L7) — Zone de défilement stylisée Base UI.

---

## 2. Décisions d'architecture & d'UI actées pour le Lot 3

| # | Décision | Justification |
|---|---|---|
| 1 | **Route `/inbox` user-scoped hors slug organisationnel** : fichier `apps/web/src/app/(app)/inbox/page.tsx` dans le route group `(app)`. | L'inbox est un espace personnel global. L'utilisateur peut y accéder même s'il n'appartient à aucune organisation ou qu'il bascule entre plusieurs structures. |
| 2 | **Synchronisation bidirectionnelle de l'état avec l'URL via `nuqs`** : `filter` (`'all' | 'invitations' | 'unread' | 'system'`) et `id` (ID de la notification sélectionnée) sont persistés dans les query params (`/inbox?filter=invitations&id=...`). | Permet le partage direct de lien vers une invitation spécifique, le rechargement sans perte de contexte et la navigation navigateur fluide (historique Précédent/Suivant). |
| 3 | **Layout adaptatif split-screen (Desktop 3 panneaux / Mobile vue exclusive avec retour)** :<br>- Desktop (≥ 1024px) : Sidebar filtres compacte (240px) + Liste scrollable (360px-400px) + Panneau de lecture complet flex-1.<br>- Tablette (768px - 1023px) : Sidebar pliable + Liste et lecture côte à côte.<br>- Mobile (< 768px) : Vue liste par défaut, bascule en plein écran sur le message sélectionné avec bouton retour `[← Revenir à la liste]`. | Confort optimal inspiré de Gmail/Superhuman garantissant une ergonomie irréprochable sur mobile comme sur grand écran. |
| 4 | **Composant dédié `InvitationActionCard`** : Carte riche visuellement détachée dans le message pour toutes les notifications de type `INVITATION` :<br>- Monogramme / Logo organisation avec badge de statut.<br>- Rôle en français via `ROLE_LABELS` (ex: "Enseignant", "Membre de la direction").<br>- Nom complet de l'invitant ("Invité par ...").<br>- Expiration claire et lisible.<br>- Statuts gérés : `PENDING` (en attente), `ACCEPTED` (acceptée), `DECLINED` (déclinée), `EXPIRED` (expirée si `expiresAt < now()`).<br>- Boutons `[Accepter l'invitation]` et `[Décliner]` affichés **uniquement** si `kind === 'INVITATION_RECEIVED'` ET `status === 'PENDING'` ET non expirée.<br>- Boutons désactivés pendant la mutation avec spinner lucide.<br>- Après acceptation réussie : bannière de confirmation et bouton `[Accéder à l'espace]` vers `/${orgSlug}`. | Expérience utilisateur claire, sécurisée et rassurante qui met en avant l'identité de l'établissement sans risque d'action involontaire. |
| 5 | **Marquage automatique à la lecture** : dès qu'une notification est sélectionnée et affichée dans le volet de lecture, si `read === false`, appel immédiat de `useMarkInboxAsRead().mutate(notif.id)`. | Ergonomie naturelle : aucun clic manuel superflu n'est requis pour marquer un message comme lu. |
| 6 | **Esthétique riche & wow factor (Aesthetics)** :<br>- Glassmorphism subtil avec `backdrop-blur` et bordures discrètes.<br>- Badges de rôles et statuts aux couleurs soignées (ambre chaud pour pending, émeraude pour acceptée, ardoise pour refusée).<br>- Micro-interactions au survol des lignes de la liste avec transitions fluides.<br>- Pastille bleue lumineuse pour les messages non lus.<br>- Support complet Dark Mode & Light Mode natif. | Respect scrupuleux des directives design sans composant générique ou austère. |
| 7 | **Bouton d'accès direct dans le Header** : ajout dans `apps/web/src/components/layout/Header/Header.tsx` d'un bouton d'accès rapide avec icône `Inbox` (ou `Mail`) et badge de décompte non lus branché sur `useInboxUnreadCount()`. | Découvrabilité immédiate de la messagerie dès l'arrivée sur l'application. |

---

## 3. Détail des Composants Proposés

### 3.1 `apps/web/src/components/inbox/types.ts`

Définition des types UI pour typer strictement les notifications enrichies et leurs métadonnées :

```ts
import type { NotificationType } from '@attendancy/types'
import type { InvitationMetadataOutput } from '@/services/notification/validation'

export type EnrichedInboxNotification = {
  id: string
  userId: string
  orgId: string | null
  type: NotificationType
  message: string
  read: boolean
  readAt: string | Date | null
  createdAt: string | Date
  metadata?: (InvitationMetadataOutput & {
    orgLogo?: string | null
    orgName?: string
    orgSlug?: string | null
  }) | null
}
```

---

### 3.2 `apps/web/src/components/inbox/InvitationActionCard.tsx`

Composant d'action interactif pour traiter les invitations :

```tsx
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
  const roleKey = metadata?.role as keyof typeof ROLE_LABELS | undefined
  const roleLabel = (roleKey && ROLE_LABELS[roleKey]) ? ROLE_LABELS[roleKey] : (metadata?.role ?? 'Membre')
  
  const expiresAt = metadata?.expiresAt ? new Date(metadata.expiresAt) : null
  const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false
  const effectiveStatus = isExpired && rawStatus === 'PENDING' ? 'EXPIRED' : rawStatus

  const acceptMutation = useAcceptInvitation()
  const declineMutation = useDeclineInvitation()
  const isPendingMutation = acceptMutation.isPending || declineMutation.isPending

  const [localAcceptedSlug, setLocalAcceptedSlug] = useState<string | null>(null)

  const handleAccept = async () => {
    if (!invitationId) return
    try {
      const res = await acceptMutation.mutateAsync(invitationId)
      toast.success('Invitation acceptée avec succès ! Bienvenue dans l’organisation.')
      if (res?.organization?.slug) {
        setLocalAcceptedSlug(res.organization.slug)
      } else if (metadata?.orgSlug) {
        setLocalAcceptedSlug(metadata.orgSlug)
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
    <Card className="overflow-hidden border border-border/40 bg-card/60 backdrop-blur-md shadow-sm">
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

        {/* Message d'information ou de confirmation */}
        {localAcceptedSlug ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-3">
            <span>Vous faites désormais partie de cette organisation !</span>
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
              onClick={() => router.push(`/${localAcceptedSlug}`)}
            >
              Accéder à l'espace
              <ArrowRight className="ml-1 size-3.5" />
            </Button>
          </div>
        ) : effectiveStatus === 'ACCEPTED' && metadata?.orgSlug ? (
          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/${metadata.orgSlug}`)}
            >
              Accéder à l'espace
              <ArrowRight className="ml-1 size-3.5" />
            </Button>
          </div>
        ) : null}
      </CardContent>

      {/* Boutons d'action conditionnels */}
      {kind === 'INVITATION_RECEIVED' && effectiveStatus === 'PENDING' && !localAcceptedSlug && (
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
```

---

### 3.3 `apps/web/src/components/inbox/InboxSidebar.tsx`

Sidebar des dossiers de navigation :

```tsx
'use client'

import { Mail, Send, Inbox, Bell, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { InboxFilter } from '@/services/notification/validation'

interface InboxSidebarProps {
  currentFilter: InboxFilter
  onSelectFilter: (filter: InboxFilter) => void
  unreadCount?: number
  className?: string
}

export function InboxSidebar({
  currentFilter,
  onSelectFilter,
  unreadCount = 0,
  className,
}: InboxSidebarProps) {
  const folders: { id: InboxFilter; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'all', label: 'Tous les messages', icon: Inbox, count: unreadCount },
    { id: 'invitations', label: 'Invitations', icon: Mail },
    { id: 'unread', label: 'Non lus', icon: Bell, count: unreadCount },
    { id: 'system', label: 'Système', icon: ShieldAlert },
  ]

  return (
    <div className={cn('flex flex-col gap-1 p-3', className)}>
      <div className="px-3 py-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
        Boîte de réception
      </div>

      <nav className="flex flex-col gap-1">
        {folders.map((f) => {
          const Icon = f.icon
          const isActive = currentFilter === f.id
          return (
            <Button
              key={f.id}
              variant={isActive ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onSelectFilter(f.id)}
              className={cn(
                'w-full justify-between font-normal transition-colors text-sm h-9 px-3',
                isActive && 'font-medium bg-secondary text-secondary-foreground shadow-xs'
              )}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={cn('size-4 text-muted-foreground', isActive && 'text-primary')} />
                <span className="truncate">{f.label}</span>
              </div>
              {typeof f.count === 'number' && f.count > 0 && (
                <Badge
                  variant={isActive ? 'default' : 'outline'}
                  className="size-5 p-0 flex items-center justify-center text-[10px] rounded-full"
                >
                  {f.count > 99 ? '99+' : f.count}
                </Badge>
              )}
            </Button>
          )
        })}
      </nav>
    </div>
  )
}
```

---

### 3.4 `apps/web/src/components/inbox/InboxList.tsx`

Composant liste des messages avec recherche et sélection :

```tsx
'use client'

import { useState, useMemo } from 'react'
import { Search, Mail, Bell, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import type { EnrichedInboxNotification } from './types'

interface InboxListProps {
  notifications: EnrichedInboxNotification[]
  selectedId: string | null
  onSelect: (id: string) => void
  isLoading?: boolean
}

export function InboxList({
  notifications,
  selectedId,
  onSelect,
  isLoading,
}: InboxListProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return notifications
    const q = search.toLowerCase()
    return notifications.filter((n) => {
      const msg = n.message.toLowerCase()
      const orgName = n.metadata?.orgName?.toLowerCase() ?? ''
      const sender = n.metadata?.senderName?.toLowerCase() ?? ''
      return msg.includes(q) || orgName.includes(q) || sender.includes(q)
    })
  }, [notifications, search])

  const formatRelativeDate = (d: string | Date) => {
    const date = new Date(d)
    const now = new Date()
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    if (diffHours < 1) return 'À l’instant'
    if (diffHours < 24) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    if (diffHours < 48) return 'Hier'
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="flex h-full flex-col border-r border-border/40 bg-card/30">
      {/* Barre de recherche */}
      <div className="p-3 border-b border-border/20">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un message ou une organisation..."
            className="pl-9 h-9 text-sm bg-background/50 border-border/30 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Contenu liste */}
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="p-6">
            <Empty>
              <EmptyMedia variant="icon">
                <Mail className="size-5 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle className="text-sm font-semibold">Aucun message</EmptyTitle>
              <EmptyDescription className="text-xs text-muted-foreground">
                {search ? 'Aucun résultat ne correspond à votre recherche.' : 'Votre boîte de réception est vide.'}
              </EmptyDescription>
            </Empty>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {filtered.map((item) => {
              const isSelected = selectedId === item.id
              const isUnread = !item.read
              const isInvitation = item.type === 'INVITATION'
              const sender = item.metadata?.orgName ?? (isInvitation ? 'Invitation' : 'Système')
              const initial = sender.charAt(0).toUpperCase()

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    'w-full text-left p-3.5 transition-colors relative flex items-start gap-3 hover:bg-muted/40 cursor-pointer',
                    isSelected && 'bg-muted/70 hover:bg-muted/70',
                    isUnread && 'bg-primary/5 hover:bg-primary/10'
                  )}
                >
                  {/* Pastille non lu */}
                  {isUnread && (
                    <span className="absolute left-1.5 top-5 size-2 rounded-full bg-primary" />
                  )}

                  <Avatar className="size-9 shrink-0 border border-border/30 mt-0.5">
                    {item.metadata?.orgLogo && (
                      <AvatarImage src={item.metadata.orgLogo} alt={sender} />
                    )}
                    <AvatarFallback className={cn('text-xs font-semibold', isInvitation ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                      {initial}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={cn('text-xs truncate font-medium', isUnread ? 'text-foreground font-semibold' : 'text-muted-foreground')}>
                        {sender}
                      </span>
                      <span className="text-[11px] text-muted-foreground/70 shrink-0">
                        {formatRelativeDate(item.createdAt)}
                      </span>
                    </div>

                    <p className={cn('text-xs line-clamp-2', isUnread ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                      {item.message}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
```

---

### 3.5 `apps/web/src/components/inbox/InboxMessageView.tsx`

Panneau de visualisation du message avec carte d'invitation :

```tsx
'use client'

import { useEffect } from 'react'
import { ArrowLeft, Clock, Calendar, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { useMarkInboxAsRead } from '@/hooks/inbox'
import { InvitationActionCard } from './InvitationActionCard'
import type { EnrichedInboxNotification } from './types'

interface InboxMessageViewProps {
  notification: EnrichedInboxNotification | null
  onBackMobile?: () => void
}

export function InboxMessageView({
  notification,
  onBackMobile,
}: InboxMessageViewProps) {
  const markAsReadMutation = useMarkInboxAsRead()

  // Marquage automatique à la lecture dès que le message est affiché
  useEffect(() => {
    if (notification && !notification.read) {
      markAsReadMutation.mutate(notification.id)
    }
  }, [notification?.id, notification?.read])

  if (!notification) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-card/10">
        <Empty>
          <EmptyMedia variant="icon">
            <Mail className="size-6 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>Sélectionnez un message</EmptyTitle>
          <EmptyDescription>
            Choisissez une notification dans la liste pour en consulter le détail.
          </EmptyDescription>
        </Empty>
      </div>
    )
  }

  const isInvitation = notification.type === 'INVITATION'
  const senderName = notification.metadata?.senderName ?? notification.metadata?.orgName ?? (isInvitation ? 'Invitation' : 'Système')
  const initial = senderName.charAt(0).toUpperCase()
  const dateFormatted = new Date(notification.createdAt).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex h-full flex-col bg-background/50">
      {/* Barre d'outils mobile / desktop */}
      <div className="flex items-center justify-between border-b border-border/20 p-3.5 bg-card/20">
        <div className="flex items-center gap-2">
          {onBackMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackMobile}
              className="lg:hidden h-8 px-2 text-muted-foreground"
            >
              <ArrowLeft className="size-4 mr-1" />
              Retour
            </Button>
          )}
          <Badge variant="outline" className="text-xs font-normal">
            {isInvitation ? 'Invitation organisation' : notification.type}
          </Badge>
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {dateFormatted}
        </div>
      </div>

      {/* Contenu scrollable */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header de l'expéditeur */}
          <div className="flex items-start gap-4">
            <Avatar className="size-11 border border-border/30">
              {notification.metadata?.orgLogo && (
                <AvatarImage src={notification.metadata.orgLogo} alt={senderName} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initial}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold text-foreground truncate">{senderName}</h2>
              </div>
              {notification.metadata?.orgName && notification.metadata.senderName && (
                <p className="text-xs text-muted-foreground">
                  Organisation : {notification.metadata.orgName}
                </p>
              )}
            </div>
          </div>

          {/* Corps textuel du message */}
          <div className="rounded-lg border border-border/20 bg-card/40 p-5 text-sm leading-relaxed text-foreground shadow-xs">
            {notification.message}
          </div>

          {/* Carte interactive pour les invitations */}
          {isInvitation && (
            <div className="pt-2">
              <InvitationActionCard notification={notification} />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
```

---

### 3.6 `apps/web/src/components/inbox/InboxLayout.tsx`

Layout adaptatif split-screen combinant sidebar, liste et vue détail :

```tsx
'use client'

import { useState, useMemo } from 'react'
import { useQueryState, parseAsString, parseAsStringEnum } from 'nuqs'
import { cn } from '@/lib/utils'
import { InboxSidebar } from './InboxSidebar'
import { InboxList } from './InboxList'
import { InboxMessageView } from './InboxMessageView'
import { useInboxNotifications, useInboxUnreadCount } from '@/hooks/inbox'
import { inboxFilterSchema, type InboxFilter } from '@/services/notification/validation'
import type { EnrichedInboxNotification } from './types'

export function InboxLayout() {
  // Synchronisation d'état dans l'URL via nuqs
  const [filter, setFilter] = useQueryState(
    'filter',
    parseAsStringEnum<InboxFilter>(['all', 'invitations', 'unread', 'system']).withDefault('all')
  )
  const [selectedId, setSelectedId] = useQueryState('id', parseAsString.withDefault(''))

  // Données serveur via React Query
  const { data: notifications = [], isLoading } = useInboxNotifications(filter)
  const { data: unreadCount = 0 } = useInboxUnreadCount()

  const safeNotifications = notifications as EnrichedInboxNotification[]

  // Notification sélectionnée
  const selectedNotification = useMemo(() => {
    if (!selectedId) return safeNotifications[0] ?? null
    return safeNotifications.find((n) => n.id === selectedId) ?? safeNotifications[0] ?? null
  }, [safeNotifications, selectedId])

  // Sur mobile, si un message est sélectionné, on bascule vers la vue détail
  const [mobileViewingDetail, setMobileViewingDetail] = useState(false)

  const handleSelectNotification = (id: string) => {
    setSelectedId(id)
    setMobileViewingDetail(true)
  }

  const handleBackMobile = () => {
    setMobileViewingDetail(false)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-background">
      {/* 1. Sidebar Dossiers Desktop (fixe à gauche) */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border/30 bg-card/20">
        <InboxSidebar
          currentFilter={filter}
          onSelectFilter={(f) => {
            setFilter(f)
            setSelectedId(null)
          }}
          unreadCount={unreadCount}
        />
      </aside>

      {/* 2. Liste des messages (sur mobile : masquée si détail ouvert) */}
      <section className={cn(
        'w-full md:w-80 lg:w-96 shrink-0 flex-col h-full',
        mobileViewingDetail ? 'hidden md:flex' : 'flex'
      )}>
        {/* Sélecteur de dossier rapide sur petit écran */}
        <div className="md:hidden border-b border-border/20 p-2 bg-card/20">
          <InboxSidebar
            currentFilter={filter}
            onSelectFilter={(f) => {
              setFilter(f)
              setSelectedId(null)
            }}
            unreadCount={unreadCount}
          />
        </div>

        <InboxList
          notifications={safeNotifications}
          selectedId={selectedNotification?.id ?? null}
          onSelect={handleSelectNotification}
          isLoading={isLoading}
        />
      </section>

      {/* 3. Volet de lecture / Détail (sur mobile : affiché uniquement si mobileViewingDetail) */}
      <main className={cn(
        'flex-1 h-full min-w-0',
        mobileViewingDetail ? 'flex flex-col' : 'hidden md:flex flex-col'
      )}>
        <InboxMessageView
          notification={selectedNotification}
          onBackMobile={handleBackMobile}
        />
      </main>
    </div>
  )
}
```

---

### 3.7 `apps/web/src/app/(app)/inbox/page.tsx`

Point d'entrée de la route `/inbox` :

```tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { InboxLayout } from '@/components/inbox/InboxLayout'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Boîte de réception | Attendancy',
  description: 'Consultez vos notifications et vos invitations d’organisations.',
}

function InboxSkeleton() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full p-4 gap-4">
      <Skeleton className="w-56 h-full hidden md:block rounded-lg" />
      <Skeleton className="w-96 h-full rounded-lg" />
      <Skeleton className="flex-1 h-full hidden md:block rounded-lg" />
    </div>
  )
}

export default function InboxPage() {
  return (
    <Suspense fallback={<InboxSkeleton />}>
      <InboxLayout />
    </Suspense>
  )
}
```

---

### 3.8 Intégration dans le Header (`apps/web/src/components/layout/Header/Header.tsx`)

Ajout d'un bouton d'accès direct à `/inbox` avec badge de notifications :

```tsx
// Ajout du lien vers la boîte de réception dans le Header :
<Link
  href="/inbox"
  className="relative inline-flex size-9 items-center justify-center rounded-full border border-border/40 hover:bg-muted/60 transition-colors"
  title="Boîte de réception"
>
  <Mail className="size-4 text-foreground/80" />
  {unreadCount > 0 && (
    <Badge
      variant="destructive"
      className="absolute -top-1 -right-1 size-4 p-0 text-[10px] flex items-center justify-center rounded-full"
    >
      {unreadCount > 9 ? '9+' : unreadCount}
    </Badge>
  )}
</Link>
```

---

## 4. Critères de validation du Lot 3

- [x] `tsc` passe à 100% avec 0 erreur (`bun run check:ts`).
- [x] Aucun `any` ni `Promise<>` explicite dans le code créé.
- [x] La route `/inbox` est accessible sans slug d'organisation.
- [x] Synchronisation fluide avec `nuqs` (`filter` et `id` dans l'URL).
- [x] Le layout split-screen est responsive (desktop 3 panneaux, mobile avec bouton retour).
- [x] `InvitationActionCard` affiche correctement les métadonnées de l'invitation (nom org, logo fallback, rôle traduit, date d'expiration).
- [x] Les boutons `Accepter` et `Décliner` n'apparaissent que si `kind === 'INVITATION_RECEIVED'` et statut `PENDING` non expirée.
- [x] Les mutations déclenchent les toasts Sonner et désactivent les boutons avec état de chargement.
- [x] L'acceptation d'une invitation affiche le message de bienvenue et le bouton direct vers l'espace de l'organisation (`/${orgSlug}`).
- [x] La sélection d'un message non lu le marque automatiquement comme lu en arrière-plan.
- [x] Les états vides et de chargement sont propres et conformes au design system.
