// apps/web/src/app/(app)/personal/[slug]/teacher/classes/[id]/invitation/page.tsx
// Page de prévisualisation/test des UI d'invitation (classe thématique). Données mock.

import { ParticipantList } from '@/components/users/list/ParticipantList';
import { MOCK_PARTICIPANTS } from '@/data/mocks/mock.user'
import { TeacherClassInviteButton } from './InviteSandbox';

export default async function ClassInvitationPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { id } = await params

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-center text-[22px] font-semibold leading-tight">
        Ajouter de nouveaux participants
      </h1>
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[16px] font-medium">Participants</h2>
          <span className="text-[13px] text-muted-foreground">voir plus…</span>
        </div>

        <div className="flex items-start gap-3 py-1">
          <TeacherClassInviteButton classId={id} classLabel="Masterclass React" />
          <ParticipantList participants={MOCK_PARTICIPANTS} />
        </div>
      </section>
    </div>
  )
}