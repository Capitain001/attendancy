'use client'
// Écran client d'invitation : liste des participants + bouton "Ajouter", dialog d'invitation et inscription d'étudiants existants.

import { useMemo } from 'react'
import { UserPlus } from 'lucide-react'

import { useClassInvitations } from '@/hooks/data/invitation/use-class-invitations'
import { useAvailableStudents } from '@/hooks/data/student-enrollments/useAvailableStudents'
import { TeacherClassInviteDialog } from '@/components/personal/teacher/class/invitation/TeacherClassInviteDialog'
import { EnrollStudentsPanel } from '@/components/personal/student-enrollment/enroll-students-panel'
import { useClassEnrollments } from '@/hooks/data/student-enrollments'
import { ParticipantList } from './ParticipantList'
import { EnrollStudentsModal } from '../../personal/student-enrollment/enroll-students-modal'

interface TClassInvitationScreenProps {
  classId: string
  classLabel: string
}

export function TClassInvitationScreen({ classId, classLabel }: TClassInvitationScreenProps) {
  const { inviteStudentSilent } = useClassInvitations(classId)
  const { enrollments } = useClassEnrollments(classId)
  const { available } = useAvailableStudents(classId)

  // `enrollment.student` a déjà la forme attendue : aucun mapping.
  const participants = useMemo(() => enrollments.map((e) => e.student), [enrollments])

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-center text-[22px] font-semibold leading-tight">
        Ajouter de nouveaux participants
      </h1>

      {/* participants */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          {/* <h2 className="text-[16px] font-medium">Participants</h2> */}
          {/* <span className="text-[13px] text-muted-foreground">voir plus…</span> */}
        </div>

        <div className="flex items-start gap-3 py-1">
          <TeacherClassInviteDialog
            classLabel={classLabel}
            students={available}
            onSendEmail={(input) =>
              inviteStudentSilent.mutateAsync({ ...input, classId, deliveryMethod: 'email' })
            }
            onCreateLink={(input) =>
              inviteStudentSilent.mutateAsync({ ...input, classId, deliveryMethod: 'link' })
            }
            trigger={
              <button
                type="button"
                className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-[12px] text-foreground"
              >
                <span className="flex size-14 border border-dashed items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/70">
                  <UserPlus className="size-6" />
                </span>
                Ajouter
              </button>
            }
          />

          <ParticipantList participants={participants} />
        </div>
      </section>

      {/* inscription d'étudiants existants */}
      <section className="space-y-3">
        <h2 className="text-[16px] font-medium">Inscrire des étudiants existants</h2>
        <EnrollStudentsModal className='' classId={classId} />
      </section>
    </div>
  )
}