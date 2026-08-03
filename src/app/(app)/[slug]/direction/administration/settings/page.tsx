import { connection } from 'next/server'
import { getOrgIdentityAction, getOrgDetailsAction } from '@/services/organization'
import { typography, card } from '@/styles'
import { cn } from '@/lib/utils'
import { Building2, Globe, Mail } from 'lucide-react'

export default async function SettingsPage() {
  await connection()

  const [identityResult, detailsResult] = await Promise.all([
    getOrgIdentityAction(),
    getOrgDetailsAction(),
  ])

  if ('error' in identityResult) {
    return <p className={typography.body}>{identityResult.error}</p>
  }

  const org     = identityResult.data
  const details = 'data' in detailsResult ? detailsResult.data : null

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-base font-semibold text-text-primary">Paramètres de l'organisation</h1>

      <div className={cn(card.base, 'flex flex-col gap-4')}>
        <span className={typography.label}>Identité</span>

        <div className="flex flex-col gap-3">
          <Row icon={Building2} label="Nom" value={org?.name} />
          <Row icon={Mail}      label="Email" value={org?.email} />
          <Row icon={Globe}     label="Domaine" value={org?.domain} />
          <Row icon={Globe}     label="Slug" value={org?.slug} />
        </div>
      </div>

      {details && Object.keys(details).length > 0 && (
        <div className={cn(card.base, 'flex flex-col gap-4')}>
          <span className={typography.label}>Détails</span>
          <pre className={cn(typography.small, 'whitespace-pre-wrap break-all')}>
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-4 shrink-0 text-text-subtle" strokeWidth={1.5} />
      <span className={cn(typography.small, 'w-20 shrink-0')}>{label}</span>
      <span className="text-sm text-text-primary">{value ?? '—'}</span>
    </div>
  )
}
