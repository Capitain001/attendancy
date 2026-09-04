import { cn } from "@/lib/utils";
import { sexLabel } from "@/components/direction/students/utils";
import type { BaseColumnDef, Sex } from "../types";
import { TIER_CELL_CLASS } from "../presentation";
import { Muted } from "./TableHelpers";

export function ReadCell({ column, value }: { column: BaseColumnDef; value: string }) {
  if (column.id === "presence") {
    if (!value) return <Muted />;
    return <span className={cn(TIER_CELL_CLASS[column.tier], "tabular-nums")}>{value}%</span>;
  }
  if (column.kind === "sex") {
    return <span className={TIER_CELL_CLASS[column.tier]}>{sexLabel(value as Sex)}</span>;
  }
  if (!value) return <Muted />;
  return (
    <span
      className={cn(
        TIER_CELL_CLASS[column.tier],
        column.id === "phone" && "font-mono",
        "truncate",
      )}
    >
      {value}
    </span>
  );
}
