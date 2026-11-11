import { format } from "date-fns/format";
import { fr } from "date-fns/locale";
import { Lock, Plus } from "lucide-react";

import type { ScheduleEvent } from "@/components/event-calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { resolveScheduleUiStatus } from "@/services/schedule/policy";

/**
 * Liste du jour, rendue dans le drawer. Présentation seule :
 * ouverture / création sont déléguées à l'hôte (`onAdd` absent => création impossible).
 */
export function TeacherPlanningPreview({
  date,
  events,
  onSelect,
  onAdd,
  className,
}: {
  date: Date;
  events: ScheduleEvent[];
  onSelect: (event: ScheduleEvent) => void;
  onAdd?: () => void;
  className?: string;
}) {
  const now = new Date();
  const rows = events.map((e) => {
    const status = resolveScheduleUiStatus(
      { status: e.meta.status ?? "PENDING", startTime: e.start, endTime: e.end },
      now
    );
    return { e, status, done: status === "COMPLETED" || status === "MISSED" };
  });
  const doneCount = rows.filter((r) => r.done).length;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-8 md:mt-4 pb-6 space-y-8">
        <h2 className="mb-8 text-sm capitalize text-muted-foreground flex justify-between">
          {format(date, "EEEE d MMMM", { locale: fr })}
          {events.length > 0 && (
            <span className="tabular-nums normal-case">
              {" "}· {doneCount}/{events.length} terminé{doneCount > 1 ? "s" : ""}
            </span>
          )}
        </h2>

        {events.length === 0 ? (
          <p className="mb-6 text-2xl font-medium">Pas de cours ce jour-là.</p>
        ) : (
          <div>
            <div className="flex items-center gap-4 border-b pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="w-12 shrink-0">Heure</span>
              <span className="min-w-0 flex-1">Cours</span>
              <span className="shrink-0">Salle</span>
            </div>
            <ul className="divide-y">
              {rows.map(({ e, status, done }) => {
                const canceled = e.meta.status === "CANCELED";
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(e)}
                      className={cn(
                        "flex w-full items-baseline gap-4 py-3.5 text-left transition-opacity hover:opacity-70",
                        (done || canceled) && "opacity-50",
                        canceled && "line-through"
                      )}
                    >
                      <span className="w-12 shrink-0 text-sm tabular-nums text-muted-foreground">
                        {format(e.start, "HH:mm")}
                      </span>
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="truncate">{e.title}</span>
                        {status === "ONGOING" && (
                          <span className="size-1.5 shrink-0 rounded-full bg-green-500" aria-label="En cours" />
                        )}
                      </span>
                      {e.location && (
                        <span className="shrink-0 text-xs text-muted-foreground">{e.location}</span>
                      )}
                      {e.meta.isLocked && (
                        <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-label="Verrouillée" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {onAdd && (
          <div className="pt-4">
            <Button onClick={onAdd} className="w-full">
              <Plus className="size-4" /> Ajouter une séance
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}