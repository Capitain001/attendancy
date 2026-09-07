'use client'
import { useState } from 'react'
import { Loader2, RotateCw, Trash2, Share2, ChevronRight, CircleAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  resolveInvitationStatus,
  getStatusBadgeInfo,
  filterInvitationsByStatus,
  type InvitationStatus,
} from '@/modules/invitation/status'
import type { InvitationListItem } from '@/modules/invitation'
import { cn } from '@/lib/utils'

interface InvitationTableProps {
  invitations: InvitationListItem[]
  onResend: (inv: InvitationListItem) => void
  onRevoke: (inv: InvitationListItem) => void
  onShare?: (inv: InvitationListItem) => void
  pending?: boolean
}

const FILTERS: { value: 'all' | InvitationStatus; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'accepted', label: 'Acceptées' },
  { value: 'expired', label: 'Expirées' },
]

function formatDate(d: Date | string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function InvitationTable({ invitations, onResend, onRevoke, onShare, pending }: InvitationTableProps) {
  const [filter, setFilter] = useState<'all' | InvitationStatus>('all')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [showExpiry, setShowExpiry] = useState(false)
  const [visibleActions, setVisibleActions] = useState<Set<string>>(new Set())

  const rows = filterInvitationsByStatus(invitations, filter)

  function toggleActions(id: string) {
    setVisibleActions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-3">
      {/* Filtres + toggle expiration */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[12px] transition-colors',
                filter === f.value
                  ? 'bg-foreground text-background'
                  : 'border border-foreground/15 text-muted-foreground hover:bg-foreground/[0.04]',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowExpiry((v) => !v)}
          title={showExpiry ? "Masquer la date d'expiration" : "Afficher la date d'expiration"}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          Expiration
          <ChevronRight
            className={cn('size-3.5 transition-transform', showExpiry ? 'rotate-180' : 'rotate-0')}
          />
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">Aucune invitation.</p>
      ) : (
        <ul className="divide-y divide-foreground/10">
          {rows.map((inv) => {
            const status = resolveInvitationStatus(inv)
            const badge = getStatusBadgeInfo(status)
            const role = inv.details?.role ?? '—'
            const confirming = confirmId === inv.id
            const actionsVisible = visibleActions.has(inv.id)
            return (
              <li key={inv.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">{inv.email}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {role} · créée le {formatDate(inv.createdAt)}
                  </p>
                </div>

                {status !== 'accepted' ? (
                  <button
                    type="button"
                    onClick={() => toggleActions(inv.id)}
                    title={actionsVisible ? 'Masquer les actions' : 'Afficher les actions'}
                    className="relative inline-flex shrink-0 appearance-none border-0 bg-transparent p-0"
                  >
                    <Badge variant={badge.variant} className="rounded-sm border-4 text-[10px]">
                      {badge.label}
                    </Badge>

                    <span
                      className={cn(
                        'absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-background text-muted-foreground shadow-sm ring-1 ring-foreground/10 transition-colors',
                        actionsVisible && 'text-foreground ring-foreground/20',
                      )}
                    >
                      <CircleAlert className="size-full" />
                    </span>
                  </button>
                ) : (
                  <div className="relative shrink-0">
                    <Badge variant={badge.variant} className="rounded-sm border-4 text-[10px]">
                      {badge.label}
                    </Badge>
                  </div>
                )}

                {showExpiry && (
                  <span className="text-xs text-muted-foreground">
                    date d'expiration : {formatDate(inv.expiresAt)}
                  </span>
                )}

                <div className="flex shrink-0 items-center gap-1">
                  {status !== 'accepted' && actionsVisible && (
                    <button
                      type="button"
                      onClick={() => onResend(inv)}
                      disabled={pending}
                      title="Relancer"
                      className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground disabled:opacity-40"
                    >
                      <RotateCw className="size-3.5" />
                    </button>
                  )}

                  {status !== 'accepted' && actionsVisible && onShare && (
                    <button
                      type="button"
                      onClick={() => onShare(inv)}
                      disabled={pending}
                      title="Partager le lien"
                      className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground disabled:opacity-40"
                    >
                      <Share2 className="size-3.5" />
                    </button>
                  )}

                  {confirming ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onRevoke(inv)
                          setConfirmId(null)
                        }}
                        disabled={pending}
                        className="inline-flex items-center gap-1 rounded-md bg-destructive px-2 py-1 text-[11px] font-medium text-destructive-foreground disabled:opacity-50"
                      >
                        {pending && <Loader2 className="size-3 animate-spin" />} Confirmer
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="rounded-md border border-foreground/15 px-2 py-1 text-[11px] text-muted-foreground"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(inv.id)}
                      title="Révoquer"
                      className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}