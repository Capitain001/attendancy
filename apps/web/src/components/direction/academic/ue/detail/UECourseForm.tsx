'use client'
import { useRef } from 'react'
import { useUECourse } from '@/hooks/data/ue-course/useUECourse'
import { input } from '@/styles/input'
import { Button } from '@/components/ui/button'
import { Plus, Edit } from 'lucide-react'
import { FormDialog } from '@/components/ui/FormDialog'
import { DialogFooter } from '@/components/ui/dialog'
import type { GetUEByIdDto } from '@/services/ue'

type UECourse = NonNullable<GetUEByIdDto>['ueCourses'][number]

interface FormProps {
  ueId: string
  course?: UECourse
  close: () => void
}

function CourseForm({ ueId, course, close }: FormProps) {
  const { create, update, isCreating, isUpdating } = useUECourse({ ueId })
  const ref = useRef<HTMLFormElement>(null)
  
  const isPending = isCreating || isUpdating

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name     = fd.get('name') as string
    const code     = (fd.get('code') as string) || null
    const credits  = parseInt(fd.get('credits') as string, 10)
    const duration = parseInt(fd.get('duration') as string, 10)

    if (course) {
      await update?.({
        id: course.id,
        data: { name, code, credits, duration }
      })
    } else {
      await create?.({ name, code, credits, duration, ueId })
    }
    
    close()
  }

  return (
    <form ref={ref} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="course-name" className={input.label}>Intitulé de l'EC *</label>
        <input
          id="course-name"
          name="name"
          type="text"
          required
          autoFocus
          defaultValue={course?.name}
          placeholder="ex: Base de données"
          className={input.base}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="course-code" className={input.label}>Code</label>
        <input
          id="course-code"
          name="code"
          type="text"
          defaultValue={course?.code || ''}
          placeholder="ex: BD101"
          className={input.base}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="course-credits" className={input.label}>Crédits *</label>
          <input
            id="course-credits"
            name="credits"
            type="number"
            min="1"
            max="10"
            required
            defaultValue={course?.credits ?? 3}
            className={input.base}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="course-duration" className={input.label}>Volume Horaire (h) *</label>
          <input
            id="course-duration"
            name="duration"
            type="number"
            min="1"
            max="200"
            required
            defaultValue={course?.duration ?? 30}
            className={input.base}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" size="sm" onClick={close}>Annuler</Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function UECourseCreateButton({ ueId }: { ueId: string }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline" className="gap-2 shrink-0">
          <Plus className="size-3.5" />
          Nouveau cours
        </Button>
      }
      title="Ajouter un Élément Constitutif (EC)"
    >
      {(close) => <CourseForm ueId={ueId} close={close} />}
    </FormDialog>
  )
}

export function UECourseEditAction({ ueId, course, onSelect }: { ueId: string, course: UECourse, onSelect: (e: Event) => void }) {
  return (
    <FormDialog
      trigger={
        <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent">
          <Edit className="mr-2 h-4 w-4" />
          Modifier l'EC
        </div>
      }
      onOpenChange={(open) => {
        if (!open) {
          // Permet de fermer le DropdownMenu parent proprement si on annule
          // Le trigger lui-même empêche la fermeture par défaut via e.preventDefault()
          setTimeout(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })), 0)
        }
      }}
      title="Modifier l'Élément Constitutif"
    >
      {(close) => <CourseForm ueId={ueId} course={course} close={close} />}
    </FormDialog>
  )
}
