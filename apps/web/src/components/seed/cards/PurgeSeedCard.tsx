'use client'

import { useState } from 'react'
import { purgeSeedDataAction } from '@/services/seed'
import { useSeedAction } from '@/hooks/data/seed'
import { ButtonX } from '@/components/design/ButtonX'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

interface PurgeSeedCardProps {
  orgId: string
}

export function PurgeSeedCard({ orgId }: PurgeSeedCardProps) {
  const [seedBatchId, setSeedBatchId] = useState<string>('')
  const [showConfirm, setShowConfirm] = useState<boolean>(false)

  const { execute, isPending, result, error, reset } = useSeedAction(purgeSeedDataAction)

  const handlePurge = () => {
    execute(orgId, {
      seedBatchId: seedBatchId.trim() || undefined,
    })
    setShowConfirm(false)
  }

  return (
    <div className={cn(card.base, 'p-5 flex flex-col gap-4 border-destructive/30 bg-destructive/[0.02]')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-destructive/10 text-destructive">
            <Trash2 className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-destructive">Purge des Données de Seed</h3>
            <p className={cn(typography.small, 'text-muted-foreground')}>
              Supprime les utilisateurs et liens générés avec l'étiquette seed
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="purge-batch" className="text-xs">
          Batch ID Spécifique (Optionnel — vider pour tout purger)
        </Label>
        <Input
          id="purge-batch"
          type="text"
          placeholder="batch_..."
          value={seedBatchId}
          onChange={(e) => {
            setSeedBatchId(e.target.value)
            setShowConfirm(false)
          }}
          disabled={isPending}
        />
      </div>

      {!showConfirm ? (
        <div className="flex items-center justify-between pt-1">
          <ButtonX
            onClick={() => {
              reset()
              setShowConfirm(true)
            }}
            disabled={isPending || !orgId.trim()}
            icon={<Trash2 className="size-4 text-destructive" />}
            className="w-full sm:w-auto hover:bg-destructive/10 hover:text-destructive"
          >
            {seedBatchId.trim() ? `Purger le batch ${seedBatchId}` : 'Purger TOUTES les données de seed'}
          </ButtonX>
        </div>
      ) : (
        <div className="p-3 rounded border border-destructive/40 bg-destructive/10 flex flex-col gap-3">
          <div className="flex items-start gap-2 text-xs text-destructive">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Confirmation requise :</span> Cette action supprimera définitivement les {seedBatchId.trim() ? `données du batch ${seedBatchId}` : 'données de seed de cette organisation'}.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ButtonX
              onClick={handlePurge}
              disabled={isPending}
              icon={isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Purge en cours...' : 'Oui, purger maintenant'}
            </ButtonX>
            <ButtonX
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
              variant="outline"
            >
              Annuler
            </ButtonX>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded bg-destructive/10 text-destructive text-xs">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-2 rounded border bg-muted/40 p-3 text-xs space-y-1.5 font-mono">
          <div className="font-sans font-semibold text-foreground pb-1 border-b border-border/40">
            Résumé de la purge :
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>Utilisateurs supprimés: <span className="font-bold">{result.usersDeleted}</span></div>
            <div>Inscriptions supprimées: <span className="font-bold">{result.enrollmentsDeleted}</span></div>
            <div>Relations parents supprimées: <span className="font-bold">{result.parentRelationsDeleted}</span></div>
            <div>Liaisons cours/profs supprimées: <span className="font-bold">{result.courseTeacherLinksDeleted}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}
