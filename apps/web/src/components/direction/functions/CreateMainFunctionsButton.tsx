"use client"

import { Button } from "@/components/ui/button"
import { useCreateMainFunctions } from "@/hooks/data/functions"

interface CreateMainFunctionsButtonProps {
  label?: string
}

export function CreateMainFunctionsButton({
  label = "Créer les fonctions principales",
}: CreateMainFunctionsButtonProps) {
  const { createMainFunctions, isPending, error, data } = useCreateMainFunctions()

  return (
    <div className="flex items-center gap-3">
      <Button onClick={() => createMainFunctions()} disabled={isPending}>
        {isPending ? "Création…" : label}
      </Button>

      {data && !error && (
        <span className="text-sm text-muted-foreground">
          {data.length} fonction{data.length > 1 ? "s" : ""} créée{data.length > 1 ? "s" : ""}
        </span>
      )}

      {error && (
        <span className="text-sm text-destructive">{error}</span>
      )}
    </div>
  )
}