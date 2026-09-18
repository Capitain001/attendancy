"use client";

import { AlertCircle, Calendar, Clock, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { card, typography } from "@/styles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TeacherUnavailabilityItem } from "@/services/teacher-unavailability/types";

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function formatTime(d: Date | string | null) {
  if (!d) return "—";
  const date = new Date(d);
  return `${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`;
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return format(new Date(d), "dd MMMM yyyy", { locale: fr });
}

export function TeacherUnavailabilitiesList({
  items,
  onEdit,
  onDelete,
}: {
  items: TeacherUnavailabilityItem[];
  onEdit: (item: TeacherUnavailabilityItem) => void;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className={cn(card.soft, "flex flex-col items-center justify-center p-10 text-center text-muted-foreground mt-4")}>
        <AlertCircle className="size-10 mb-3 opacity-20" />
        <p className="text-base font-medium text-text-primary">Aucune indisponibilité</p>
        <p className="text-sm mt-1">Vous n'avez déclaré aucune indisponibilité pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 mt-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((u) => {
        const isWeekly = u.type === "WEEKLY";

        return (
          <div key={u.id} className={cn(card.soft, "flex flex-col gap-3 p-4 relative group")}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {isWeekly ? (
                  <Clock className="size-4 text-blue-500" />
                ) : (
                  <Calendar className="size-4 text-orange-500" />
                )}
                <span className="text-sm font-medium">
                  {isWeekly ? "Hebdomadaire" : "Ponctuelle"}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(u)}>
                  <Edit className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                  if (confirm("Voulez-vous vraiment supprimer cette indisponibilité ?")) {
                    onDelete(u.id);
                  }
                }}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              {isWeekly && u.dayOfWeek !== null ? (
                <>
                  <p className="font-medium text-text-primary">{DAYS[u.dayOfWeek]}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(u.startTime)} – {formatTime(u.endTime)}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-text-primary">
                    {formatDate(u.startDate)}
                  </p>
                  {u.endDate && u.startDate?.toString() !== u.endDate?.toString() && (
                    <p className="text-sm text-muted-foreground">
                      au {formatDate(u.endDate)}
                    </p>
                  )}
                </>
              )}
            </div>

            {u.reason && (
              <div className="mt-2 p-2 bg-secondary rounded-md text-sm italic text-muted-foreground">
                {u.reason}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
