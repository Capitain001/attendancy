'use client'
// Écran client d'invitation : liste des participants + bouton "Ajouter", dialog d'invitation et inscription d'étudiants existants.

import { useMemo } from 'react'
import { PlusCircleIcon, UserPlus } from 'lucide-react'

import { useClassInvitations } from '@/hooks/data/invitation/use-class-invitations'
import { useAvailableStudents } from '@/hooks/data/student-enrollments/useAvailableStudents'
import { TeacherClassInviteDialog } from '@/components/personal/teacher/class/invitation/TeacherClassInviteDialog'
import { useClassEnrollments } from '@/hooks/data/student-enrollments'
import { shareInviteLink } from '@/lib/invitation/toast'
import { ParticipantList } from './ParticipantList'

interface TClassInvitationScreenProps {
  classId: string
  classLabel: string
}

export function TClassInvitationScreen({ classId, classLabel }: TClassInvitationScreenProps) {
  const { inviteStudent } = useClassInvitations(classId, {
    deliverLink: (link) => shareInviteLink(link, `Rejoins ${classLabel}`),
    toastError: false, // l'erreur est affichée inline dans le dialog
  })
  const { enrollments } = useClassEnrollments(classId)
  const { available } = useAvailableStudents(classId)

  // `enrollment.student` a déjà la forme attendue : aucun mapping.
  const participants = useMemo(() => enrollments.map((e) => e.student), [enrollments])

  return (
    <div className="space-y-6 p-4 ">
      <h1 className="text-center text-[22px] font-semibold leading-tight">
        Ajouter de nouveaux participants
      </h1>

      {/* participants */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          
        </div>

        <div className="flex items-start gap-3 py-1">

          <TeacherClassInviteDialog
            students={available}
            onSendEmail={(input) =>
              inviteStudent.mutateAsync({ ...input, classId, deliveryMethod: 'email' })
            }
            onCreateLink={(input) =>
              inviteStudent.mutateAsync({ ...input, classId, deliveryMethod: 'link' })
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

      </section>
    </div>
  )
}