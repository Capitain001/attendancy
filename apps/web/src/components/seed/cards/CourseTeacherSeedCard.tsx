'use client'

import { useState } from 'react'
import { linkRandomTeachersToCoursesAction } from '@/services/seed'
import { useSeedAction } from '@/hooks/data/seed'
import { ButtonX } from '@/components/design/ButtonX'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import { Link2, Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface CourseTeacherSeedCardProps {
  orgId: string
  classes?: { id: string; name: string; level?: string }[]
}

export function CourseTeacherSeedCard({ orgId, classes = [] }: CourseTeacherSeedCardProps) {
  const [classId, setClassId] = useState<string>('all')
  const [onlyMissingMain, setOnlyMissingMain] = useState<boolean>(false)

  const { execute, isPending, result, error } = useSeedAction(linkRandomTeachersToCoursesAction)

  const handleLink = () => {
    execute(orgId, {
      classId: classId !== 'all' ? classId : undefined,
      onlyMissingMain,
    })
  }

  const linkedCount = result?.filter((item) => item.status === 'linked').length ?? 0
  const skippedCount = result?.filter((item) => item.status === 'skipped').length ?? 0
  const failedCount = result?.filter((item) => item.status === 'failed').length ?? 0

  return (
    <div className={cn(card.base, 'p-5 flex flex-col gap-4')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Link2 className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Liaison Cours ↔ Profs</h3>
            <p className={cn(typography.small, 'text-muted-foreground')}>
              Affecte aléatoirement des enseignants responsables aux cours
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        <div className="space-y-1.5">
          <Label htmlFor="link-class" className="text-xs">Classe cible</Label>
          <Select value={classId} onValueChange={setClassId} disabled={isPending}>
            <SelectTrigger id="link-class" className="w-full">
              <SelectValue placeholder="Toutes les classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes (Org entière)</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} {cls.level ? `(${cls.level})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 pb-2">
          <Checkbox
            id="only-missing-main"
            checked={onlyMissingMain}
            onCheckedChange={(checked) => setOnlyMissingMain(!!checked)}
            disabled={isPending}
          />
          <Label htmlFor="only-missing-main" className="text-xs cursor-pointer select-none">
            Uniquement cours sans responsable
          </Label>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <ButtonX
          onClick={handleLink}
          disabled={isPending || !orgId.trim()}
          icon={isPending ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
          className="w-full sm:w-auto"
        >
          {isPending ? 'Liaison en cours...' : 'Associer les enseignants'}
        </ButtonX>

        {result && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="size-3.5" /> {linkedCount} liés
            </span>
            {skippedCount > 0 && (
              <span className="text-muted-foreground font-medium">
                {skippedCount} ignorés
              </span>
            )}
            {failedCount > 0 && (
              <span className="text-destructive font-medium flex items-center gap-1">
                <XCircle className="size-3.5" /> {failedCount} échecs
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded bg-destructive/10 text-destructive text-xs">
          {error}
        </div>
      )}

      {result && result.length > 0 && (
        <div className="mt-2 max-h-40 overflow-y-auto rounded border bg-muted/30 p-2 text-xs space-y-1">
          {result.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0 font-mono text-[11px]">
              <span className="truncate max-w-[180px]">
                Cours: {item.courseId}
              </span>
              <span>
                {item.teacherId ? `Prof: ${item.teacherId}` : item.reason ?? item.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
