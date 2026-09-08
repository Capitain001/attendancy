"use client"

import { Button } from "@/components/ui/button"
import { useCheckMainFunctions } from "@/hooks/data/functions"

interface CheckMainFunctionsButtonProps {
  label?: string
}

export function CheckMainFunctionsButton({
  label = "Vérifier les fonctions principales",
}: CheckMainFunctionsButtonProps) {
  const { check, result, error, isPending } = useCheckMainFunctions()

  return (
    <div className="flex items-center gap-3">
      <Button onClick={check} disabled={isPending}>
        {isPending ? "Vérification…" : label}
      </Button>

      {result !== null && !error && (
        <span className="text-sm text-muted-foreground">
          {result ? "Toutes présentes" : "Il en manque"}
        </span>
      )}

      {error && (
        <span className="text-sm text-destructive">{error}</span>
      )}
    </div>
  )
}