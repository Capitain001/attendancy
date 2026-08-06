'use client'

interface DescriptionDialogProps {
  open: boolean
  value: string
  onChange: (v: string) => void
  onClose: () => void
  onSave: () => void
}

export function DescriptionDialog({
  open,
  value,
  onChange,
  onClose,
  onSave,
}: DescriptionDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-sm font-medium text-foreground mb-4">Description du cours</h2>
        <textarea
          className="w-full min-h-[140px] resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ajouter une description…"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:bg-muted/50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
