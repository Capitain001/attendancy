'use client'

import { useState } from 'react'
import { generateStudentsAction } from '@/services/seed'
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
import { Users, Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface StudentSeedCardProps {
  orgId: string
  classes?: { id: string; name: string; level?: string }[]
}

export function StudentSeedCard({ orgId, classes = [] }: StudentSeedCardProps) {
  const [count, setCount] = useState<number>(10)
  const [enrollInClassId, setEnrollInClassId] = useState<string>('none')

  const { execute, isPending, result, error } = useSeedAction(generateStudentsAction)

  const handleGenerate = () => {
    execute(orgId, {
      count: Number(count) || 10,
      enrollInClassId: enrollInClassId !== 'none' ? enrollInClassId : undefined,
    })
  }

  const createdCount = result?.filter((item) => item.status === 'created').length ?? 0
  const failedCount = result?.filter((item) => item.status === 'failed').length ?? 0

  return (
    <div className={cn(card.base, 'p-5 flex flex-col gap-4')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Users className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Étudiants</h3>
            <p className={cn(typography.small, 'text-muted-foreground')}>
              Génère des comptes étudiants et gère leur inscription
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="student-count" className="text-xs">Nombre à générer</Label>
          <Input
            id="student-count"
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="student-class" className="text-xs">Classe d'inscription</Label>
          <Select value={enrollInClassId} onValueChange={setEnrollInClassId} disabled={isPending}>
            <SelectTrigger id="student-class" className="w-full">
              <SelectValue placeholder="Choisir une classe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune (Non-inscrit)</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} {cls.level ? `(${cls.level})` : ''}
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
          icon={isPending ? <Loader2 className="size-4 animate-spin" /> : <Users className="size-4" />}
          className="w-full sm:w-auto"
        >
          {isPending ? 'Génération...' : 'Générer les étudiants'}
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
              <span className="text-[10px] font-mono text-muted-foreground">
                {item.enrollmentId ? 'Inscrit' : 'Non-inscrit'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
