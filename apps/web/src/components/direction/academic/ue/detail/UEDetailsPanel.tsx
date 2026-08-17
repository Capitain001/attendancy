import { card } from "@/styles"
import { cn } from "@/lib/utils"
import type { GetUEByIdDto } from "@/services/ue"

type UE = NonNullable<GetUEByIdDto>

export function UEDetailsPanel({ ue }: { ue: UE }) {
  return (
    <div className={cn(card.base, "p-6 flex flex-col gap-6")}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Département</h3>
          <p className="text-sm text-muted-foreground">
            {ue.department?.name ?? "Aucun département rattaché"}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Type</h3>
          <p className="text-sm text-muted-foreground">
            {ue.isOptional ? "Unité d'Enseignement Optionnelle" : "Unité d'Enseignement Obligatoire"}
          </p>
        </div>
      </div>

      {ue.description && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Description</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {ue.description}
          </p>
        </div>
      )}
    </div>
  )
}
