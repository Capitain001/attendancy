import { cn } from "@/lib/utils";
import React from "react";

/**
 * Interface pour les props du composant WeekdaysHeader
 */
interface WeekdaysHeaderProps {
  /** Tableau des noms des jours de la semaine à afficher */
  weekdays: string[];
}

/**
 * Composant d'en-tête affichant les noms des jours de la semaine
 * 
 * Ce composant est responsable de :
 * - Afficher les noms des jours de la semaine en format court (Lun, Mar, etc.)
 * - Maintenir un style cohérent pour l'en-tête du calendrier
 * - Gérer la mise en page sur 7 colonnes
 */


export function WeekdaysHeader({ weekdays }: WeekdaysHeaderProps) {
  return (
    <div className="grid grid-cols-7 border rounded-t-sm bg-muted">
      {weekdays.map((day, index) => (
        <div
          key={day}
          className={cn(
            "py-2 text-center text-sm ",
            [5, 6].includes(index) // 5 = samedi, 6 = dimanche
              ? "text-muted-foreground/50 bg-muted/70"
              : "text-muted-foreground/70",
              "border-r border-dashed",
          )}
        >
          {day}
        </div>
      ))}
    </div>
  );
}
