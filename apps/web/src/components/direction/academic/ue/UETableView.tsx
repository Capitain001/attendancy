import Link from "next/link"
import { cn } from "@/lib/utils"
import { typography } from "@/styles"
import type { GetUEsDto } from "@/services/ue"

type UEItem = GetUEsDto[number]

export function UETableView({ ues }: { ues: UEItem[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/30">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/30 bg-muted/40">
            <th className={cn(typography.label, "px-4 py-2 text-left font-medium")}>Code</th>
            <th className={cn(typography.label, "px-4 py-2 text-left font-medium")}>Intitulé</th>
            <th className={cn(typography.label, "px-4 py-2 text-left font-medium hidden md:table-cell")}>Département</th>
            <th className={cn(typography.label, "px-4 py-2 text-center font-medium")}>EC</th>
            <th className={cn(typography.label, "px-4 py-2 text-center font-medium hidden md:table-cell")}>Crédits</th>
            <th className={cn(typography.label, "px-4 py-2 text-center font-medium hidden md:table-cell")}>Type</th>
          </tr>
        </thead>
        <tbody>
          {ues.map((ue) => {
            const totalCredits = ue.ueCourses.reduce((s, c) => s + c.credits, 0)
            return (
              <tr
                key={ue.id}
                className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {ue.code ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`./ues/${ue.id}`}
                    className="font-medium text-foreground hover:opacity-80 transition-opacity"
                  >
                    {ue.name || "Intitulé non renseigné"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {ue.department?.name ?? <span className="italic text-muted-foreground/60">—</span>}
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground">
                  {ue.ueCourses.length}
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">
                  {totalCredits}
                </td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  {ue.isOptional ? (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary">
                      Optionnelle
                    </span>
                  ) : (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                      Obligatoire
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
