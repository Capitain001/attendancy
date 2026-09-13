"use client";

import { useEffect, useMemo, useState } from "react";
import { endOfWeek, isSameDay, isWithinInterval, startOfWeek } from "date-fns";

import { EndHour, StartHour } from "@/components/event-calendar/constants";

export function useCurrentTimeIndicator(
  currentDate: Date,
  view: "day" | "week",
) {
  // Source unique de vérité : l'heure actuelle
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    // Recalcule immédiatement au montage / changement de dépendances
    setNow(new Date());

    // Puis toutes les minutes
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [currentDate, view]);

  // Toutes les valeurs dérivées, recalculées seulement si now/currentDate/view changent
  const { currentTime, currentTimePosition, currentTimeVisible } = useMemo(() => {
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Position en % dans la plage [StartHour, EndHour]
    const totalMinutes = (hours - StartHour) * 60 + minutes;
    const dayStartMinutes = 0;
    const dayEndMinutes = (EndHour - StartHour) * 60;

    const position =
      ((totalMinutes - dayStartMinutes) / (dayEndMinutes - dayStartMinutes)) *
      100;

    // Visibilité selon la vue (jour ou semaine)
    let isCurrentTimeVisible = false;

    if (view === "day") {
      isCurrentTimeVisible = isSameDay(now, currentDate);
    } else if (view === "week") {
      const startOfWeekDate = startOfWeek(currentDate, { weekStartsOn: 0 });
      const endOfWeekDate = endOfWeek(currentDate, { weekStartsOn: 0 });
      isCurrentTimeVisible = isWithinInterval(now, {
        start: startOfWeekDate,
        end: endOfWeekDate,
      });
    }

    // Format "H:mm" (ex: "8:40", "14:05")
    const formattedTime = `${hours}:${minutes.toString().padStart(2, "0")}`;

    return {
      currentTime: formattedTime,
      currentTimePosition: position,
      currentTimeVisible: isCurrentTimeVisible,
    };
  }, [now, currentDate, view]);

  return { currentTime, currentTimePosition, currentTimeVisible };
}