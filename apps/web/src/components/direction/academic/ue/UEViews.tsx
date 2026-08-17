import { CollapseSection } from "@/components/layout/CollapseSection"
import { UECard } from "./UeCard"
import { UETableView } from "./UETableView"
import { card, typography } from "@/styles"
import { cn } from "@/lib/utils"
import type { GetUEsDto } from "@/services/ue"

type UEItem = GetUEsDto[number]

interface DeptGroup {
  deptId: string | null
  deptName: string
  ues: UEItem[]
}

interface UEViewsProps {
  groups: DeptGroup[]
  viewMode: "grid" | "list"
  totalFiltered: number
}

export function UEViews({ groups, viewMode, totalFiltered }: UEViewsProps) {
  if (totalFiltered === 0) {
    return (
      <div className={cn(card.soft, "py-12 text-center")}>
        <p className={typography.body}>
          Aucune UE ne correspond à ces critères.
        </p>
      </div>
    )
  }

  return (
    <div>
      {groups.map((group) => (
        <CollapseSection
          key={group.deptId ?? "__none__"}
          label={group.deptName}
          count={group.ues.length}
          defaultOpen
        >
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 justify-items-center gap-x-3 gap-y-6 md:gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {group.ues.map((ue) => (
                <UECard key={ue.id} ue={ue} />
              ))}
            </div>
          ) : (
            <UETableView ues={group.ues} />
          )}
        </CollapseSection>
      ))}
    </div>
  )
}

export type { DeptGroup }
