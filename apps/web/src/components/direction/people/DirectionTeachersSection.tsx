'use client'

import { useState } from 'react'
import { SectionHeader } from '@/components/direction/SectionHeader'
import { TeacherList } from './TeacherList'
import { InviteTeacherDialog } from './InviteTeacherDialog'
import { useOrgInvitations } from '@/hooks/data/invitation/use-org-invitations'
import { typography } from '@/styles'
import InviteUserPlaceholder from '@/components/invitation/InviteUserPlaceholder'
import type { GetTeachersDto } from '@/services/teacher'

interface DirectionTeachersSectionProps {
  teachers: GetTeachersDto
  slug: string
}

export function DirectionTeachersSection({ teachers, slug }: DirectionTeachersSectionProps) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const { inviteTeacher } = useOrgInvitations()

  return (
    <div className="flex flex-col gap-6 ">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <SectionHeader 
          title="Équipe pédagogique" 
          description="Gérez les enseignants, leurs départements d'affectation et leurs cours."
        />
        <div className="flex items-center gap-4">
          <span className={typography.small}>
            {teachers.length} enseignant{teachers.length !== 1 ? 's' : ''}
          </span>
          <InviteTeacherDialog 
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            onInviteTeacher={(input) => inviteTeacher.mutateAsync(input)}
          />
        </div>
      </div>

      {teachers.length === 0 ? (
        <InviteUserPlaceholder
          title="Inviter vos premiers enseignants"
          subtitle="Constituez votre équipe pédagogique en invitant des enseignants."
          onCreateLink={() => setInviteOpen(true)}
        />
      ) : (
        <TeacherList teachers={teachers} slug={slug} />
      )}
    </div>
  )
}
