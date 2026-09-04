import { Button } from "@/components/ui/button";
import type { useStudentsTable } from "../useStudentsTable";

export function FooterBar({ t, selectedCount }: { t: ReturnType<typeof useStudentsTable>; selectedCount: number }) {
  return (
    <div className="flex items-center justify-between border-t px-3 py-1.5 text-xs text-muted-foreground">
      <span>
        {selectedCount > 0 ? `${selectedCount} sélectionné(s) · ` : ""}
        page {t.pageIndex + 1}/{t.pageCount}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-6.5 px-2 text-[11px]" onClick={t.previousPage} disabled={!t.canPreviousPage}>
          Précédent
        </Button>
        <Button variant="ghost" size="sm" className="h-6.5 px-2 text-[11px]" onClick={t.nextPage} disabled={!t.canNextPage}>
          Suivant
        </Button>
      </div>
    </div>
  );
}
