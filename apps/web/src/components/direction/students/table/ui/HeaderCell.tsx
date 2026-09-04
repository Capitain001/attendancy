import { cn } from "@/lib/utils";
import type { BaseColumnDef } from "../types";
import { HEADER_BORDER_CLASS, TIER_HEADER_CLASS } from "../presentation";
import type { useStudentsTable } from "../useStudentsTable";
import { HideButton, SortArrow } from "./TableHelpers";

export function HeaderCell({ column, t }: { column: BaseColumnDef; t: ReturnType<typeof useStudentsTable> }) {
  const Icon = column.icon;
  return (
    <th
      className={cn(
        "border-r border-r-border/40 px-2 py-1.5 text-left align-middle",
        HEADER_BORDER_CLASS,
      )}
      style={{ minWidth: column.width }}
    >
      <div className="flex items-center gap-1.5">
        {column.sortId ? (
          <button
            type="button"
            onClick={() => t.toggleSort(column.sortId!)}
            className={cn("flex items-center gap-1.5", TIER_HEADER_CLASS[column.tier])}
          >
            <Icon className="size-3.5 text-muted-foreground" />
            {column.label}
            <SortArrow dir={t.sortDirectionOf(column.sortId)} />
          </button>
        ) : (
          <span className={cn("flex items-center gap-1.5", TIER_HEADER_CLASS[column.tier])}>
            <Icon className="size-3.5 text-muted-foreground" />
            {column.label}
          </span>
        )}
        {t.editMode && <HideButton onClick={() => t.hideColumn(column.id)} />}
      </div>
    </th>
  );
}
