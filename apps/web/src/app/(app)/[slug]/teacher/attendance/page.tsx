import { connection } from 'next/server'
import { ClipboardCheck } from 'lucide-react'
import { getCurrentTeacherId } from '@/services/teacher'

export default async function Page() {
  await connection()

  const teacherId = await getCurrentTeacherId()
  if (!teacherId) return <div />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Enseignant
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Présences</h1>
        <p className="text-sm text-muted-foreground">
          Suivi des présences pour vos séances.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-16 text-center gap-3">
        <ClipboardCheck className="size-10 text-muted-foreground/30" />
        <div>
          <p className="text-sm font-medium">Section en développement</p>
          <p className="text-xs text-muted-foreground mt-1">
            Le suivi des présences sera disponible prochainement.
          </p>
        </div>
      </div>
    </div>
  )
}
