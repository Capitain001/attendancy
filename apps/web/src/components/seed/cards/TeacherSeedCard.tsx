'use client'

import { useState } from 'react'
import { generateTeachersAction } from '@/services/seed'
import { useSeedAction } from '@/hooks/data/seed'
import { ButtonX } from '@/components/design/ButtonX'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import { GraduationCap, Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface TeacherSeedCardProps {
  orgId: string
  departments?: { id: string; name: string }[]
}

export function TeacherSeedCard({ orgId, departments = [] }: TeacherSeedCardProps) {
  const [count, setCount] = useState<number>(10)
  const [departmentId, setDepartmentId] = useState<string>('all')

  const { execute, isPending, result, error } = useSeedAction(generateTeachersAction)

  const handleGenerate = () => {
    execute(orgId, {
      count: Number(count) || 10,
      departmentId: departmentId !== 'all' ? departmentId : undefined,
    })
  }

  const createdCount = result?.filter((item) => item.status === 'created').length ?? 0
  const failedCount = result?.filter((item) => item.status === 'failed').length ?? 0

  return (
    <div className={cn(card.base, 'p-5 flex flex-col gap-4')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            <GraduationCap className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Enseignants</h3>
            <p className={cn(typography.small, 'text-muted-foreground')}>
              Génère des profils enseignants avec identités fictives
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="teacher-count" className="text-xs">Nombre à générer</Label>
          <Input
            id="teacher-count"
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="teacher-dept" className="text-xs">Département d'attachement</Label>
          <Select value={departmentId} onValueChange={setDepartmentId} disabled={isPending}>
            <SelectTrigger id="teacher-dept" className="w-full">
              <SelectValue placeholder="Choisir un département" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Aléatoire (Aucun spécifique)</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <ButtonX
          onClick={handleGenerate}
          disabled={isPending || !orgId.trim()}
          icon={isPending ? <Loader2 className="size-4 animate-spin" /> : <GraduationCap className="size-4" />}
          className="w-full sm:w-auto"
        >
          {isPending ? 'Génération...' : 'Générer les enseignants'}
        </ButtonX>

        {result && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="size-3.5" /> {createdCount} créés
            </span>
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
            <div key={idx} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
              <span className="font-medium truncate max-w-[180px]">
                {item.fullName ?? 'Identité inconnue'}
              </span>
              <span className="text-muted-foreground font-mono text-[11px] truncate max-w-[200px]">
                {item.email}
              </span>
              {item.status === 'created' ? (
                <span className="text-emerald-600 text-[10px] font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  OK
                </span>
              ) : (
                <span className="text-destructive text-[10px] font-mono bg-destructive/10 px-1.5 py-0.5 rounded">
                  Échec
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
