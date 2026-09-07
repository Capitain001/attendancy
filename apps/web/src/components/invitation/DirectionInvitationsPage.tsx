'use client'
// Hub Direction : stats + historique + dialog d'invitation staff.

import { MetricCard } from '@/components/stats/ui/MetricCard'
import { CollapseSection } from '@/components/layout/CollapseSection'
import { useOrgInvitations, useInvitationStats } from '@/hooks/data/invitation/use-org-invitations'
import { InviteDialog } from './InviteDialog'
import { GlobalInviteStudentDialog } from './GlobalInviteStudentDialog'
import { InvitationTable } from './InvitationTable'
import { InvitationFilter } from './InvitationFilter'
import { useInvitationsFilter } from './hooks/use-invitations-filter'

interface DirectionInvitationsPageProps {
  functions: { id: string; name: string }[]
}

export function DirectionInvitationsPage({ functions }: DirectionInvitationsPageProps) {
  const { invitations, inviteTeacher, inviteDirection, resend, revoke, share } = useOrgInvitations()
  const { stats } = useInvitationStats()

  const {
    query,
    setQuery,
    role,
    setRole,
    status,
    setStatus,
    filteredInvitations
  } = useInvitationsFilter(invitations)

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold text-foreground">Invitations</h1>
          <p className="text-[13px] text-muted-foreground">
            Invitez le personnel et suivez l'onboarding.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GlobalInviteStudentDialog />
          <InviteDialog
            functions={functions}
            onInviteTeacher={(input) => inviteTeacher.mutateAsync(input)}
            onInviteDirection={(input) =>
              inviteDirection.mutateAsync({
                email: input.email,
                name: input.name,
                functions: input.functions ?? [],
              })
            }
          />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Total" value={String(stats?.total ?? 0)} sub="invitations" />
        <MetricCard label="En attente" value={String(stats?.pending ?? 0)} sub="à confirmer" />
        <MetricCard label="Acceptées" value={String(stats?.accepted ?? 0)} sub="comptes activés" />
        <MetricCard label="Expirées" value={String(stats?.expired ?? 0)} sub="à relancer" />
      </section>

      <CollapseSection label="Toutes les invitations" count={filteredInvitations.length} defaultOpen>
        <div className="space-y-4">
          <InvitationFilter
            query={query}
            setQuery={setQuery}
            role={role}
            setRole={setRole}
            status={status}
            setStatus={setStatus}
          />
          <InvitationTable
            invitations={filteredInvitations}
            onResend={(inv) => resend.mutate(inv)}
            onRevoke={(inv) => revoke.mutate(inv)}
            onShare={share}
            pending={resend.isPending || revoke.isPending}
          />
        </div>
      </CollapseSection>
    </div>
  )
}
