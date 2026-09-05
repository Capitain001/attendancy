import { card } from "@/styles"
import { cn } from "@/lib/utils"
import type { GetUEByIdDto } from "@/services/ue"

type UE = NonNullable<GetUEByIdDto>

export function UEDetailsPanel({ ue }: { ue: UE }) {
  return (
    <div className={cn(card.base, "p-6 flex flex-col gap-6")}>
      <div className="flex flex-col sm:flex-row sm:justify-between gap-6">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-semibold text-foreground">Département</h3>
          <p className="text-sm text-muted-foreground">
            {ue.department?.name ?? "Aucun département rattaché"}
          </p>
        </div>

        <div className="flex items-baseline gap-2">
          {/* <h3 className="text-sm font-semibold text-foreground">Type</h3> */}
          <p className="text-sm text-muted-foreground">
            {ue?.type}
            {/* {ue.isOptional ? "Unité d'Enseignement Optionnelle" : "Unité d'Enseignement Obligatoire"} */}
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