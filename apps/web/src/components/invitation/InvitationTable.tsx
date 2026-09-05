'use client'
import { useState } from 'react'
import { Loader2, RotateCw, Trash2, Share2, ChevronDown, ChevronRight } from 'lucide-react'

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

  const rows = filterInvitationsByStatus(invitations, filter)

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
            return (
              <li key={inv.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">{inv.email}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {role} · créée le {formatDate(inv.createdAt)}
                  </p>
                </div>

                <Badge variant={badge.variant} className="rouned-sm border-4 text-[10px]">
                  {badge.label}
                </Badge>

                {showExpiry && (
                  <span className="text-xs text-muted-foreground">
                    date d'expiration : {formatDate(inv.expiresAt)}
                  </span>
                )}

         <div className="flex shrink-0 items-center gap-1">
                  {status !== 'accepted' && (
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

                  {status !== 'accepted' && onShare && (
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
