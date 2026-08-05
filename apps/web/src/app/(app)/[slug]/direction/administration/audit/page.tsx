import { connection } from 'next/server'
import { getOrgAuditLogsAction } from '@/services/audit'
import { typography, card } from '@/styles'
import { cn } from '@/lib/utils'
import { ScrollText } from 'lucide-react'

function formatDate(d: Date) {
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const ACTION_BADGE: Record<string, string> = {
  CREATE: 'bg-green-500/10 text-green-600',
  UPDATE: 'bg-primary/10 text-primary',
  DELETE: 'bg-red-500/10 text-red-500',
  REMOVE: 'bg-orange-500/10 text-orange-500',
}

export default async function AuditPage() {
  await connection()
  const result = await getOrgAuditLogsAction({ limit: 50 })

  if ('error' in result) {
    return <p className={typography.body}>{result.error}</p>
  }

  type AuditEntry = {
    id: string
    action: string
    resource: string | null
    resourceId: string | null
    createdAt: Date
    userId: string | null
    user: { firstName: string | null; lastName: string | null } | null
  }
  const { items, hasNext } = result.data as unknown as { items: AuditEntry[]; hasNext: boolean; nextCursor: string | null }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-text-primary">Journal d'activité</h1>
        <span className={typography.small}>{items.length} entrée{items.length !== 1 ? 's' : ''}{hasNext ? '+' : ''}</span>
      </div>

      {items.length === 0 ? (
        <div className={cn(card.soft, 'py-12 text-center')}>
          <ScrollText className="mx-auto mb-3 size-8 text-text-subtle" strokeWidth={1} />
          <p className={typography.body}>Aucune activité enregistrée.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/40">
                <th className={cn(typography.label, 'px-4 py-2 text-left font-medium')}>Action</th>
                <th className={cn(typography.label, 'px-4 py-2 text-left font-medium')}>Ressource</th>
                <th className={cn(typography.label, 'px-4 py-2 text-left font-medium hidden md:table-cell')}>Par</th>
                <th className={cn(typography.label, 'px-4 py-2 text-left font-medium hidden md:table-cell')}>Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((entry) => {
                const actor = [entry.user?.firstName, entry.user?.lastName].filter(Boolean).join(' ')
                const badgeCls = ACTION_BADGE[entry.action] ?? 'bg-muted text-text-subtle'
                return (
                  <tr key={entry.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', badgeCls)}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      <span className="font-medium">{entry.resource}</span>
                    </td>
                    <td className="px-4 py-3 text-text-subtle hidden md:table-cell">
                      {actor || '—'}
                    </td>
                    <td className="px-4 py-3 text-text-subtle hidden md:table-cell">
                      {formatDate(entry.createdAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
